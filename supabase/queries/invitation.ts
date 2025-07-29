import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "../types/db";

type Client = SupabaseClient<Database>;
export type Invitation = Tables<"organization_invitations">;

export interface InvitationWithInviter extends Invitation {
	inviter_name?: string;
	organization_name?: string;
}

export async function getInvitationsByOrganization(
	supabase: Client,
	organizationId: string,
	includeAccepted = false,
): Promise<{
	data: InvitationWithInviter[] | null;
	error: Error | null;
}> {
	let query = supabase
		.from("organization_invitations")
		.select(`
      *,
      invited_by:organization_users!company_invitations_invited_by_fkey(
        name
      ),
      organization:organizations!organization_invitations_organization_id_fkey(
        name
      )
    `)
		.eq("organization_id", organizationId)
		.order("created_at", { ascending: false });

	if (!includeAccepted) {
		query = query.is("accepted_at", null);
	}

	const { data, error } = await query;

	if (error) {
		return { data: null, error: new Error(error.message) };
	}

	const enrichedData = data?.map((invitation) => ({
		...invitation,
		inviter_name:
			(invitation.invited_by as { name?: string })?.name || "Unknown",
		organization_name:
			(invitation.organization as { name?: string })?.name ||
			"Unknown Organization",
	}));

	return { data: enrichedData || [], error: null };
}

export async function getInvitationByToken(
	supabase: Client,
	token: string,
): Promise<{
	data: InvitationWithInviter | null;
	error: Error | null;
}> {
	const { data, error } = await supabase
		.from("organization_invitations")
		.select(`
      *,
      invited_by:organization_users!company_invitations_invited_by_fkey(
        name
      ),
      organization:organizations!organization_invitations_organization_id_fkey(
        name,
        logo_url
      )
    `)
		.eq("token", token)
		.single();

	if (error) {
		return { data: null, error: new Error(error.message) };
	}

	const enrichedData = {
		...data,
		inviter_name: (data.invited_by as { name?: string })?.name || "Unknown",
		organization_name:
			(data.organization as { name?: string })?.name || "Unknown Organization",
	};

	return { data: enrichedData, error: null };
}

export async function getInvitationById(
	supabase: Client,
	invitationId: string,
	organizationId?: string,
): Promise<{
	data: Invitation | null;
	error: Error | null;
}> {
	let query = supabase
		.from("organization_invitations")
		.select("*")
		.eq("id", invitationId);

	if (organizationId) {
		query = query.eq("organization_id", organizationId);
	}

	const { data, error } = await query.single();

	if (error) {
		return { data: null, error: new Error(error.message) };
	}

	return { data, error: null };
}

export async function getInvitationStats(
	supabase: Client,
	organizationId: string,
	days = 30,
): Promise<{
	data: {
		total: number;
		pending: number;
		accepted: number;
		expired: number;
		recent: number;
	};
	error: Error | null;
}> {
	const recentDate = new Date();
	recentDate.setDate(recentDate.getDate() - days);

	const { data, error } = await supabase
		.from("organization_invitations")
		.select("accepted_at, expires_at, created_at")
		.eq("organization_id", organizationId);

	if (error) {
		return {
			data: { total: 0, pending: 0, accepted: 0, expired: 0, recent: 0 },
			error: new Error(error.message),
		};
	}

	const now = new Date();
	const stats = {
		total: data.length,
		pending: 0,
		accepted: 0,
		expired: 0,
		recent: 0,
	};

	for (const invitation of data) {
		if (!invitation.created_at) continue;

		const createdAt = new Date(invitation.created_at);
		const expiresAt = new Date(invitation.expires_at);

		if (createdAt >= recentDate) {
			stats.recent++;
		}

		if (invitation.accepted_at) {
			stats.accepted++;
		} else if (now > expiresAt) {
			stats.expired++;
		} else {
			stats.pending++;
		}
	}

	return { data: stats, error: null };
}
