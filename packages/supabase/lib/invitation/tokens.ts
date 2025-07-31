import { randomBytes } from "crypto";
import { createClient } from "@seeds/supabase/client/server";
import type { Database } from "@seeds/supabase/types/db";

export interface TokenValidationResult {
	valid: boolean;
	invitation?: Database["public"]["Tables"]["organization_invitations"]["Row"];
	error?: "expired" | "not_found" | "already_accepted" | "invalid_format";
}

export const generateInvitationToken = (): string => {
	const randomPart = randomBytes(32).toString("hex");
	return `inv_${randomPart}`;
};

export const validateInvitationToken = async (
	token: string,
): Promise<TokenValidationResult> => {
	if (!token || typeof token !== "string") {
		return { valid: false, error: "invalid_format" };
	}

	if (!token.startsWith("inv_")) {
		return { valid: false, error: "invalid_format" };
	}

	const supabase = await createClient();
	const { data: invitation, error } = await supabase
		.from("organization_invitations")
		.select("*")
		.eq("token", token)
		.single();

	if (error || !invitation) {
		return { valid: false, error: "not_found" };
	}

	if (invitation.accepted_at) {
		return { valid: false, error: "already_accepted" };
	}

	const now = new Date();
	const expiresAt = new Date(invitation.expires_at);

	if (now > expiresAt) {
		return { valid: false, error: "expired" };
	}

	return { valid: true, invitation };
};

export const generateInvitationExpiresAt = (daysFromNow = 7): Date => {
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + daysFromNow);
	return expiresAt;
};
