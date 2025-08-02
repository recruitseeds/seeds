import type { Database } from "@seeds/supabase/types/db";
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";
const INTERNAL_TOKEN = process.env.INTERNAL_API_SECRET || "test-secret";

describe("Rejection Email System - End-to-End", () => {
	let supabase: ReturnType<typeof createClient<Database>>;
	let testApplicationId: string;
	let testEmailId: string;

	beforeAll(() => {
		if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
			throw new Error(
				"Missing required environment variables for integration tests",
			);
		}
		supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);
	});

	beforeEach(async () => {
		const { data: org } = await supabase
			.from("organizations")
			.select("id")
			.limit(1)
			.single();

		const { data: candidate } = await supabase
			.from("candidate_profiles")
			.select("id")
			.limit(1)
			.single();

		const { data: job } = await supabase
			.from("job_postings")
			.insert({
				title: "Test Position",
				organization_id: org!.id,
				created_by: candidate!.id,
				job_type: "full-time",
				status: "published",
			})
			.select("id")
			.single();

		const { data: application } = await supabase
			.from("job_applications")
			.insert({
				candidate_id: candidate!.id,
				job_posting_id: job!.id,
				status: "active",
			})
			.select("id")
			.single();

		testApplicationId = application!.id;
	});

	afterAll(async () => {
		if (testEmailId) {
			await supabase
				.from("scheduled_rejection_emails")
				.delete()
				.eq("id", testEmailId);
		}

		if (testApplicationId) {
			await supabase
				.from("job_applications")
				.delete()
				.eq("id", testApplicationId);
		}
	});

	it("should process rejection email end-to-end", async () => {
		const { data: scheduledEmail } = await supabase
			.from("scheduled_rejection_emails")
			.insert({
				application_id: testApplicationId,
				recipient_email: "test@example.com",
				scheduled_for: new Date(Date.now() - 60000).toISOString(),
				status: "pending",
			})
			.select("id")
			.single();

		testEmailId = scheduledEmail!.id;

		const response = await fetch(
			`${API_BASE_URL}/api/v1/internal/cron/send-rejection-emails`,
			{
				method: "POST",
				headers: {
					Authorization: `Internal ${INTERNAL_TOKEN}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					dry_run: true,
				}),
			},
		);

		expect(response.ok).toBe(true);

		const result = await response.json();
		expect(result.success).toBe(true);
		expect(result.data.processed).toBeGreaterThan(0);
	});

	it("should handle invalid authentication", async () => {
		const response = await fetch(
			`${API_BASE_URL}/api/v1/internal/cron/send-rejection-emails`,
			{
				method: "POST",
				headers: {
					Authorization: "Internal invalid-token",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					dry_run: true,
				}),
			},
		);

		expect(response.status).toBe(401);
	});

	it("should validate request format", async () => {
		const response = await fetch(
			`${API_BASE_URL}/api/v1/internal/cron/send-rejection-emails`,
			{
				method: "POST",
				headers: {
					Authorization: `Internal ${INTERNAL_TOKEN}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					invalid_field: true,
				}),
			},
		);

		expect(response.ok).toBe(true);
	});
});
