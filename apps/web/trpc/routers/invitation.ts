import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	sendBulkInvitationEmails,
	sendInvitationEmail,
} from "@/lib/email/service";
import {
	checkDuplicateInvitation,
	checkInvitationRateLimit,
} from "@seeds/supabase";
import { validateInvitationToken } from "@seeds/supabase";
import {
	acceptInvitationSchema,
	bulkInvitationSchema,
	invitationSchema,
	resendInvitationSchema,
} from "@/lib/invitation/validations";
import {
	acceptInvitation,
	cancelInvitation,
	createBulkInvitations,
	createInvitation,
	resendInvitation,
} from "@seeds/supabase/mutations/invitation";
import {
	getInvitationById,
	getInvitationByToken,
	getInvitationStats,
	getInvitationsByOrganization,
} from "@seeds/supabase/queries/invitation";
import { handleEmailPasswordSignUp } from "@seeds/supabase/utils/auth";
import { addUserToExistingOrganization } from "@seeds/supabase/utils/organization-setup";
import {
	createTRPCRouter,
	organizationProcedure,
	protectedProcedure,
} from "../init";

export const invitationRouter = createTRPCRouter({
	sendInvitation: organizationProcedure
		.input(invitationSchema)
		.mutation(async ({ ctx, input }) => {
			const { organizationId } = ctx;
			const { email, role } = input;

			try {
				const { data: orgUser, error: orgUserError } = await ctx.supabase
					.from("organization_users")
					.select("id, name")
					.eq("user_id", ctx.user.id)
					.eq("organization_id", organizationId)
					.single();

				if (orgUserError || !orgUser) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Organization user record not found",
					});
				}

				const rateLimit = await checkInvitationRateLimit(organizationId);
				if (!rateLimit.allowed) {
					throw new TRPCError({
						code: "TOO_MANY_REQUESTS",
						message: `Rate limit exceeded. You can send ${rateLimit.remaining} more invitations.`,
					});
				}

				const isDuplicate = await checkDuplicateInvitation(
					organizationId,
					email,
				);
				if (isDuplicate) {
					throw new TRPCError({
						code: "CONFLICT",
						message:
							"An invitation has already been sent to this email address",
					});
				}

				const { data: organization } = await ctx.supabase
					.from("organizations")
					.select("name, logo_url")
					.eq("id", organizationId)
					.single();

				const { data: invitation, error } = await createInvitation(
					ctx.supabase,
					{
						organizationId,
						email,
						role,
						invitedBy: orgUser.id,
					},
				);

				if (error || !invitation) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: error?.message || "Failed to create invitation",
					});
				}

				const acceptUrl = `${process.env.NEXT_PUBLIC_URL}/invitations/accept/${invitation.token}`;
				const emailResult = await sendInvitationEmail({
					to: email,
					inviterName: orgUser.name || "Someone",
					organizationName: organization?.name || "Unknown Organization",
					role,
					acceptUrl,
					organizationLogo: organization?.logo_url || undefined,
				});

				if (!emailResult.success) {
					console.error("Failed to send invitation email:", emailResult.error);
				}

				return {
					invitation,
					emailSent: emailResult.success,
					emailError: emailResult.error,
				};
			} catch (error) {
				console.error("Error in sendInvitation:", error);
				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to send invitation",
				});
			}
		}),

	sendBulkInvitations: organizationProcedure
		.input(bulkInvitationSchema)
		.mutation(async ({ ctx, input }) => {
			const { organizationId } = ctx;
			const { invitations } = input;

			try {
				const { data: orgUser, error: orgUserError } = await ctx.supabase
					.from("organization_users")
					.select("id, name")
					.eq("user_id", ctx.user.id)
					.eq("organization_id", organizationId)
					.single();

				if (orgUserError || !orgUser) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Organization user record not found",
					});
				}

				const rateLimit = await checkInvitationRateLimit(organizationId);
				if (invitations.length > rateLimit.remaining) {
					throw new TRPCError({
						code: "TOO_MANY_REQUESTS",
						message: `Rate limit exceeded. You can only send ${rateLimit.remaining} more invitations.`,
					});
				}

				for (const invitation of invitations) {
					const isDuplicate = await checkDuplicateInvitation(
						organizationId,
						invitation.email,
					);
					if (isDuplicate) {
						throw new TRPCError({
							code: "CONFLICT",
							message: `An invitation has already been sent to ${invitation.email}`,
						});
					}
				}

				const { data: organization } = await ctx.supabase
					.from("organizations")
					.select("name, logo_url")
					.eq("id", organizationId)
					.single();

				const createParams = invitations.map((invitation) => ({
					organizationId,
					email: invitation.email,
					role: invitation.role,
					invitedBy: orgUser.id,
				}));

				const { data: createdInvitations, error } = await createBulkInvitations(
					ctx.supabase,
					createParams,
				);

				if (error || !createdInvitations) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: error?.message || "Failed to create invitations",
					});
				}

				const acceptUrlBase = `${process.env.NEXT_PUBLIC_URL}/invitations/accept`;
				const tokens = createdInvitations.map((inv) => inv.token);

				const emailResults = await sendBulkInvitationEmails(
					{
						invitations: invitations.map((inv) => ({
							to: inv.email,
							role: inv.role,
						})),
						inviterName: orgUser.name || "Someone",
						organizationName: organization?.name || "Unknown Organization",
						acceptUrlBase,
						organizationLogo: organization?.logo_url || undefined,
					},
					tokens,
				);

				return {
					invitations: createdInvitations,
					emailResults,
					totalCreated: createdInvitations.length,
					totalEmailsSent: emailResults.totalSent,
				};
			} catch (error) {
				console.error("Error in sendBulkInvitations:", error);
				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to send bulk invitations",
				});
			}
		}),

	listInvitations: organizationProcedure
		.input(
			z.object({
				includeAccepted: z.boolean().default(false),
			}),
		)
		.query(async ({ ctx, input }) => {
			try {
				const { data, error } = await getInvitationsByOrganization(
					ctx.supabase,
					ctx.organizationId,
					input.includeAccepted,
				);

				if (error) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: `Failed to get invitations: ${error.message}`,
					});
				}

				return data || [];
			} catch (error) {
				console.error("Error in listInvitations:", error);
				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to list invitations",
				});
			}
		}),

	getInvitationStats: organizationProcedure
		.input(
			z.object({
				days: z.number().min(1).max(365).default(30),
			}),
		)
		.query(async ({ ctx, input }) => {
			try {
				const { data, error } = await getInvitationStats(
					ctx.supabase,
					ctx.organizationId,
					input.days,
				);

				if (error) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: `Failed to get invitation stats: ${error.message}`,
					});
				}

				return data;
			} catch (error) {
				console.error("Error in getInvitationStats:", error);
				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to get invitation stats",
				});
			}
		}),

	resendInvitation: organizationProcedure
		.input(resendInvitationSchema)
		.mutation(async ({ ctx, input }) => {
			const { invitationId, organizationId } = input;

			try {
				if (organizationId !== ctx.organizationId) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You can only resend invitations for your organization",
					});
				}

				const { data: invitation, error: getError } = await getInvitationById(
					ctx.supabase,
					invitationId,
					organizationId,
				);

				if (getError || !invitation) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Invitation not found",
					});
				}

				if (invitation.accepted_at) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Cannot resend an already accepted invitation",
					});
				}

				const rateLimit = await checkInvitationRateLimit(organizationId);
				if (!rateLimit.allowed) {
					throw new TRPCError({
						code: "TOO_MANY_REQUESTS",
						message: "Rate limit exceeded. Please try again later.",
					});
				}

				const { data: updatedInvitation, error } = await resendInvitation(
					ctx.supabase,
					invitationId,
					organizationId,
				);

				if (error || !updatedInvitation) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: error?.message || "Failed to resend invitation",
					});
				}

				return updatedInvitation;
			} catch (error) {
				console.error("Error in resendInvitation:", error);
				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to resend invitation",
				});
			}
		}),

	cancelInvitation: organizationProcedure
		.input(
			z.object({
				invitationId: z.string().uuid(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const { success, error } = await cancelInvitation(
					ctx.supabase,
					input.invitationId,
					ctx.organizationId,
				);

				if (!success || error) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: error?.message || "Failed to cancel invitation",
					});
				}

				return { success: true };
			} catch (error) {
				console.error("Error in cancelInvitation:", error);
				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to cancel invitation",
				});
			}
		}),

	getInvitationByToken: protectedProcedure
		.input(
			z.object({
				token: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			try {
				const validationResult = await validateInvitationToken(input.token);

				if (!validationResult.valid) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Invalid invitation: ${validationResult.error}`,
					});
				}

				const { data, error } = await getInvitationByToken(
					ctx.supabase,
					input.token,
				);

				if (error || !data) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Invitation not found",
					});
				}

				return data;
			} catch (error) {
				console.error("Error in getInvitationByToken:", error);
				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to get invitation",
				});
			}
		}),

	

	

	acceptInvitation: protectedProcedure
		.input(acceptInvitationSchema)
		.mutation(async ({ ctx, input }) => {
			const { token, firstName, lastName, password } = input;

			try {
				console.log("🎯 Starting invitation acceptance process...");

				const validationResult = await validateInvitationToken(token);

				if (!validationResult.valid || !validationResult.invitation) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Invalid invitation: ${validationResult.error}`,
					});
				}

				const invitation = validationResult.invitation;
				console.log("📧 Processing invitation:", {
					invitation_id: invitation.id,
					invitation_email: invitation.email,
					invitation_organization_id: invitation.organization_id,
					invitation_role: invitation.role,
				});

				const fullName = `${firstName.trim()} ${lastName.trim()}`;

				
				const { count: beforeCount } = await ctx.supabase
					.from("organization_users")
					.select("*", { count: "exact", head: true })
					.eq("organization_id", invitation.organization_id);

				console.log(
					"📊 BEFORE SIGNUP - organization_users count:",
					beforeCount,
				);

				
				const { data: orgsBefore } = await ctx.supabase
					.from("organizations")
					.select("id, name");
				console.log("🏢 BEFORE SIGNUP - all organizations:", orgsBefore);

				console.log("🔐 About to create user with metadata:", {
					role: "organization",
					is_invited_user: true,
					invited_to_organization: invitation.organization_id,
					first_name: firstName.trim(),
					last_name: lastName.trim(),
					full_name: fullName,
				});

				const { data: signUpData, error: signUpError } =
					await handleEmailPasswordSignUp(
						ctx.supabase,
						invitation.email,
						password,
						"organization",
						{
							first_name: firstName.trim(),
							last_name: lastName.trim(),
							full_name: fullName,
							is_invited_user: true,
							invited_to_organization: invitation.organization_id,
						},
						process.env.NEXT_PUBLIC_URL,
					);

				if (signUpError || !signUpData.user) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: signUpError?.message || "Failed to create user account",
					});
				}

				console.log("👤 User created successfully:", signUpData.user.id);
				console.log(
					"🔍 User metadata after creation:",
					signUpData.user.user_metadata,
				);

				
				const { count: afterSignupCount } = await ctx.supabase
					.from("organization_users")
					.select("*", { count: "exact", head: true })
					.eq("organization_id", invitation.organization_id);

				console.log(
					"📊 AFTER SIGNUP (before our code) - organization_users count:",
					afterSignupCount,
				);

				
				const { data: orgsAfter } = await ctx.supabase
					.from("organizations")
					.select("id, name");
				console.log("🏢 AFTER SIGNUP - all organizations:", orgsAfter);

				
				const newOrgs = orgsAfter?.filter(
					(org) => !orgsBefore?.some((beforeOrg) => beforeOrg.id === org.id),
				);
				if (newOrgs && newOrgs.length > 0) {
					console.log("🚨 NEW ORGANIZATIONS CREATED BY TRIGGER:", newOrgs);
				}

				
				if (afterSignupCount && beforeCount && afterSignupCount > beforeCount) {
					console.log("🚨 ORGANIZATION_USERS RECORD(S) CREATED BY TRIGGER!");

					
					const { data: newOrgUsers } = await ctx.supabase
						.from("organization_users")
						.select("*")
						.eq("user_id", signUpData.user.id);

					console.log(
						"🔍 New organization_users records for this user:",
						newOrgUsers,
					);
				}

				console.log("🏢 About to call addUserToExistingOrganization with:", {
					userId: signUpData.user.id,
					organizationId: invitation.organization_id,
					email: invitation.email,
					role: invitation.role,
				});

				const orgSetupResult = await addUserToExistingOrganization(
					ctx.supabase,
					signUpData.user.id,
					invitation.organization_id,
					invitation.email,
					invitation.role,
				);

				if (!orgSetupResult.success) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: orgSetupResult.error || "Failed to setup organization",
					});
				}

				console.log("✅ Organization setup completed successfully");

				
				const { count: finalCount } = await ctx.supabase
					.from("organization_users")
					.select("*", { count: "exact", head: true })
					.eq("organization_id", invitation.organization_id);

				console.log("📊 FINAL - organization_users count:", finalCount);

				const { data: orgUser, error: orgUserError } = await ctx.supabase
					.from("organization_users")
					.update({
						name: fullName,
						email: invitation.email,
						role: invitation.role,
						invited_by: invitation.invited_by,
						joined_at: new Date().toISOString(),
					})
					.eq("user_id", signUpData.user.id)
					.eq("organization_id", invitation.organization_id)
					.select()
					.single();

				if (orgUserError) {
					console.error("Failed to update organization user:", orgUserError);
				} else {
					console.log("📝 Updated organization user record");
				}

				const { data: acceptedInvitation, error: acceptError } =
					await acceptInvitation(ctx.supabase, invitation.id);

				if (acceptError) {
					console.error("Failed to mark invitation as accepted:", acceptError);
				} else {
					console.log("✅ Marked invitation as accepted");
				}

				console.log("🎉 Invitation acceptance process completed successfully!");

				return {
					user: signUpData.user,
					organizationUser: orgUser,
					invitation: acceptedInvitation,
				};
			} catch (error) {
				console.error("Error in acceptInvitation:", error);
				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to accept invitation",
				});
			}
		}),
});
