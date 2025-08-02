import { createRoute, z } from "@hono/zod-openapi";
import { createClient } from "@supabase/supabase-js";
import type { Context } from "hono";
import type { Database } from "../../../../../../packages/supabase/types/db.js";
import { createOpenAPIApp } from "../../../lib/openapi.js";
import {
	type InternalAuthContext,
	internalAuth,
} from "../../../middleware/internal-auth.js";
import { structuredLogging } from "../../../middleware/structured-logging.js";
import { ConfigService } from "../../../services/config.js";
import { EmailService } from "../../../services/email.js";
import { LoggerService } from "../../../services/logger.js";

const cronRoutes = createOpenAPIApp();

// cronRoutes.use('*', structuredLogging) // Commented out due to middleware conflicts
cronRoutes.use("*", internalAuth());

const sendRejectionEmailsRoute = createRoute({
	method: "post",
	path: "/send-rejection-emails",
	summary: "Process scheduled rejection emails",
	description:
		"Cron job endpoint that processes all pending rejection emails due to be sent",
	security: [{ InternalAuth: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						timestamp: z.string().datetime().optional(),
						job_type: z.string().optional(),
						dry_run: z.boolean().default(false),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			description: "Successfully processed rejection emails",
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
						data: z.object({
							processed: z.number(),
							sent: z.number(),
							failed: z.number(),
							batch_count: z.number(),
						}),
						metadata: z.object({
							correlationId: z.string(),
							timestamp: z.string(),
							processingTimeMs: z.number(),
						}),
					}),
				},
			},
		},
		401: {
			description: "Unauthorized - Invalid internal token",
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
						error: z.object({
							code: z.string(),
							message: z.string(),
						}),
						correlationId: z.string(),
					}),
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
						error: z.object({
							code: z.string(),
							message: z.string(),
						}),
						correlationId: z.string(),
					}),
				},
			},
		},
	},
});

interface PendingRejectionEmail {
	email_id: string;
	application_id: string;
	recipient_email: string;
	candidate_name: string;
	job_title: string;
	company_name: string;
}

const BATCH_SIZE = 50;

cronRoutes.openapi(
	sendRejectionEmailsRoute,
	async (c: Context): Promise<any> => {
		const startTime = Date.now();
		const correlationId = c.get("correlationId");
		const logger = LoggerService.getInstance().createChildLogger({
			correlationId,
		});

		const config = ConfigService.getInstance().getConfig();
		const supabase = createClient<Database>(
			config.supabaseUrl,
			config.supabaseServiceRoleKey,
		);

		const emailService = new EmailService(logger, supabase);

		const body = await c.req.json();
		const isDryRun = body.dry_run || false;

		logger.info("Starting rejection email processing", {
			dry_run: isDryRun,
			triggered_by: "cron_job",
		});

		try {
			if (isDryRun) {
				logger.info("Dry run - checking pending rejection emails");

				const { data: pendingEmails, error } = await supabase
					.from("scheduled_rejection_emails")
					.select("id, recipient_email, scheduled_for")
					.eq("status", "pending")
					.lte("scheduled_for", new Date().toISOString());

				if (error) {
					logger.error("Failed to fetch pending rejection emails", { error: error.message });
					return c.json(
						{
							success: false as const,
							error: {
								code: "DATABASE_ERROR",
								message: "Failed to fetch pending rejection emails",
							},
							timestamp: new Date().toISOString(),
							correlationId,
						},
						500,
					);
				}

				logger.info("Dry run completed", {
					pending_emails_count: pendingEmails?.length || 0,
				});

				return c.json({
					success: true as const,
					data: {
						processed: pendingEmails?.length || 0,
						sent: 0,
						failed: 0,
						batch_count: 1,
					},
					metadata: {
						correlationId,
						timestamp: new Date().toISOString(),
						processingTimeMs: Date.now() - startTime,
					},
				});
			}

			const processedCount = await emailService.processPendingRejectionEmails(BATCH_SIZE);

			const processingTimeMs = Date.now() - startTime;

			logger.info("Rejection email processing completed", {
				total_processed: processedCount,
				processing_time_ms: processingTimeMs,
			});

			return c.json({
				success: true as const,
				data: {
					processed: processedCount,
					sent: processedCount,
					failed: 0,
					batch_count: 1,
				},
				metadata: {
					correlationId,
					timestamp: new Date().toISOString(),
					processingTimeMs,
				},
			});
		} catch (error) {
			const processingTimeMs = Date.now() - startTime;
			logger.error("Unexpected error processing rejection emails", error, {
				processing_time_ms: processingTimeMs,
			});

			return c.json(
				{
					success: false,
					error: {
						code: "PROCESSING_ERROR",
						message: "Failed to process rejection emails",
					},
					timestamp: new Date().toISOString(),
					correlationId,
				},
				500,
			);
		}
	},
);

export { cronRoutes };
