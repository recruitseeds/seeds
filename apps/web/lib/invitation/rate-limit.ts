import { createClient } from "@/supabase/client/server";

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetTime: Date;
	current: number;
}

export interface RateLimitConfig {
	maxInvitations: number;
	windowHours: number;
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
	maxInvitations: 50,
	windowHours: 1,
};

export const checkInvitationRateLimit = async (
	organizationId: string,
	config: RateLimitConfig = DEFAULT_RATE_LIMIT,
): Promise<RateLimitResult> => {
	const supabase = await createClient();
	const windowStart = new Date();
	windowStart.setHours(windowStart.getHours() - config.windowHours);

	const { data: recentInvitations, error } = await supabase
		.from("organization_invitations")
		.select("id")
		.eq("organization_id", organizationId)
		.gte("created_at", windowStart.toISOString());

	if (error) {
		throw new Error(`Failed to check rate limit: ${error.message}`);
	}

	const current = recentInvitations?.length || 0;
	const remaining = Math.max(0, config.maxInvitations - current);
	const allowed = current < config.maxInvitations;
	const resetTime = new Date();
	resetTime.setHours(resetTime.getHours() + config.windowHours);

	return {
		allowed,
		remaining,
		resetTime,
		current,
	};
};

export const checkDailyInvitationRateLimit = async (
	organizationId: string,
): Promise<RateLimitResult> => {
	return checkInvitationRateLimit(organizationId, {
		maxInvitations: 200,
		windowHours: 24,
	});
};

export const checkDuplicateInvitation = async (
	organizationId: string,
	email: string,
): Promise<boolean> => {
	const supabase = await createClient();

	const { data: existingInvitation, error } = await supabase
		.from("organization_invitations")
		.select("id")
		.eq("organization_id", organizationId)
		.eq("email", email.toLowerCase().trim())
		.is("accepted_at", null);

	if (error && error.code === "PGRST116") {
		return false;
	}

	if (error) {
		throw new Error(`Failed to check duplicate invitation: ${error.message}`);
	}

	return existingInvitation && existingInvitation.length > 0;
};
