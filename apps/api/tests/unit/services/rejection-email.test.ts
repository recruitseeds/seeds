import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmailService } from "../../../src/services/email.js";
import { Logger } from "../../../src/services/logger.js";

vi.mock("../../../src/services/config.js", () => ({
	ConfigService: {
		getInstance: () => ({
			getConfig: () => ({
				resendApiKey: "test-key",
				defaultFromEmail: "test@test.com",
			}),
		}),
	},
}));

global.fetch = vi.fn();

describe("EmailService - Rejection Emails", () => {
	let emailService: EmailService;
	let logger: Logger;

	beforeEach(() => {
		logger = new Logger({ correlationId: "test" });
		emailService = new EmailService(logger);
		vi.clearAllMocks();
	});

	describe("sendRejectionEmail", () => {
		it("should send rejection email successfully", async () => {
			const mockResponse = {
				ok: true,
				json: async () => ({ id: "test-email-id" }),
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			const emailData = {
				candidateName: "John Doe",
				jobTitle: "Software Engineer",
				companyName: "Test Company",
				applicationId: "app-123",
			};

			const result = await emailService.sendRejectionEmail(
				emailData,
				"test@example.com",
				{ correlationId: "test" },
			);

			expect(result).toBe("test-email-id");
			expect(global.fetch).toHaveBeenCalledWith(
				"https://api.resend.com/emails",
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						Authorization: "Bearer test-key",
						"Content-Type": "application/json",
					}),
				}),
			);
		});

		it("should handle email service errors", async () => {
			const mockResponse = {
				ok: false,
				status: 400,
				text: async () => "Bad Request",
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			const emailData = {
				candidateName: "John Doe",
				jobTitle: "Software Engineer",
				companyName: "Test Company",
				applicationId: "app-123",
			};

			await expect(
				emailService.sendRejectionEmail(emailData, "test@example.com", {
					correlationId: "test",
				}),
			).rejects.toThrow("Failed to send email");
		});

		it("should validate required email data", async () => {
			const incompleteData = {
				candidateName: "",
				jobTitle: "Software Engineer",
				companyName: "Test Company",
				applicationId: "app-123",
			};

			await expect(
				emailService.sendRejectionEmail(incompleteData, "test@example.com", {
					correlationId: "test",
				}),
			).rejects.toThrow();
		});
	});
});
