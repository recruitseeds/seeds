import { createRoute, z } from "@hono/zod-openapi";
import type { Database } from "@seeds/supabase/types/db";
import { createClient } from "@supabase/supabase-js";
import type { Context } from "hono";
import {
	createOpenAPIApp,
	ErrorResponseSchema,
	MetadataSchema,
} from "../../../lib/openapi.js";
import { publicAuth } from "../../../middleware/public-auth.js";
import { adaptiveRateLimit } from "../../../middleware/rate-limit.js";
import { ApplicationService } from "../../../services/application.js";
import { ConfigService } from "../../../services/config.js";
import { EmailService } from "../../../services/email.js";
import { FileUploadService } from "../../../services/file-upload.js";
import { Logger } from "../../../services/logger.js";

const publicJobsRoutes = createOpenAPIApp();

publicJobsRoutes.use("*", publicAuth());
publicJobsRoutes.use("*", adaptiveRateLimit());

const CandidateDataSchema = z
	.object({
		name: z
			.string()
			.min(1)
			.max(100)
			.describe("Full name of the candidate")
			.openapi({
				example: "Sarah Johnson",
				description:
					"The candidate's full name as it should appear in communications",
			}),
		email: z
			.string()
			.email()
			.describe("Valid email address for communications")
			.openapi({
				example: "sarah.johnson@email.com",
				description:
					"Primary email address for application communications and account creation",
			}),
		phone: z
			.string()
			.optional()
			.describe("Phone number in any format")
			.openapi({
				example: "+1-555-0123",
				description: "Optional phone number for recruiter contact",
			}),
	})
	.describe("Candidate personal information");

const ResumeFileSchema = z
	.object({
		fileName: z
			.string()
			.min(1)
			.max(255)
			.describe("Original filename with extension")
			.openapi({
				example: "sarah_johnson_resume.pdf",
				description: "The original filename as uploaded by the candidate",
			}),
		content: z.string().describe("Base64 encoded file content").openapi({
			example: "JVBERi0xLjQKJcOkw7zDtsO8...",
			description: "The resume file encoded as a base64 string",
		}),
		mimeType: z
			.enum([
				"application/pdf",
				"application/msword",
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				"text/plain",
			])
			.describe("MIME type of the uploaded file")
			.openapi({
				example: "application/pdf",
				description: "Must be one of: PDF, DOC, DOCX, or TXT",
			}),
		tags: z
			.array(z.string())
			.optional()
			.describe("Optional tags for categorizing the resume")
			.openapi({
				example: ["frontend", "react", "senior"],
				description:
					"Tags help candidates organize multiple resumes for different job types",
			}),
	})
	.describe("Resume file data");

const ApplicationRequestSchema = z
	.object({
		candidateData: CandidateDataSchema,
		resumeFile: ResumeFileSchema,
	})
	.describe("Job application submission data");

const ApplicationResponseDataSchema = z
	.object({
		applicationId: z
			.string()
			.uuid()
			.describe("Unique application identifier")
			.openapi({
				example: "app_123e4567-e89b-12d3-a456-426614174000",
				description:
					"Use this ID to track application status and communicate with the candidate",
			}),
		candidateId: z
			.string()
			.uuid()
			.describe("Unique candidate identifier")
			.openapi({
				example: "cand_123e4567-e89b-12d3-a456-426614174000",
				description:
					"Candidate ID for future applications and profile management",
			}),
		status: z
			.enum(["under_review", "auto_rejected"])
			.describe("Current application status")
			.openapi({
				example: "under_review",
				description:
					"under_review: Application received and being processed. auto_rejected: Automatically rejected due to low match score",
			}),
		score: z
			.number()
			.int()
			.min(0)
			.max(100)
			.optional()
			.describe("Candidate match score (0-100)")
			.openapi({
				example: 75,
				description:
					"Compatibility score based on resume analysis. Only provided if score is above rejection threshold",
			}),
		nextSteps: z
			.string()
			.describe("Information about what happens next")
			.openapi({
				example:
					"Your application has been received. You'll hear back within 7 business days.",
				description:
					"Human-readable message explaining the next steps in the process",
			}),
	})
	.describe("Application submission result");

const ApplicationResponseSchema = z
	.object({
		success: z
			.literal(true)
			.describe("Indicates successful application submission"),
		data: ApplicationResponseDataSchema,
		metadata: MetadataSchema,
	})
	.describe("Successful application response");

const applyToJobRoute = createRoute({
	method: "post",
	path: "/{jobId}/apply",
	tags: ["Job Applications"],
	summary: "Submit application to a job posting",
	description: `
Submit a job application with candidate information and resume. This endpoint:

- Creates or updates candidate profile
- Uploads and stores the resume file securely
- Automatically parses the resume to extract skills and experience
- Calculates compatibility score against job requirements
- Schedules automated communications based on score
- Returns application status and next steps

**File Requirements:**
- Supported formats: PDF, DOC, DOCX, TXT
- Maximum size: 5MB
- Content must be base64 encoded

**Scoring & Automation:**
- Resumes are automatically parsed using AI
- Compatibility scores calculated against job requirements
- Applications below threshold may be auto-rejected with delayed notification
- High-scoring applications proceed to recruiter review

**Rate Limiting:**
- Free tier: 100 applications/hour
- Pro tier: 1,000 applications/hour
- Enterprise: Custom limits available
  `,
	request: {
		params: z.object({
			jobId: z
				.string()
				.uuid()
				.describe("Unique identifier for the job posting")
				.openapi({
					example: "job_123e4567-e89b-12d3-a456-426614174000",
					description: "The job posting ID obtained from job listing APIs",
				}),
		}),
		body: {
			content: {
				"application/json": {
					schema: ApplicationRequestSchema,
				},
			},
			description:
				"Application data including candidate information and resume file",
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: ApplicationResponseSchema,
				},
			},
			description: "Application submitted successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description:
				"Invalid request data - check file format, size, or required fields",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Job posting not found or not accepting applications",
		},
		413: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "File too large - maximum 5MB allowed",
		},
		422: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unprocessable entity - file validation failed",
		},
		429: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Rate limit exceeded - too many applications submitted",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Internal server error during application processing",
		},
	},
	security: [
		{
			ApiKeyAuth: [],
		},
	],
});

publicJobsRoutes.openapi(applyToJobRoute, async (c: Context): Promise<any> => {
	const startTime = Date.now();
	const correlationId = c.get("correlationId") || crypto.randomUUID();
	const logger = new Logger({ correlationId, requestId: c.get("requestId") });

	try {
		const body = await c.req.json();
		const params = c.req.param();

		const jobId = params.jobId;
		const { candidateData, resumeFile } = body;

		if (!jobId) {
			return c.json(
				{
					success: false as const,
					error: {
						code: "VALIDATION_ERROR",
						message: "Job ID is required",
					},
					timestamp: new Date().toISOString(),
					correlationId,
				},
				400,
			);
		}

		if (!candidateData || !resumeFile) {
			return c.json(
				{
					success: false as const,
					error: {
						code: "VALIDATION_ERROR",
						message: "Candidate data and resume file are required",
					},
					timestamp: new Date().toISOString(),
					correlationId,
				},
				400,
			);
		}

		logger.info("Processing job application", {
			jobId,
			candidateEmail: candidateData.email,
			fileName: resumeFile.fileName,
			fileSize: resumeFile.content.length,
		});

		const config = ConfigService.getInstance().getConfig();

		const supabase = createClient<Database>(
			config.supabaseUrl,
			config.supabaseServiceRoleKey,
		);

		const fileUploadService = new FileUploadService(supabase, logger);
		const applicationService = new ApplicationService(supabase, logger);
		const emailService = new EmailService(logger, supabase);

		let fileContent: Buffer;
		try {
			fileContent = Buffer.from(resumeFile.content, "base64");
		} catch (error) {
			logger.error("Invalid base64 content", { error });
			return c.json(
				{
					success: false as const,
					error: {
						code: "INVALID_FILE_ENCODING",
						message: "Resume file must be valid base64 encoded content",
					},
					timestamp: new Date().toISOString(),
					correlationId,
				},
				400,
			);
		}

		if (fileContent.length === 0) {
			return c.json(
				{
					success: false as const,
					error: {
						code: "EMPTY_FILE",
						message: "Resume file cannot be empty",
					},
					timestamp: new Date().toISOString(),
					correlationId,
				},
				400,
			);
		}

		const maxSizeBytes = 5 * 1024 * 1024;
		if (fileContent.length > maxSizeBytes) {
			return c.json(
				{
					success: false as const,
					error: {
						code: "FILE_TOO_LARGE",
						message: `File size ${fileContent.length} bytes exceeds maximum allowed size of ${maxSizeBytes} bytes`,
					},
					timestamp: new Date().toISOString(),
					correlationId,
				},
				413,
			);
		}

		// Create candidate first to get valid candidate ID
		const application = await applicationService.createApplication({
			jobPostingId: jobId,
			candidateData,
			resumeFileId: "", // Will be updated after file upload
		});

		// Upload file with the real candidate ID
		const uploadedFile = await fileUploadService.uploadResume({
			candidateId: application.candidateId,
			fileName: resumeFile.fileName,
			fileContent,
			mimeType: resumeFile.mimeType,
			sizeBytes: fileContent.length,
			tags: resumeFile.tags,
			isDefaultResume: true,
		});

		// File is now associated with candidate through candidate_files table

		logger.info("Job application created, starting resume parsing", {
			applicationId: application.applicationId,
			candidateId: application.candidateId,
			resumeFileId: uploadedFile.id,
		});

		let parsedResumeData = null;
		let candidateScore: {
			overallScore: number;
			requiredSkillsScore: number;
			[key: string]: any;
		} | null = null;
		let enhancedStatus = application.status;

		try {
			const resumeText = fileContent.toString("utf-8");

			logger.info("Initiating resume parsing and scoring", {
				candidateId: application.candidateId,
				jobPostingId: jobId,
				resumeFileName: resumeFile.fileName,
			});

			const baseUrl = c.req.header("host")
				? `${c.req.header("x-forwarded-proto") || "http"}://${c.req.header("host")}`
				: "http://localhost:3001";

			const parseResponse = await fetch(
				`${baseUrl}/api/v1/candidates/${application.candidateId}/parse-resume`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: c.req.header("Authorization") || "",
						"x-correlation-id": correlationId,
					},
					body: JSON.stringify({
						candidateId: application.candidateId,
						jobId: jobId,
						fileContent: resumeText,
						fileName: resumeFile.fileName,
					}),
				},
			);

			if (parseResponse.ok) {
				const parseResult = (await parseResponse.json()) as {
					data: {
						parsedData: any;
						score: {
							overallScore: number;
							requiredSkillsScore: number;
							[key: string]: any;
						};
					};
					metadata?: {
						processingTimeMs?: number;
					};
				};
				parsedResumeData = parseResult.data.parsedData;
				candidateScore = parseResult.data.score;

				if (candidateScore.overallScore < 30) {
					enhancedStatus = "auto_rejected";
				}

				logger.info("Resume parsing and scoring completed", {
					candidateId: application.candidateId,
					overallScore: candidateScore.overallScore,
					requiredSkillsScore: candidateScore.requiredSkillsScore,
					processingTime: parseResult.metadata?.processingTimeMs,
					finalStatus: enhancedStatus,
				});
			} else {
				logger.warn("Resume parsing failed, continuing with application", {
					candidateId: application.candidateId,
					parseStatus: parseResponse.status,
					parseStatusText: parseResponse.statusText,
				});
			}
		} catch (parseError) {
			logger.warn("Resume parsing error, continuing with application", {
				candidateId: application.candidateId,
				error:
					parseError instanceof Error ? parseError.message : String(parseError),
			});
		}

		logger.info("Job application processed successfully", {
			applicationId: application.applicationId,
			candidateId: application.candidateId,
			status: enhancedStatus,
			scoringCompleted: !!candidateScore,
		});

		try {
			const { data: jobData } = await supabase
				.from("job_postings")
				.select("title, organizations(name)")
				.eq("id", jobId)
				.single();

			const jobTitle = jobData?.title || "Position";
			const companyName = (jobData?.organizations as any)?.name || "Company";

			logger.info("Scheduling application emails", {
				candidateId: application.candidateId,
				applicationId: application.applicationId,
				jobTitle,
				companyName,
				status: enhancedStatus,
			});

			await emailService.sendImmediateApplicationConfirmation({
				candidateName: candidateData.name,
				candidateEmail: candidateData.email,
				jobTitle,
				companyName,
				applicationId: application.applicationId,
			});

			if (enhancedStatus === "auto_rejected") {
				logger.info("Sending immediate auto-rejection email for testing", {
					applicationId: application.applicationId,
					candidateEmail: candidateData.email,
				});

				await emailService.sendTemplatedEmail(
					"candidate-rejection",
					{
						candidateName: candidateData.name,
						jobTitle,
						companyName,
						applicationId: application.applicationId,
					},
					candidateData.email,
					{
						correlationId,
						candidateId: application.candidateId,
						companyId: companyName.toLowerCase().replace(/\s+/g, "-"),
					},
				);
			}

			logger.info("Email scheduling completed", {
				applicationId: application.applicationId,
				confirmationScheduled: true,
				autoRejectionScheduled: enhancedStatus === "auto_rejected",
			});
		} catch (emailError) {
			logger.warn("Email scheduling failed, continuing with application", {
				applicationId: application.applicationId,
				error: emailError instanceof Error ? emailError.message : String(emailError),
			});
		}

		const responseData: any = {
			applicationId: application.applicationId,
			candidateId: application.candidateId,
			status: enhancedStatus,
			nextSteps:
				enhancedStatus === "auto_rejected"
					? "Your application has been reviewed. Unfortunately, you don't meet the minimum requirements for this position."
					: application.nextSteps,
		};

		if (candidateScore && candidateScore.overallScore >= 30) {
			responseData.score = candidateScore.overallScore;
		}

		return c.json({
			success: true as const,
			data: responseData,
			metadata: {
				processingTimeMs: Date.now() - startTime,
				correlationId,
				timestamp: new Date().toISOString(),
			},
		});
	} catch (error) {
		logger.error("Failed to process job application", {
			error: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
		});

		if (error instanceof Error) {
			if (
				error.message.includes("not found") ||
				error.message.includes("not accepting applications")
			) {
				return c.json(
					{
						success: false as const,
						error: {
							code: "JOB_NOT_FOUND",
							message: error.message,
						},
						timestamp: new Date().toISOString(),
						correlationId,
					},
					404,
				);
			}

			if (error.message.includes("file") || error.message.includes("upload")) {
				return c.json(
					{
						success: false as const,
						error: {
							code: "FILE_PROCESSING_ERROR",
							message: error.message,
						},
						timestamp: new Date().toISOString(),
						correlationId,
					},
					422,
				);
			}
		}

		return c.json(
			{
				success: false as const,
				error: {
					code: "INTERNAL_ERROR",
					message:
						"An error occurred while processing your application. Please try again.",
				},
				timestamp: new Date().toISOString(),
				correlationId,
			},
			500,
		);
	}
});

export { publicJobsRoutes };
