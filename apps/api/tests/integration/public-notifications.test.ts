import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { correlationMiddleware } from "../../src/middleware/correlation.js";
import { errorHandler } from "../../src/middleware/error-handler.js";
import { publicRoutes } from "../../src/routes/v1/public/index.js";

const mockSendApplicationReceivedEmail = vi.fn();

vi.mock("../../src/services/email.js", () => ({
	EmailService: vi.fn().mockImplementation(() => ({
		sendApplicationReceivedEmail: mockSendApplicationReceivedEmail,
	})),
}));

const MOCK_UNKEY_RESPONSE = {
	valid: true,
	ownerId: "company-123",
	meta: {
		tier: "pro",
		companyId: "company-123",
		permissions: ["candidates:read", "candidates:write", "notifications:send"],
	},
};

global.fetch = vi.fn().mockImplementation((url: string) => {
	if (url.includes("api.unkey.dev")) {
		return Promise.resolve({
			ok: true,
			json: () => Promise.resolve(MOCK_UNKEY_RESPONSE),
		});
	}
	return Promise.reject(new Error("Unexpected fetch call"));
});

describe("Public Notifications API", () => {
	let app: Hono;

	beforeEach(() => {
		app = new Hono();
		app.use("*", errorHandler());
		app.use("*", correlationMiddleware());
		app.route("/public", publicRoutes);

		vi.clearAllMocks();
		process.env.UNKEY_API_KEY = "test-unkey-key";
		process.env.UNKEY_APP_ID = "test-app-id";
	});

	describe("POST /public/notifications/application-received", () => {
		const validRequestData = {
			candidateId: "candidate-123",
			candidateName: "John Doe",
			candidateEmail: "john@example.com",
			jobId: "job-456",
			jobTitle: "Software Engineer",
			companyName: "TechCorp",
			applicationId: "app-789",
			portalUrl: "https:
			companyLogo: "https:
			contactEmail: "hiring@techcorp.com",
		};

		it("should send application confirmation email successfully", async () => {
			mockSendApplicationReceivedEmail.mockResolvedValue("email-123");

			const response = await app.request(
				"/public/notifications/application-received",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer uk_test_key_123",
					},
					body: JSON.stringify(validRequestData),
				},
			);

			expect(response.status).toBe(200);
			const body = await response.json();

			expect(body.success).toBe(true);
			expect(body.data.emailId).toBe("email-123");
			expect(body.data.candidateEmail).toBe("john@example.com");
			expect(body.data.status).toBe("sent");
			expect(body.metadata.processingTimeMs).toBeGreaterThan(0);
			expect(body.metadata.correlationId).toBeDefined();

			expect(mockSendApplicationReceivedEmail).toHaveBeenCalledWith(
				expect.objectContaining({
					candidateName: "John Doe",
					candidateEmail: "john@example.com",
					jobTitle: "Software Engineer",
					companyName: "TechCorp",
					applicationId: "app-789",
					portalUrl: "https:
					companyLogo: "https:
					contactEmail: "hiring@techcorp.com",
				}),
				expect.objectContaining({
					correlationId: expect.any(String),
				}),
			);
		});

		it("should work with minimal required data", async () => {
			mockSendApplicationReceivedEmail.mockResolvedValue("email-456");

			const minimalData = {
				candidateId: "candidate-123",
				candidateName: "Jane Smith",
				candidateEmail: "jane@example.com",
				jobId: "job-456",
				jobTitle: "Product Manager",
				companyName: "StartupCorp",
				applicationId: "app-999",
			};

			const response = await app.request(
				"/public/notifications/application-received",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer uk_test_key_123",
					},
					body: JSON.stringify(minimalData),
				},
			);

			expect(response.status).toBe(200);
			const body = await response.json();

			expect(body.success).toBe(true);
			expect(body.data.emailId).toBe("email-456");
			expect(body.data.candidateEmail).toBe("jane@example.com");

			expect(mockSendApplicationReceivedEmail).toHaveBeenCalledWith(
				expect.objectContaining({
					candidateName: "Jane Smith",
					candidateEmail: "jane@example.com",
					jobTitle: "Product Manager",
					companyName: "StartupCorp",
					applicationId: "app-999",
					portalUrl: undefined,
					companyLogo: undefined,
					contactEmail: undefined,
				}),
				expect.any(Object),
			);
		});

		it("should reject requests without authentication", async () => {
			const response = await app.request(
				"/public/notifications/application-received",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(validRequestData),
				},
			);

			expect(response.status).toBe(401);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("MISSING_API_KEY");
		});

		it("should reject requests without notifications:send permission", async () => {
			vi.mocked(global.fetch).mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							valid: true,
							ownerId: "company-123",
							meta: {
								tier: "pro",
								companyId: "company-123",
								permissions: ["candidates:read", "candidates:write"],
							},
						}),
				} as any),
			);

			const response = await app.request(
				"/public/notifications/application-received",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer uk_test_key_123",
					},
					body: JSON.stringify(validRequestData),
				},
			);

			expect(response.status).toBe(400);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("BUSINESS_VALIDATION_ERROR");
			expect(body.error.message).toContain("notifications:send permission");
		});

		it("should validate required fields", async () => {
			const invalidData = {
				candidateId: "invalid-uuid",
				candidateName: "",
				candidateEmail: "invalid-email",
				jobId: "job-456",
				jobTitle: "",
				companyName: "",
				applicationId: "invalid-uuid",
			};

			const response = await app.request(
				"/public/notifications/application-received",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer uk_test_key_123",
					},
					body: JSON.stringify(invalidData),
				},
			);

			expect(response.status).toBe(400);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("VALIDATION_ERROR");
			expect(body.error.details).toBeDefined();
			expect(Array.isArray(body.error.details)).toBe(true);
			expect(body.error.details.length).toBeGreaterThan(0);
		});

		it("should validate UUID formats", async () => {
			const dataWithInvalidUUIDs = {
				...validRequestData,
				candidateId: "not-a-uuid",
				jobId: "also-not-a-uuid",
				applicationId: "definitely-not-a-uuid",
			};

			const response = await app.request(
				"/public/notifications/application-received",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer uk_test_key_123",
					},
					body: JSON.stringify(dataWithInvalidUUIDs),
				},
			);

			expect(response.status).toBe(400);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("VALIDATION_ERROR");
			expect(
				body.error.details.some((detail: any) =>
					detail.message.includes("Must be a valid UUID"),
				),
			).toBe(true);
		});

		it("should validate email addresses", async () => {
			const dataWithInvalidEmails = {
				...validRequestData,
				candidateEmail: "not-an-email",
				contactEmail: "also-not-an-email",
			};

			const response = await app.request(
				"/public/notifications/application-received",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer uk_test_key_123",
					},
					body: JSON.stringify(dataWithInvalidEmails),
				},
			);

			expect(response.status).toBe(400);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("VALIDATION_ERROR");
			expect(
				body.error.details.some((detail: any) =>
					detail.message.includes("Must be a valid email"),
				),
			).toBe(true);
		});

		it("should validate URL formats for optional fields", async () => {
			const dataWithInvalidURLs = {
				...validRequestData,
				portalUrl: "not-a-url",
				companyLogo: "also-not-a-url",
			};

			const response = await app.request(
				"/public/notifications/application-received",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer uk_test_key_123",
					},
					body: JSON.stringify(dataWithInvalidURLs),
				},
			);

			expect(response.status).toBe(400);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("VALIDATION_ERROR");
		});

		it("should handle email service errors gracefully", async () => {
			mockSendApplicationReceivedEmail.mockRejectedValue(
				new Error("Resend API error"),
			);

			const response = await app.request(
				"/public/notifications/application-received",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer uk_test_key_123",
					},
					body: JSON.stringify(validRequestData),
				},
			);

			expect(response.status).toBe(503);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("EMAIL_SERVICE_UNAVAILABLE");
			expect(body.error.retryAfter).toBe("60s");
		});

		it("should handle unexpected errors", async () => {
			mockSendApplicationReceivedEmail.mockRejectedValue(
				new Error("Unexpected database error"),
			);

			const response = await app.request(
				"/public/notifications/application-received",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer uk_test_key_123",
					},
					body: JSON.stringify(validRequestData),
				},
			);

			expect(response.status).toBe(500);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("INTERNAL_ERROR");
			expect(body.error.message).toBe(
				"An error occurred while sending the email",
			);
		});

		it("should include correlation ID in response", async () => {
			mockSendApplicationReceivedEmail.mockResolvedValue("email-123");

			const response = await app.request(
				"/public/notifications/application-received",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer uk_test_key_123",
					},
					body: JSON.stringify(validRequestData),
				},
			);

			expect(response.headers.get("x-correlation-id")).toBeDefined();
			const body = await response.json();
			expect(body.metadata.correlationId).toBeDefined();
		});

		it("should handle invalid API keys", async () => {
			vi.mocked(global.fetch).mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ valid: false, code: "INVALID_KEY" }),
				} as any),
			);

			const response = await app.request(
				"/public/notifications/application-received",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer invalid_key",
					},
					body: JSON.stringify(validRequestData),
				},
			);

			expect(response.status).toBe(401);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("INVALID_KEY");
		});
	});
});
