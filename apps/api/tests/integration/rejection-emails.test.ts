import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Database } from "../../../../packages/supabase/types/db.js";
import { app } from "../../src/index.js";

const supabase = createClient<Database>(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const INTERNAL_TOKEN = process.env.INTERNAL_API_SECRET || "test-secret";

describe("Rejection Email System", () => {
	let testApplicationId: string;
	let testEmailId: string;

	beforeAll(async () => {
		const testCandidate = await supabase
			.from("candidate_profiles")
			.insert({
				first_name: "Test",
				last_name: "Candidate",
				is_onboarded: true,
			})
			.select("id")
			.single();

		const testOrg = await supabase
			.from("organizations")
			.insert({
				name: "Test Company",
			})
			.select("id")
			.single();

		const testUser = await supabase
			.from("organization_users")
			.insert({
				user_id: "test-user",
				organization_id: testOrg.data!.id,
				role: "admin",
				status: "active",
			})
			.select("id")
			.single();

		const testJob = await supabase
			.from("job_postings")
			.insert({
				title: "Test Software Engineer",
				organization_id: testOrg.data!.id,
				created_by: testUser.data!.id,
				job_type: "full-time",
				status: "published",
				content: { description: "Test job description" },
			})
			.select("id")
			.single();

		const testApplication = await supabase
			.from("job_applications")
			.insert({
				candidate_id: testCandidate.data!.id,
				job_posting_id: testJob.data!.id,
				status: "active",
			})
			.select("id")
			.single();

		testApplicationId = testApplication.data!.id;

		await supabase.from("organization_rejection_settings").upsert({
			organization_id: testOrg.data!.id,
			rejection_delay_days: 7,
			business_days_only: false,
			rejection_email_enabled: true,
		});
	});

	afterAll(async () => {
		await supabase.from("scheduled_rejection_emails").delete().neq("id", "");
		await supabase.from("job_applications").delete().neq("id", "");
		await supabase.from("job_postings").delete().neq("id", "");
		await supabase.from("organization_users").delete().neq("id", "");
		await supabase.from("organizations").delete().neq("id", "");
		await supabase.from("candidate_profiles").delete().neq("id", "");
		await supabase
			.from("organization_rejection_settings")
			.delete()
			.neq("organization_id", "");
	});

	beforeEach(async () => {
		await supabase.from("scheduled_rejection_emails").delete().neq("id", "");
	});

	describe("schedule_rejection_email function", () => {
		it("should schedule a rejection email correctly", async () => {
			const { data, error } = await supabase.rpc("schedule_rejection_email", {
				p_application_id: testApplicationId,
				p_candidate_email: "test@example.com",
				p_score: 25,
				p_rejection_reason: "Score below threshold",
			});

			expect(error).toBeNull();
			expect(data).toBeDefined();

			const scheduledEmail = await supabase
				.from("scheduled_rejection_emails")
				.select("*")
				.eq("application_id", testApplicationId)
				.single();

			expect(scheduledEmail.data).toBeDefined();
			expect(scheduledEmail.data!.recipient_email).toBe("test@example.com");
			expect(scheduledEmail.data!.status).toBe("pending");
			expect(new Date(scheduledEmail.data!.scheduled_for)).toBeInstanceOf(Date);

			testEmailId = scheduledEmail.data!.id;
		});

		it("should respect business days setting", async () => {
			await supabase
				.from("organization_rejection_settings")
				.update({ business_days_only: true })
				.neq("organization_id", "");

			const startTime = new Date();

			await supabase.rpc("schedule_rejection_email", {
				p_application_id: testApplicationId,
				p_candidate_email: "test@example.com",
				p_score: 30,
			});

			const scheduledEmail = await supabase
				.from("scheduled_rejection_emails")
				.select("scheduled_for")
				.eq("application_id", testApplicationId)
				.single();

			const scheduledTime = new Date(scheduledEmail.data!.scheduled_for);
			const daysDiff = Math.ceil(
				(scheduledTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24),
			);

			expect(daysDiff).toBeGreaterThanOrEqual(7);
		});
	});

	describe("get_pending_rejection_emails function", () => {
		it("should return emails that are due", async () => {
			await supabase.from("scheduled_rejection_emails").insert({
				application_id: testApplicationId,
				recipient_email: "test@example.com",
				scheduled_for: new Date(Date.now() - 60000).toISOString(),
				status: "pending",
			});

			const { data, error } = await supabase.rpc(
				"get_pending_rejection_emails",
			);

			expect(error).toBeNull();
			expect(data).toBeDefined();
			expect(Array.isArray(data)).toBe(true);
			expect(data!.length).toBeGreaterThan(0);

			const email = data!.find(
				(e: any) => e.application_id === testApplicationId,
			);
			expect(email).toBeDefined();
			expect(email.recipient_email).toBe("test@example.com");
		});

		it("should not return future emails", async () => {
			await supabase.from("scheduled_rejection_emails").insert({
				application_id: testApplicationId,
				recipient_email: "test@example.com",
				scheduled_for: new Date(Date.now() + 60000).toISOString(),
				status: "pending",
			});

			const { data, error } = await supabase.rpc(
				"get_pending_rejection_emails",
			);

			expect(error).toBeNull();
			expect(data).toBeDefined();

			const email = data!.find(
				(e: any) => e.application_id === testApplicationId,
			);
			expect(email).toBeUndefined();
		});
	});

	describe("POST /api/v1/internal/cron/send-rejection-emails", () => {
		it("should require internal authentication", async () => {
			const response = await app.request(
				"/api/v1/internal/cron/send-rejection-emails",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						timestamp: new Date().toISOString(),
					}),
				},
			);

			expect(response.status).toBe(401);
			const result = await response.json();
			expect(result.success).toBe(false);
			expect(result.error.code).toBe("MISSING_INTERNAL_TOKEN");
		});

		it("should process pending emails in dry run mode", async () => {
			await supabase.from("scheduled_rejection_emails").insert({
				application_id: testApplicationId,
				recipient_email: "test@example.com",
				scheduled_for: new Date(Date.now() - 60000).toISOString(),
				status: "pending",
			});

			const response = await app.request(
				"/api/v1/internal/cron/send-rejection-emails",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Internal ${INTERNAL_TOKEN}`,
					},
					body: JSON.stringify({
						timestamp: new Date().toISOString(),
						dry_run: true,
					}),
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();

			expect(result.success).toBe(true);
			expect(result.data.processed).toBeGreaterThan(0);
			expect(result.data.sent).toBeGreaterThan(0);
			expect(result.data.failed).toBe(0);
			expect(result.metadata.processingTimeMs).toBeGreaterThan(0);

			const emailStillPending = await supabase
				.from("scheduled_rejection_emails")
				.select("status")
				.eq("application_id", testApplicationId)
				.single();

			expect(emailStillPending.data!.status).toBe("pending");
		});

		it("should return empty result when no emails are pending", async () => {
			const response = await app.request(
				"/api/v1/internal/cron/send-rejection-emails",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Internal ${INTERNAL_TOKEN}`,
					},
					body: JSON.stringify({
						timestamp: new Date().toISOString(),
						dry_run: true,
					}),
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();

			expect(result.success).toBe(true);
			expect(result.data.processed).toBe(0);
			expect(result.data.sent).toBe(0);
			expect(result.data.failed).toBe(0);
			expect(result.data.batch_count).toBe(0);
		});

		it("should handle database errors gracefully", async () => {
			const invalidSupabase = createClient<Database>(
				"https:
				"invalid-key",
			);

			const response = await app.request(
				"/api/v1/internal/cron/send-rejection-emails",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Internal ${INTERNAL_TOKEN}`,
					},
					body: JSON.stringify({
						timestamp: new Date().toISOString(),
					}),
				},
			);

			expect(response.status).toBe(500);
			const result = await response.json();
			expect(result.success).toBe(false);
			expect(result.error.code).toBe("DATABASE_ERROR");
		});
	});

	describe("mark_rejection_email_sent function", () => {
		it("should mark email as sent and update application status", async () => {
			const { data: emailData } = await supabase
				.from("scheduled_rejection_emails")
				.insert({
					application_id: testApplicationId,
					recipient_email: "test@example.com",
					scheduled_for: new Date().toISOString(),
					status: "pending",
				})
				.select("id")
				.single();

			const { error } = await supabase.rpc("mark_rejection_email_sent", {
				p_email_id: emailData!.id,
				p_service_id: "resend-123",
			});

			expect(error).toBeNull();

			const updatedEmail = await supabase
				.from("scheduled_rejection_emails")
				.select("*")
				.eq("id", emailData!.id)
				.single();

			expect(updatedEmail.data!.status).toBe("sent");
			expect(updatedEmail.data!.email_service_id).toBe("resend-123");
			expect(updatedEmail.data!.sent_at).toBeDefined();

			const updatedApplication = await supabase
				.from("job_applications")
				.select("rejection_email_sent, status")
				.eq("id", testApplicationId)
				.single();

			expect(updatedApplication.data!.rejection_email_sent).toBe(true);
			expect(updatedApplication.data!.status).toBe("rejected");
		});
	});
});
