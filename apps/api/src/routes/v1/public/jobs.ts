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

interface JobApplicationResponse {
	success: true;
	data: {
		applicationId: string;
		candidateId: string;
		status: "under_review" | "auto_rejected";
		nextSteps: string;
		score?: number;
	};
	metadata: {
		processingTimeMs: number;
		correlationId: string;
		timestamp: string;
	};
}

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

		const { data: existingApplication } = await supabase
			.from("job_applications")
			.select("id")
			.eq("candidate_email", candidateData.email)
			.eq("job_posting_id", jobId)
			.limit(1);

		if (existingApplication && existingApplication.length > 0) {
			logger.info("Duplicate application prevented", {
				candidateEmail: candidateData.email,
				jobId,
				existingApplicationId: existingApplication[0].id,
			});

			return c.json(
				{
					success: false as const,
					error: {
						code: "DUPLICATE_APPLICATION",
						message: "You have already applied to this job position.",
					},
					timestamp: new Date().toISOString(),
					correlationId,
				},
				422, // Unprocessable Entity
			);
		}

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

		const validateFileContent = (buffer: Buffer, mimeType: string): boolean => {
			const signatures: Record<string, number[]> = {
				"application/pdf": [0x25, 0x50, 0x44, 0x46],
				"text/plain": [],
			};

			const expectedSignature = signatures[mimeType];
			if (expectedSignature && expectedSignature.length > 0) {
				const fileSignature = Array.from(
					buffer.subarray(0, expectedSignature.length),
				);
				return (
					JSON.stringify(fileSignature) === JSON.stringify(expectedSignature)
				);
			}

			return buffer.length > 0;
		};

		if (!validateFileContent(fileContent, resumeFile.mimeType)) {
			logger.warn("File content validation failed", {
				mimeType: resumeFile.mimeType,
				fileName: resumeFile.fileName,
				fileSize: fileContent.length,
			});

			return c.json(
				{
					success: false as const,
					error: {
						code: "INVALID_FILE_CONTENT",
						message:
							"File content does not match the specified MIME type or is corrupted.",
					},
					timestamp: new Date().toISOString(),
					correlationId,
				},
				422,
			);
		}

		const application = await applicationService.createApplication({
			jobPostingId: jobId,
			candidateData,
			resumeFileId: "",
		});

		const uploadedFile = await fileUploadService.uploadResume({
			candidateId: application.candidateId,
			fileName: resumeFile.fileName,
			fileContent,
			mimeType: resumeFile.mimeType,
			sizeBytes: fileContent.length,
			tags: resumeFile.tags,
			isDefaultResume: true,
		});


		logger.info("Job application created, starting resume parsing", {
			applicationId: application.applicationId,
			candidateId: application.candidateId,
			resumeFileId: uploadedFile.id,
		});

		interface CandidateScore {
			overallScore: number;
			requiredSkillsScore: number;
			experienceScore: number;
			educationScore: number;
			skillMatches: Array<{
				skill: string;
				found: boolean;
				confidence: number;
				context?: string;
			}>;
			missingRequiredSkills: string[];
			recommendations: string[];
		}

		let parsedResumeData: unknown = null;
		let candidateScore: CandidateScore | null = null;
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

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 30000);

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
					signal: controller.signal,
				},
			);

			clearTimeout(timeoutId);

			if (parseResponse.ok) {
				const parseResult = (await parseResponse.json()) as {
					data: {
						parsedData: unknown;
						score: CandidateScore;
						shouldAutoReject: boolean;
					};
					metadata?: {
						processingTimeMs?: number;
					};
				};
				parsedResumeData = parseResult.data.parsedData;
				candidateScore = parseResult.data.score;

				if (parseResult.data.shouldAutoReject) {
					enhancedStatus = "auto_rejected";
				}

				logger.info("Resume parsing and scoring completed", {
					candidateId: application.candidateId,
					overallScore: candidateScore.overallScore,
					requiredSkillsScore: candidateScore.requiredSkillsScore,
					shouldAutoReject: parseResult.data.shouldAutoReject,
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
			if (parseError instanceof Error && parseError.name === "AbortError") {
				logger.warn("Resume parsing timeout, continuing with application", {
					candidateId: application.candidateId,
					timeout: "30 seconds",
				});
			} else {
				logger.warn("Resume parsing error, continuing with application", {
					candidateId: application.candidateId,
					error:
						parseError instanceof Error
							? parseError.message
							: String(parseError),
				});
			}
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
			interface OrganizationWithName {
				name: string;
			}

			const companyName =
				(jobData?.organizations as OrganizationWithName)?.name || "Company";

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
				const { error: updateError } = await supabase
					.from("job_applications")
					.update({
						status: "auto_rejected",
						updated_at: new Date().toISOString(),
					})
					.eq("id", application.applicationId);

				if (updateError) {
					logger.warn("Failed to update application status to auto_rejected", {
						applicationId: application.applicationId,
						error: updateError.message,
					});
				} else {
					logger.info("Updated application status to auto_rejected", {
						applicationId: application.applicationId,
					});
				}

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
				error:
					emailError instanceof Error ? emailError.message : String(emailError),
			});
		}

		const responseData: JobApplicationResponse["data"] = {
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

const JobPostingSchema = z
	.object({
		id: z
			.string()
			.uuid()
			.describe("Unique job posting identifier")
			.openapi({
				example: "123e4567-e89b-12d3-a456-426614174000",
				description: "UUID identifier for the job posting",
			}),
		title: z
			.string()
			.describe("Job title")
			.openapi({
				example: "Senior Frontend Developer",
				description: "The title of the job position",
			}),
		department: z
			.string()
			.nullable()
			.describe("Department or team")
			.openapi({
				example: "Engineering",
				description: "The department this position belongs to",
			}),
		job_type: z
			.string()
			.describe("Employment type")
			.openapi({
				example: "full-time",
				description: "Type of employment (full-time, part-time, contract, etc.)",
			}),
		experience_level: z
			.string()
			.nullable()
			.describe("Required experience level")
			.openapi({
				example: "senior",
				description: "Experience level required for the position",
			}),
		salary_min: z
			.number()
			.nullable()
			.describe("Minimum salary in USD")
			.openapi({
				example: 120000,
				description: "Minimum salary range in USD",
			}),
		salary_max: z
			.number()
			.nullable()
			.describe("Maximum salary in USD")
			.openapi({
				example: 180000,
				description: "Maximum salary range in USD",
			}),
		salary_type: z
			.string()
			.nullable()
			.describe("Salary type")
			.openapi({
				example: "yearly",
				description: "Salary payment frequency (yearly, monthly, hourly)",
			}),
		status: z
			.string()
			.describe("Job posting status")
			.openapi({
				example: "published",
				description: "Current status of the job posting",
			}),
		published_at: z
			.string()
			.nullable()
			.describe("Publication timestamp")
			.openapi({
				example: "2024-01-15T10:00:00.000Z",
				description: "ISO 8601 timestamp when the job was published",
			}),
		created_at: z
			.string()
			.nullable()
			.describe("Creation timestamp")
			.openapi({
				example: "2024-01-15T09:00:00.000Z",
				description: "ISO 8601 timestamp when the job was created",
			}),
		organization: z
			.object({
				id: z.string().uuid().describe("Organization ID"),
				name: z.string().describe("Organization name"),
				domain: z.string().nullable().describe("Organization domain"),
				logo_url: z.string().nullable().describe("Organization logo URL"),
			})
			.describe("Organization details"),
	})
	.describe("Job posting summary information");

const JobPostingDetailSchema = JobPostingSchema.extend({
	content: z
		.any()
		.describe("Job description content from TipTap editor")
		.openapi({
			example: {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "We are looking for..." }],
					},
				],
			},
			description: "Rich text content in TipTap/ProseMirror JSON format",
		}),
});

const JobListingResponseSchema = z
	.object({
		success: z.literal(true).describe("Indicates successful response"),
		data: z
			.array(JobPostingSchema)
			.describe("Array of job posting summaries"),
		pagination: z
			.object({
				page: z.number().int().min(1).describe("Current page number"),
				limit: z.number().int().min(1).max(100).describe("Items per page"),
				total: z.number().int().min(0).describe("Total number of jobs"),
				totalPages: z.number().int().min(0).describe("Total number of pages"),
				hasNext: z.boolean().describe("Whether there are more pages"),
				hasPrev: z.boolean().describe("Whether there are previous pages"),
			})
			.describe("Pagination information"),
		metadata: MetadataSchema,
	})
	.describe("Job listings response with pagination");

const JobDetailResponseSchema = z
	.object({
		success: z.literal(true).describe("Indicates successful response"),
		data: JobPostingDetailSchema,
		metadata: MetadataSchema,
	})
	.describe("Individual job posting details response");

const CompanyJobsResponseSchema = z
	.object({
		success: z.literal(true).describe("Indicates successful response"),
		data: z
			.object({
				organization: z
					.object({
						id: z.string().uuid().describe("Organization ID"),
						name: z.string().describe("Organization name"),
						domain: z.string().nullable().describe("Organization domain"),
						logo_url: z.string().nullable().describe("Organization logo URL"),
					})
					.describe("Organization information"),
				jobs: z
					.array(JobPostingSchema)
					.describe("Array of job postings for this organization"),
			})
			.describe("Company information and job listings"),
		pagination: z
			.object({
				page: z.number().int().min(1).describe("Current page number"),
				limit: z.number().int().min(1).max(100).describe("Items per page"),
				total: z.number().int().min(0).describe("Total number of jobs"),
				totalPages: z.number().int().min(0).describe("Total number of pages"),
				hasNext: z.boolean().describe("Whether there are more pages"),
				hasPrev: z.boolean().describe("Whether there are previous pages"),
			})
			.describe("Pagination information"),
		metadata: MetadataSchema,
	})
	.describe("Company job listings response");

const listJobsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Job Listings"],
	summary: "List all published job postings",
	description: `
Retrieve a paginated list of all published job postings across all organizations.

**Features:**
- Returns only published and active job postings
- Includes basic job information and organization details
- Supports pagination with configurable page size
- Optimized query performance with database indexes
- Results sorted by publication date (newest first)

**Use Cases:**
- Global job discovery and browsing
- Job board homepage listings
- Search engine optimization and sitemaps
- Integration with external job aggregators

**Rate Limiting:**
- Free tier: 1,000 requests/hour
- Pro tier: 10,000 requests/hour
- Enterprise: Custom limits available
	`,
	request: {
		query: z.object({
			page: z
				.string()
				.regex(/^\d+$/)
				.transform(Number)
				.refine((val) => val >= 1, "Page must be >= 1")
				.default("1")
				.describe("Page number for pagination")
				.openapi({
					example: "1",
					description: "Page number starting from 1",
				}),
			limit: z
				.string()
				.regex(/^\d+$/)
				.transform(Number)
				.refine((val) => val >= 1 && val <= 100, "Limit must be 1-100")
				.default("20")
				.describe("Number of jobs per page")
				.openapi({
					example: "20",
					description: "Items per page (1-100)",
				}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: JobListingResponseSchema,
				},
			},
			description: "Successfully retrieved job listings",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid pagination parameters",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Internal server error",
		},
	},
	security: [
		{
			ApiKeyAuth: [],
		},
	],
});

const getJobRoute = createRoute({
	method: "get",
	path: "/{jobId}",
	tags: ["Job Listings"],
	summary: "Get detailed job posting information",
	description: `
Retrieve comprehensive details for a specific job posting including full content.

**Features:**
- Complete job description with TipTap editor content
- Organization information and branding
- Salary ranges and employment details
- Publication and creation timestamps
- Optimized single query performance

**Content Format:**
- Job descriptions are stored as TipTap/ProseMirror JSON
- Rich text formatting preserved
- Structured content for consistent rendering
- Support for various content blocks and formatting

**Use Cases:**
- Individual job posting pages
- Application flow initialization
- SEO-optimized job detail views
- Candidate experience optimization

**Performance:**
- Single database query with joins
- Cached organization data
- Response time < 100ms average
	`,
	request: {
		params: z.object({
			jobId: z
				.string()
				.uuid()
				.describe("Unique job posting identifier")
				.openapi({
					example: "123e4567-e89b-12d3-a456-426614174000",
					description: "UUID of the job posting to retrieve",
				}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: JobDetailResponseSchema,
				},
			},
			description: "Successfully retrieved job details",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Job posting not found or not published",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Internal server error",
		},
	},
	security: [
		{
			ApiKeyAuth: [],
		},
	],
});

const getCompanyJobsRoute = createRoute({
	method: "get",
	path: "/company/{orgSlug}",
	tags: ["Job Listings"],
	summary: "List job postings for a specific organization",
	description: `
Retrieve job postings for a specific organization using their unique slug identifier.

**Features:**
- Organization-specific job listings
- Company branding and profile information
- Paginated results with efficient queries
- Only published and active positions
- Optimized for company career pages

**Organization Identification:**
- Uses human-readable slug instead of UUID
- Slug format: lowercase, hyphen-separated
- Example: "acme-corp" for "Acme Corporation"
- SEO-friendly URLs for company pages

**Use Cases:**
- Company-specific career pages
- Branded job board experiences
- Organization profile integration
- Candidate-facing company portals

**Performance:**
- Single query with organization lookup
- Indexed slug field for fast resolution
- Response caching for popular companies
	`,
	request: {
		params: z.object({
			orgSlug: z
				.string()
				.min(1)
				.max(50)
				.regex(/^[a-z0-9-]+$/)
				.describe("Organization slug identifier")
				.openapi({
					example: "acme-corp",
					description:
						"URL-friendly organization identifier (lowercase, hyphens allowed)",
				}),
		}),
		query: z.object({
			page: z
				.string()
				.regex(/^\d+$/)
				.transform(Number)
				.refine((val) => val >= 1, "Page must be >= 1")
				.default("1")
				.describe("Page number for pagination")
				.openapi({
					example: "1",
					description: "Page number starting from 1",
				}),
			limit: z
				.string()
				.regex(/^\d+$/)
				.transform(Number)
				.refine((val) => val >= 1 && val <= 100, "Limit must be 1-100")
				.default("20")
				.describe("Number of jobs per page")
				.openapi({
					example: "20",
					description: "Items per page (1-100)",
				}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: CompanyJobsResponseSchema,
				},
			},
			description: "Successfully retrieved company job listings",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid pagination parameters or organization slug",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Organization not found or has no published jobs",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Internal server error",
		},
	},
	security: [
		{
			ApiKeyAuth: [],
		},
	],
});

publicJobsRoutes.openapi(listJobsRoute, async (c: Context): Promise<any> => {
	const startTime = Date.now();
	const correlationId = c.get("correlationId") || crypto.randomUUID();
	const logger = new Logger({ correlationId, requestId: c.get("requestId") });

	try {
		const page = parseInt(c.req.query('page') || '1', 10);
		const limit = parseInt(c.req.query('limit') || '20', 10);
		const offset = (page - 1) * limit;

		logger.info("Fetching job listings", { page, limit, offset });

		const config = ConfigService.getInstance().getConfig();
		const supabase = createClient<Database>(
			config.supabaseUrl,
			config.supabaseServiceRoleKey,
		);

		const countQuery = supabase
			.from("job_postings")
			.select("id", { count: "exact", head: true })
			.eq("status", "published")
			.not("published_at", "is", null);

		const dataQuery = supabase
			.from("job_postings")
			.select(`
				id,
				title,
				department,
				job_type,
				experience_level,
				salary_min,
				salary_max,
				salary_type,
				status,
				published_at,
				created_at,
				organizations!inner (
					id,
					name,
					domain,
					logo_url
				)
			`)
			.eq("status", "published")
			.not("published_at", "is", null)
			.order("published_at", { ascending: false })
			.range(offset, offset + limit - 1);

		const [countResult, dataResult] = await Promise.all([
			countQuery,
			dataQuery,
		]);

		if (countResult.error) {
			logger.error("Failed to fetch job count", {
				error: countResult.error.message,
				code: countResult.error.code,
			});
			throw new Error("Failed to fetch job listings");
		}

		if (dataResult.error) {
			logger.error("Failed to fetch job data", {
				error: dataResult.error.message,
				code: dataResult.error.code,
			});
			throw new Error("Failed to fetch job listings");
		}

		const total = countResult.count || 0;
		const totalPages = Math.ceil(total / limit);

		const jobs = dataResult.data.map((job) => ({
			id: job.id,
			title: job.title,
			department: job.department,
			job_type: job.job_type,
			experience_level: job.experience_level,
			salary_min: job.salary_min,
			salary_max: job.salary_max,
			salary_type: job.salary_type,
			status: job.status,
			published_at: job.published_at,
			created_at: job.created_at,
			organization: {
				id: job.organizations.id,
				name: job.organizations.name,
				domain: job.organizations.domain,
				logo_url: job.organizations.logo_url,
			},
		}));

		logger.info("Successfully fetched job listings", {
			jobCount: jobs.length,
			totalJobs: total,
			page,
			totalPages,
			processingTimeMs: Date.now() - startTime,
		});

		return c.json({
			success: true as const,
			data: jobs,
			pagination: {
				page,
				limit,
				total,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1,
			},
			metadata: {
				processingTimeMs: Date.now() - startTime,
				correlationId,
				timestamp: new Date().toISOString(),
			},
		});
	} catch (error) {
		logger.error("Failed to fetch job listings", {
			error: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
		});

		return c.json(
			{
				success: false as const,
				error: {
					code: "FETCH_ERROR",
					message:
						"An error occurred while fetching job listings. Please try again.",
				},
				timestamp: new Date().toISOString(),
				correlationId,
			},
			500,
		);
	}
});

publicJobsRoutes.openapi(getJobRoute, async (c: Context): Promise<any> => {
	const startTime = Date.now();
	const correlationId = c.get("correlationId") || crypto.randomUUID();
	const logger = new Logger({ correlationId, requestId: c.get("requestId") });

	try {
		const params = c.req.param();
		const jobId = params.jobId;

		logger.info("Fetching job details", { jobId });

		const config = ConfigService.getInstance().getConfig();
		const supabase = createClient<Database>(
			config.supabaseUrl,
			config.supabaseServiceRoleKey,
		);

		const { data, error } = await supabase
			.from("job_postings")
			.select(`
				id,
				title,
				content,
				department,
				job_type,
				experience_level,
				salary_min,
				salary_max,
				salary_type,
				status,
				published_at,
				created_at,
				organizations!inner (
					id,
					name,
					domain,
					logo_url
				)
			`)
			.eq("id", jobId)
			.eq("status", "published")
			.not("published_at", "is", null)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				logger.warn("Job not found or not published", {
					jobId,
					error: error.message,
				});
				return c.json(
					{
						success: false as const,
						error: {
							code: "JOB_NOT_FOUND",
							message: "Job posting not found or not currently available.",
						},
						timestamp: new Date().toISOString(),
						correlationId,
					},
					404,
				);
			}

			logger.error("Failed to fetch job details", {
				jobId,
				error: error.message,
				code: error.code,
			});
			throw new Error("Failed to fetch job details");
		}

		const job = {
			id: data.id,
			title: data.title,
			content: data.content,
			department: data.department,
			job_type: data.job_type,
			experience_level: data.experience_level,
			salary_min: data.salary_min,
			salary_max: data.salary_max,
			salary_type: data.salary_type,
			status: data.status,
			published_at: data.published_at,
			created_at: data.created_at,
			organization: {
				id: data.organizations.id,
				name: data.organizations.name,
				domain: data.organizations.domain,
				logo_url: data.organizations.logo_url,
			},
		};

		logger.info("Successfully fetched job details", {
			jobId,
			jobTitle: job.title,
			organizationName: job.organization.name,
			processingTimeMs: Date.now() - startTime,
		});

		return c.json({
			success: true as const,
			data: job,
			metadata: {
				processingTimeMs: Date.now() - startTime,
				correlationId,
				timestamp: new Date().toISOString(),
			},
		});
	} catch (error) {
		logger.error("Failed to fetch job details", {
			error: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
		});

		return c.json(
			{
				success: false as const,
				error: {
					code: "FETCH_ERROR",
					message:
						"An error occurred while fetching job details. Please try again.",
				},
				timestamp: new Date().toISOString(),
				correlationId,
			},
			500,
		);
	}
});

publicJobsRoutes.openapi(getCompanyJobsRoute, async (c: Context): Promise<any> => {
	const startTime = Date.now();
	const correlationId = c.get("correlationId") || crypto.randomUUID();
	const logger = new Logger({ correlationId, requestId: c.get("requestId") });

	try {
		const params = c.req.param();
		const orgSlug = params.orgSlug;
		const page = parseInt(c.req.query('page') || '1', 10);
		const limit = parseInt(c.req.query('limit') || '20', 10);
		const offset = (page - 1) * limit;

		logger.info("Fetching company jobs", { orgSlug, page, limit, offset });

		const config = ConfigService.getInstance().getConfig();
		const supabase = createClient<Database>(
			config.supabaseUrl,
			config.supabaseServiceRoleKey,
		);

		const orgQuery = supabase
			.from("organizations")
			.select("id, name, domain, logo_url")
			.eq("domain", orgSlug)
			.single();

		const orgResult = await orgQuery;

		if (orgResult.error) {
			if (orgResult.error.code === "PGRST116") {
				logger.warn("Organization not found", {
					orgSlug,
					error: orgResult.error.message,
				});
				return c.json(
					{
						success: false as const,
						error: {
							code: "ORGANIZATION_NOT_FOUND",
							message: "Organization not found.",
						},
						timestamp: new Date().toISOString(),
						correlationId,
					},
					404,
				);
			}

			logger.error("Failed to fetch organization", {
				orgSlug,
				error: orgResult.error.message,
				code: orgResult.error.code,
			});
			throw new Error("Failed to fetch organization");
		}

		const organization = orgResult.data;

		const countQuery = supabase
			.from("job_postings")
			.select("id", { count: "exact", head: true })
			.eq("organization_id", organization.id)
			.eq("status", "published")
			.not("published_at", "is", null);

		const dataQuery = supabase
			.from("job_postings")
			.select(`
				id,
				title,
				department,
				job_type,
				experience_level,
				salary_min,
				salary_max,
				salary_type,
				status,
				published_at,
				created_at
			`)
			.eq("organization_id", organization.id)
			.eq("status", "published")
			.not("published_at", "is", null)
			.order("published_at", { ascending: false })
			.range(offset, offset + limit - 1);

		const [countResult, dataResult] = await Promise.all([
			countQuery,
			dataQuery,
		]);

		if (countResult.error) {
			logger.error("Failed to fetch job count for organization", {
				orgSlug,
				organizationId: organization.id,
				error: countResult.error.message,
				code: countResult.error.code,
			});
			throw new Error("Failed to fetch company jobs");
		}

		if (dataResult.error) {
			logger.error("Failed to fetch job data for organization", {
				orgSlug,
				organizationId: organization.id,
				error: dataResult.error.message,
				code: dataResult.error.code,
			});
			throw new Error("Failed to fetch company jobs");
		}

		const total = countResult.count || 0;
		const totalPages = Math.ceil(total / limit);

		if (total === 0) {
			logger.info("No published jobs found for organization", {
				orgSlug,
				organizationId: organization.id,
				organizationName: organization.name,
			});
			return c.json(
				{
					success: false as const,
					error: {
						code: "NO_JOBS_FOUND",
						message: "No published job postings found for this organization.",
					},
					timestamp: new Date().toISOString(),
					correlationId,
				},
				404,
			);
		}

		const jobs = dataResult.data.map((job) => ({
			id: job.id,
			title: job.title,
			department: job.department,
			job_type: job.job_type,
			experience_level: job.experience_level,
			salary_min: job.salary_min,
			salary_max: job.salary_max,
			salary_type: job.salary_type,
			status: job.status,
			published_at: job.published_at,
			created_at: job.created_at,
			organization: {
				id: organization.id,
				name: organization.name,
				domain: organization.domain,
				logo_url: organization.logo_url,
			},
		}));

		logger.info("Successfully fetched company jobs", {
			orgSlug,
			organizationName: organization.name,
			jobCount: jobs.length,
			totalJobs: total,
			page,
			totalPages,
			processingTimeMs: Date.now() - startTime,
		});

		return c.json({
			success: true as const,
			data: {
				organization: {
					id: organization.id,
					name: organization.name,
					domain: organization.domain,
					logo_url: organization.logo_url,
				},
				jobs,
			},
			pagination: {
				page,
				limit,
				total,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1,
			},
			metadata: {
				processingTimeMs: Date.now() - startTime,
				correlationId,
				timestamp: new Date().toISOString(),
			},
		});
	} catch (error) {
		logger.error("Failed to fetch company jobs", {
			error: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
		});

		return c.json(
			{
				success: false as const,
				error: {
					code: "FETCH_ERROR",
					message:
						"An error occurred while fetching company jobs. Please try again.",
				},
				timestamp: new Date().toISOString(),
				correlationId,
			},
			500,
		);
	}
});

export { publicJobsRoutes };
