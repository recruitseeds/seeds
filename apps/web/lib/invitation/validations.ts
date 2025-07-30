import { z } from "zod";

export const roleEnum = z.enum([
	"admin",
	"recruiter",
	"hiring_manager",
	"member",
]);

export const sendInvitationSchema = z.object({
	email: z
		.string()
		.email("Please enter a valid email address")
		.max(255, "Email address is too long")
		.toLowerCase()
		.trim(),
	role: roleEnum,
});

export const invitationSchema = sendInvitationSchema;

export const bulkInvitationSchema = z.object({
	invitations: z
		.array(
			z.object({
				email: z.string().email().max(255).toLowerCase().trim(),
				role: roleEnum,
			}),
		)
		.min(1, "At least one invitation is required")
		.max(100, "Cannot send more than 100 invitations at once"),
});

export const acceptInvitationSchema = z.object({
	token: z.string().min(1, "Invitation token is required"),
	firstName: z
		.string()
		.min(1, "First name is required")
		.max(50, "First name is too long")
		.trim(),
	lastName: z
		.string()
		.min(1, "Last name is required")
		.max(50, "Last name is too long")
		.trim(),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.max(128, "Password is too long"),
});

export const resendInvitationSchema = z.object({
	invitationId: z.string().uuid("Invalid invitation ID"),
	organizationId: z.string().uuid("Invalid organization ID"),
});

export type SendInvitationInput = z.infer<typeof sendInvitationSchema>;
export type InvitationInput = z.infer<typeof invitationSchema>;
export type BulkInvitationInput = z.infer<typeof bulkInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type ResendInvitationInput = z.infer<typeof resendInvitationSchema>;
