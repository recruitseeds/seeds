import type { SupabaseClient } from "@supabase/supabase-js";
import {
	generateInvitationExpiresAt,
	generateInvitationToken,
} from "@/lib/invitation/tokens";
import type { Database, TablesInsert, TablesUpdate } from "../types/db";

type Client = SupabaseClient<Database>;

export type CreateInvitationParams = {
	organizationId: string;
	email: string;
	role: string;
	invitedBy: string;
};

export type UpdateInvitationParams =
	TablesUpdate<"organization_invitations"> & {
		id: string;
	};

export async function createInvitation(
	supabase: Client,
	params: CreateInvitationParams,
): Promise<{
	data: Database["public"]["Tables"]["organization_invitations"]["Row"] | null;
	error: Error | null;
}> {
	const insertData: TablesInsert<"organization_invitations"> = {
		organization_id: params.organizationId,
		email: params.email.toLowerCase().trim(),
		role: params.role,
		invited_by: params.invitedBy,
		token: generateInvitationToken(),
		expires_at: generateInvitationExpiresAt().toISOString(),
		created_at: new Date().toISOString(),
	};

	const { data, error } = await supabase
		.from("organization_invitations")
		.insert(insertData)
		.select()
		.single();

	if (error) {
		return { data: null, error: new Error(error.message) };
	}

	return { data, error: null };
}

export async function createBulkInvitations(
	supabase: Client,
	invitations: CreateInvitationParams[],
): Promise<{
	data:
		| Database["public"]["Tables"]["organization_invitations"]["Row"][]
		| null;
	error: Error | null;
}> {
	const insertData: TablesInsert<"organization_invitations">[] =
		invitations.map((invitation) => ({
			organization_id: invitation.organizationId,
			email: invitation.email.toLowerCase().trim(),
			role: invitation.role,
			invited_by: invitation.invitedBy,
			token: generateInvitationToken(),
			expires_at: generateInvitationExpiresAt().toISOString(),
			created_at: new Date().toISOString(),
		}));

	const { data, error } = await supabase
		.from("organization_invitations")
		.insert(insertData)
		.select();

	if (error) {
		return { data: null, error: new Error(error.message) };
	}

	return { data, error: null };
}

export async function updateInvitation(
	supabase: Client,
	params: UpdateInvitationParams,
): Promise<{
	data: Database["public"]["Tables"]["organization_invitations"]["Row"] | null;
	error: Error | null;
}> {
	const { id, ...updateData } = params;

	const { data, error } = await supabase
		.from("organization_invitations")
		.update(updateData)
		.eq("id", id)
		.select()
		.single();

	if (error) {
		return { data: null, error: new Error(error.message) };
	}

	return { data, error: null };
}

export async function acceptInvitation(
	supabase: Client,
	invitationId: string,
): Promise<{
	data: Database["public"]["Tables"]["organization_invitations"]["Row"] | null;
	error: Error | null;
}> {
	const { data, error } = await supabase
		.from("organization_invitations")
		.update({
			accepted_at: new Date().toISOString(),
		})
		.eq("id", invitationId)
		.select()
		.single();

	if (error) {
		return { data: null, error: new Error(error.message) };
	}

	return { data, error: null };
}

export async function resendInvitation(
	supabase: Client,
	invitationId: string,
	organizationId: string,
): Promise<{
	data: Database["public"]["Tables"]["organization_invitations"]["Row"] | null;
	error: Error | null;
}> {
	const now = new Date();
	const newExpiresAt = generateInvitationExpiresAt();
	const { data: currentInvitation } = await supabase
		.from("organization_invitations")
		.select("resent_count")
		.eq("id", invitationId)
		.single();

	const newResentCount = (currentInvitation?.resent_count || 0) + 1;
	const { data, error } = await supabase
		.from("organization_invitations")
		.update({
			expires_at: newExpiresAt.toISOString(),
			resent_count: newResentCount,
			last_resent_at: now.toISOString(),
		})
		.eq("id", invitationId)
		.eq("organization_id", organizationId)
		.is("accepted_at", null)
		.select()
		.single();

	if (error) {
		return { data: null, error: new Error(error.message) };
	}

	return { data, error: null };
}

export async function cancelInvitation(
	supabase: Client,
	invitationId: string,
	organizationId: string,
): Promise<{
	success: boolean;
	error: Error | null;
}> {
	const { error } = await supabase
		.from("organization_invitations")
		.delete()
		.eq("id", invitationId)
		.eq("organization_id", organizationId)
		.is("accepted_at", null);

	if (error) {
		return { success: false, error: new Error(error.message) };
	}

	return { success: true, error: null };
}

export async function cleanupExpiredInvitations(
	supabase: Client,
	organizationId?: string,
): Promise<{
	deletedCount: number;
	error: Error | null;
}> {
	let query = supabase
		.from("organization_invitations")
		.delete()
		.lt("expires_at", new Date().toISOString())
		.is("accepted_at", null);

	if (organizationId) {
		query = query.eq("organization_id", organizationId);
	}

	const { error, count } = await query;

	if (error) {
		return { deletedCount: 0, error: new Error(error.message) };
	}

	return { deletedCount: count || 0, error: null };
}
