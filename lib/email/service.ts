import { render } from "@react-email/render";
import { Resend } from "resend";
import { InvitationEmail } from "./templates/invitation-email";

if (!process.env.RESEND_API_KEY) {
	throw new Error("RESEND_API_KEY environment variable is required");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendInvitationEmailParams {
	to: string;
	inviterName: string;
	organizationName: string;
	role: string;
	acceptUrl: string;
	expiresInDays?: number;
	organizationLogo?: string;
}

export const sendInvitationEmail = async (
	params: SendInvitationEmailParams,
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
	try {
		const {
			to,
			inviterName,
			organizationName,
			role,
			acceptUrl,
			expiresInDays = 7,
			organizationLogo,
		} = params;

		const expiresAt = expiresInDays === 1 ? "1 day" : `${expiresInDays} days`;

		const emailHtml = await render(
			InvitationEmail({
				inviterName,
				organizationName,
				role,
				acceptUrl,
				expiresAt,
				organizationLogo,
			}),
		);

		const roleDisplayName = role
			.split("_")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");

		const { data, error } = await resend.emails.send({
			from: "Seeds ATS <noreply@seeds-ats.com>",
			to: [to],
			subject: `You're invited to join ${organizationName} as a ${roleDisplayName}`,
			html: emailHtml,
			tags: [
				{ name: "category", value: "invitation" },
				{ name: "organization", value: organizationName },
				{ name: "role", value: role },
			],
		});

		if (error) {
			console.error("Failed to send invitation email:", error);
			return { success: false, error: error.message };
		}

		return { success: true, messageId: data?.id };
	} catch (error) {
		console.error("Unexpected error sending invitation email:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
};

export interface SendBulkInvitationEmailsParams {
	invitations: Array<{
		to: string;
		role: string;
	}>;
	inviterName: string;
	organizationName: string;
	acceptUrlBase: string;
	organizationLogo?: string;
}

export const sendBulkInvitationEmails = async (
	params: SendBulkInvitationEmailsParams,
	tokens: string[],
): Promise<{
	success: boolean;
	results: Array<{
		email: string;
		success: boolean;
		messageId?: string;
		error?: string;
	}>;
	totalSent: number;
}> => {
	const {
		invitations,
		inviterName,
		organizationName,
		acceptUrlBase,
		organizationLogo,
	} = params;

	if (invitations.length !== tokens.length) {
		throw new Error("Number of invitations must match number of tokens");
	}

	const results = await Promise.allSettled(
		invitations.map(async (invitation, index) => {
			const token = tokens[index];
			const acceptUrl = `${acceptUrlBase}/${token}`;

			const result = await sendInvitationEmail({
				to: invitation.to,
				inviterName,
				organizationName,
				role: invitation.role,
				acceptUrl,
				organizationLogo,
			});

			return {
				email: invitation.to,
				...result,
			};
		}),
	);
	const processedResults = results.map((result, index) => {
		if (result.status === "fulfilled") {
			return result.value;
		} else {
			return {
				email: invitations[index].to,
				success: false,
				error:
					result.reason instanceof Error
						? result.reason.message
						: "Unknown error",
			};
		}
	});

	const totalSent = processedResults.filter((result) => result.success).length;

	return {
		success: totalSent > 0,
		results: processedResults,
		totalSent,
	};
};
