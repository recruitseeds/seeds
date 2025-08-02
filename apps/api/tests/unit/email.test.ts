import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type CandidateApplicationEmailData,
	EmailService,
} from "../../src/services/email.js";
import type { Logger } from "../../src/services/logger.js";

const mockResendSend = vi.fn();

vi.mock("resend", () => ({
	Resend: vi.fn().mockImplementation(() => ({
		emails: {
			send: mockResendSend,
		},
	})),
}));

vi.mock("../../src/services/config.js", () => ({
	ConfigService: {
		getInstance: vi.fn().mockReturnValue({
			getConfig: vi.fn().mockReturnValue({
				resendApiKey: "test-resend-key",
				defaultFromEmail: "noreply@test.com",
			}),
		}),
	},
}));

describe("EmailService", () => {
	let emailService: EmailService;
	let mockLogger: Logger;

	beforeEach(() => {
		mockLogger = {
			info: vi.fn(),
			error: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
		} as any;

		emailService = new EmailService(mockLogger);
		vi.clearAllMocks();
	});

	describe("sendEmail", () => {
		it("should send email successfully", async () => {
			mockResendSend.mockResolvedValue({
				data: { id: "email-123" },
				error: null,
			});

			const emailData = {
				to: "test@example.com",
				subject: "Test Subject",
				html: "<p>Test content</p>",
				text: "Test content",
			};

			const result = await emailService.sendEmail(emailData);

			expect(result).toBe("email-123");
			expect(mockResendSend).toHaveBeenCalledWith({
				from: "noreply@test.com",
				to: "test@example.com",
				subject: "Test Subject",
				html: "<p>Test content</p>",
				text: "Test content",
				tags: undefined,
				headers: undefined,
			});
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Sending email",
				expect.any(Object),
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Email sent successfully",
				expect.any(Object),
			);
		});

		it("should handle Resend API errors", async () => {
			mockResendSend.mockResolvedValue({
				data: null,
				error: { message: "Invalid API key" },
			});

			const emailData = {
				to: "test@example.com",
				subject: "Test Subject",
				html: "<p>Test content</p>",
			};

			await expect(emailService.sendEmail(emailData)).rejects.toThrow(
				"Email sending failed: Invalid API key",
			);
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Email sending failed",
				expect.any(Object),
				expect.any(Object),
			);
		});

		it("should handle unexpected errors", async () => {
			mockResendSend.mockRejectedValue(new Error("Network error"));

			const emailData = {
				to: "test@example.com",
				subject: "Test Subject",
				html: "<p>Test content</p>",
			};

			await expect(emailService.sendEmail(emailData)).rejects.toThrow(
				"Network error",
			);
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Unexpected error sending email",
				expect.any(Error),
				expect.any(Object),
			);
		});

		it("should include metadata in logs", async () => {
			mockResendSend.mockResolvedValue({
				data: { id: "email-123" },
				error: null,
			});

			const emailData = {
				to: "test@example.com",
				subject: "Test Subject",
				html: "<p>Test content</p>",
			};

			const metadata = {
				correlationId: "corr-123",
				candidateId: "candidate-456",
				companyId: "company-789",
			};

			await emailService.sendEmail(emailData, metadata);

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Sending email",
				expect.objectContaining({
					correlationId: "corr-123",
					candidateId: "candidate-456",
					companyId: "company-789",
				}),
			);
		});
	});

	describe("sendTemplatedEmail", () => {
		it("should send application received email successfully", async () => {
			mockResendSend.mockResolvedValue({
				data: { id: "email-123" },
				error: null,
			});

			const templateData = {
				candidateName: "John Doe",
				jobTitle: "Software Engineer",
				companyName: "TechCorp",
				applicationId: "app-123",
			};

			const result = await emailService.sendTemplatedEmail(
				"application-received",
				templateData,
				"john@example.com",
				{ correlationId: "corr-123" },
			);

			expect(result).toBe("email-123");
			expect(mockResendSend).toHaveBeenCalledWith(
				expect.objectContaining({
					to: "john@example.com",
					subject: expect.stringContaining("Software Engineer"),
					subject: expect.stringContaining("TechCorp"),
					html: expect.stringContaining("John Doe"),
					html: expect.stringContaining("Software Engineer"),
					html: expect.stringContaining("TechCorp"),
					tags: expect.arrayContaining([
						{ name: "template", value: "application-received" },
					]),
				}),
			);
		});

		it("should throw error for unknown template", async () => {
			await expect(
				emailService.sendTemplatedEmail(
					"unknown-template",
					{},
					"test@example.com",
				),
			).rejects.toThrow("Email template not found: unknown-template");
		});

		it("should throw error for missing required variables", async () => {
			const templateData = {
				candidateName: "John Doe",
			};

			await expect(
				emailService.sendTemplatedEmail(
					"application-received",
					templateData,
					"test@example.com",
				),
			).rejects.toThrow("Missing required template variable: jobTitle");
		});

		it("should render template variables correctly", async () => {
			mockResendSend.mockResolvedValue({
				data: { id: "email-123" },
				error: null,
			});

			const templateData = {
				candidateName: "Jane Smith",
				jobTitle: "Product Manager",
				companyName: "InnovateCorp",
				applicationId: "app-456",
				portalUrl: "https://portal.example.com/app-456",
				contactEmail: "hiring@innovatecorp.com",
			};

			await emailService.sendTemplatedEmail(
				"application-received",
				templateData,
				"jane@example.com",
			);

			const sentEmail = mockResendSend.mock.calls[0][0];

			expect(sentEmail.subject).toContain("Product Manager");
			expect(sentEmail.subject).toContain("InnovateCorp");
			expect(sentEmail.html).toContain("Jane Smith");
			expect(sentEmail.html).toContain("Product Manager");
			expect(sentEmail.html).toContain("InnovateCorp");
			expect(sentEmail.html).toContain("https://portal.example.com/app-456");
			expect(sentEmail.html).toContain("hiring@innovatecorp.com");
			expect(sentEmail.text).toContain("Jane Smith");
			expect(sentEmail.text).toContain("Product Manager");
		});

		it("should handle conditional template sections", async () => {
			mockResendSend.mockResolvedValue({
				data: { id: "email-123" },
				error: null,
			});

			const templateDataWithoutOptionals = {
				candidateName: "John Doe",
				jobTitle: "Developer",
				companyName: "TechCorp",
				applicationId: "app-123",
			};

			await emailService.sendTemplatedEmail(
				"application-received",
				templateDataWithoutOptionals,
				"john@example.com",
			);

			const sentEmail = mockResendSend.mock.calls[0][0];

			expect(sentEmail.html).not.toContain("View Application Status");
			expect(sentEmail.html).not.toContain("href=");
			expect(sentEmail.text).not.toContain(
				"You can track your application status at:",
			);
		});
	});

	describe("sendApplicationReceivedEmail", () => {
		it("should send application received email with all data", async () => {
			mockResendSend.mockResolvedValue({
				data: { id: "email-123" },
				error: null,
			});

			const emailData: CandidateApplicationEmailData = {
				candidateName: "Alice Johnson",
				candidateEmail: "alice@example.com",
				jobTitle: "Senior Engineer",
				companyName: "TechStartup",
				applicationId: "app-789",
				portalUrl: "https://portal.techstartup.com/app-789",
				companyLogo: "https://cdn.techstartup.com/logo.png",
				contactEmail: "jobs@techstartup.com",
			};

			const result = await emailService.sendApplicationReceivedEmail(
				emailData,
				{ correlationId: "corr-456" },
			);

			expect(result).toBe("email-123");
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Sending application received email",
				expect.objectContaining({
					candidateEmail: "alice@example.com",
					jobTitle: "Senior Engineer",
					companyName: "TechStartup",
					applicationId: "app-789",
					correlationId: "corr-456",
				}),
			);

			const sentEmail = mockResendSend.mock.calls[0][0];
			expect(sentEmail.to).toBe("alice@example.com");
			expect(sentEmail.html).toContain("Alice Johnson");
			expect(sentEmail.html).toContain("Senior Engineer");
			expect(sentEmail.html).toContain("TechStartup");
			expect(sentEmail.html).toContain(
				"https://portal.techstartup.com/app-789",
			);
			expect(sentEmail.html).toContain("https://cdn.techstartup.com/logo.png");
			expect(sentEmail.html).toContain("jobs@techstartup.com");
			expect(sentEmail.tags).toEqual([
				{ name: "template", value: "application-received" },
				{ name: "candidate_id", value: "app-789" },
				{ name: "company_id", value: "techstartup" },
			]);
		});
	});

	describe("template management", () => {
		it("should return template by ID", () => {
			const template = emailService.getTemplate("application-received");

			expect(template).toBeDefined();
			expect(template?.id).toBe("application-received");
			expect(template?.name).toBe("Application Received Confirmation");
			expect(template?.requiredVariables).toEqual([
				"candidateName",
				"jobTitle",
				"companyName",
				"applicationId",
			]);
		});

		it("should return undefined for unknown template", () => {
			const template = emailService.getTemplate("unknown-template");
			expect(template).toBeUndefined();
		});

		it("should list all templates", () => {
			const templates = emailService.listTemplates();

			expect(templates).toHaveLength(1);
			expect(templates[0].id).toBe("application-received");
			expect(templates[0].name).toBe("Application Received Confirmation");
		});
	});
});
