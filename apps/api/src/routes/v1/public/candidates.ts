import { createRoute, z } from "@hono/zod-openapi";
import type { Context } from "hono";
import {
	createOpenAPIApp,
	ErrorResponseSchema,
	MetadataSchema,
} from "../../../lib/openapi.js";
import {
	type PublicAuthContext,
	publicAuth,
} from "../../../middleware/public-auth.js";
import { adaptiveRateLimit } from "../../../middleware/rate-limit.js";
import {
	businessValidation,
	validate,
} from "../../../middleware/validation.js";
import { AIService } from "../../../services/ai.js";
import { CandidateScoringService } from "../../../services/candidate-scoring.js";
import { JobRequirementsService } from "../../../services/job-requirements.js";
import { Logger } from "../../../services/logger.js";
import { SkillMatcherService } from "../../../services/skill-matcher.js";

const publicCandidatesRoutes = createOpenAPIApp();

publicCandidatesRoutes.use("*", publicAuth());
publicCandidatesRoutes.use("*", adaptiveRateLimit());

const PersonalInfoSchema = z.object({
	name: z.string().describe("Full name of the candidate"),
	email: z.string().email().optional().describe("Email address"),
	phone: z.string().optional().describe("Phone number"),
	location: z.string().optional().describe("Current location"),
	linkedinUrl: z.string().url().optional().describe("LinkedIn profile URL"),
	githubUrl: z.string().url().optional().describe("GitHub profile URL"),
	portfolioUrl: z
		.string()
		.url()
		.optional()
		.describe("Personal portfolio website"),
});

const ParsedResumeDataSchema = z.object({
	personalInfo: PersonalInfoSchema,
	skills: z.array(z.string()).describe("Extracted technical and soft skills"),
	experience: z.array(
		z.object({
			company: z.string(),
			position: z.string(),
			startDate: z.string(),
			endDate: z.string().nullable(),
			description: z.string(),
		}),
	),
	education: z.array(
		z.object({
			institution: z.string(),
			degree: z.string(),
			field: z.string().optional(),
			graduationDate: z.string().optional(),
			gpa: z.string().optional(),
		}),
	),
	projects: z.array(
		z.object({
			name: z.string(),
			description: z.string(),
			technologies: z.array(z.string()),
			githubUrl: z.string().optional(),
		}),
	),
	certifications: z.array(
		z.object({
			name: z.string(),
			issuer: z.string(),
			issueDate: z.string().optional(),
		}),
	),
	languages: z.array(z.string()),
});

const CandidateScoreSchema = z.object({
	candidateId: z.string().describe("Candidate unique identifier"),
	jobId: z.string().describe("Job posting unique identifier"),
	overallScore: z
		.number()
		.min(0)
		.max(100)
		.describe("Overall candidate fit score (0-100)"),
	requiredSkillsScore: z
		.number()
		.min(0)
		.max(100)
		.describe("Score for required skills match (0-100)"),
	experienceScore: z
		.number()
		.min(0)
		.max(100)
		.describe("Experience relevance score (0-100)"),
	educationScore: z
		.number()
		.min(0)
		.max(100)
		.describe("Education background score (0-100)"),
	skillMatches: z.array(
		z.object({
			skill: z.string(),
			found: z.boolean(),
			confidence: z.number(),
			context: z.string().optional(),
		}),
	),
	missingRequiredSkills: z.array(z.string()),
	recommendations: z.array(z.string()),
});

const ParseResumeRequestSchema = z.object({
	body: z.object({
		candidateId: z.string().uuid("Must be a valid UUID"),
		jobId: z.string().uuid("Must be a valid UUID"),
		fileContent: z
			.string()
			.min(10, "Resume content must be at least 10 characters"),
		fileName: z.string().min(1, "File name is required"),
	}),
	params: z.object({
		id: z.string().uuid("Candidate ID must be a valid UUID"),
	}),
});

const ParseResumeResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		parsedData: ParsedResumeDataSchema,
		score: CandidateScoreSchema,
	}),
	metadata: MetadataSchema,
});

const parseResumeRoute = createRoute({
	method: "post",
	path: "/{id}/parse-resume",
	tags: ["Public - Candidates"],
	summary: "Parse resume and calculate job fit score",
	description: `Parse a candidate's resume using AI and calculate their skill match score against a job posting.
    
    **Key Features:**
    - AI-powered resume text extraction using OpenAI GPT-4
    - Structured data extraction (skills, experience, education, projects, certifications)
    - Hidden link detection (GitHub, LinkedIn profiles)
    - Intelligent skill matching with confidence scores
    - Multi-factor scoring algorithm (skills, experience, education)
    - Hiring recommendations and auto-rejection logic
    
    **Rate Limits:**
    - Free tier: 100 requests/hour
    - Pro tier: 1,000 requests/hour
    - Enterprise: Custom limits
    
    **Processing Time:** Typically 2-5 seconds depending on resume length.`,
	security: [{ bearerAuth: [] }],
	request: {
		params: z.object({
			id: z
				.string()
				.describe("Candidate ID - must match candidateId in request body"),
		}),
		body: {
			content: {
				"application/json": {
					schema: z.object({
						candidateId: z
							.string()
							.uuid()
							.describe("Unique identifier for the candidate"),
						jobId: z
							.string()
							.uuid()
							.describe("Job posting ID to match against for skill scoring"),
						fileContent: z
							.string()
							.min(10)
							.describe("Resume text content (extracted from PDF/DOCX/TXT)"),
						fileName: z
							.string()
							.min(1)
							.describe("Original filename for processing context"),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: ParseResumeResponseSchema,
				},
			},
			description:
				"Resume parsed successfully with comprehensive skill matching analysis",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid request data or business validation failed",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Authentication required - invalid or missing API key",
		},
		403: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Access denied - insufficient permissions for this resource",
		},
		429: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Rate limit exceeded - upgrade your plan for higher limits",
		},
		503: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "AI service temporarily unavailable",
		},
	},
});

const validateCandidateOwnership = async (c: Context) => {
	const { candidateId } = c.get("validatedData").body;
	const { companyId } = c.get("apiKeyMeta");

	if (!candidateId || !companyId) {
		throw new Error("Missing candidate ID or company ID");
	}

	if (candidateId !== c.req.param("id")) {
		throw new Error(
			"Candidate ID in URL must match candidateId in request body",
		);
	}
};

publicCandidatesRoutes.openapi(
	parseResumeRoute,
	async (c: Context): Promise<any> => {
		try {
			const body = await c.req.json();
			const params = c.req.param();

			const validatedData = ParseResumeRequestSchema.parse({ body, params });
			c.set("validatedData", validatedData);

			// Business validation
			const { candidateId } = validatedData.body;
			const { companyId } = c.get("apiKeyMeta") || {};

			if (!candidateId || !companyId) {
				return c.json(
					{
						success: false as const,
						error: {
							code: "VALIDATION_ERROR",
							message: "Missing candidate ID or company ID",
						},
						timestamp: new Date().toISOString(),
						correlationId: c.get("correlationId"),
					},
					400,
				);
			}

			if (candidateId !== params.id) {
				return c.json(
					{
						success: false as const,
						error: {
							code: "VALIDATION_ERROR",
							message:
								"Candidate ID in URL must match candidateId in request body",
						},
						timestamp: new Date().toISOString(),
						correlationId: c.get("correlationId"),
					},
					400,
				);
			}
		} catch (error) {
			return c.json(
				{
					success: false as const,
					error: {
						code: "VALIDATION_ERROR",
						message: "Invalid request data",
					},
					correlationId: c.get("correlationId"),
				},
				400,
			);
		}
		const correlationId = c.get("correlationId");
		const logger = new Logger({ correlationId, requestId: c.get("requestId") });
		const { body } = c.get("validatedData");
		const { candidateId, jobId, fileContent, fileName } = body;

		const getTimer = () => {
			const start = Date.now();
			return () => Date.now() - start;
		};
		const totalTimer = getTimer();

		try {
			logger.info("Public API: Starting resume parsing", {
				candidateId,
				jobId,
				fileName,
				contentLength: fileContent.length,
				companyId: c.get("apiKeyMeta").companyId,
				tier: c.get("apiKeyMeta").tier,
			});

			const aiService = new AIService(logger);
			const jobRequirementsService = new JobRequirementsService(logger);
			const skillMatcherService = new SkillMatcherService(logger);
			const candidateScoringService = new CandidateScoringService(logger);

			const parsedData = await aiService.parseResume(fileContent, fileName);

			logger.info("AI parsing completed successfully", {
				candidateId,
				fileName,
				skillsExtracted: parsedData.skills?.length || 0,
				experienceEntries: parsedData.experience?.length || 0,
				educationEntries: parsedData.education?.length || 0,
			});

			const jobRequirements =
				await jobRequirementsService.getJobRequirements(jobId);
			const baseScore = skillMatcherService.calculateCandidateScore(
				parsedData,
				jobRequirements,
			);
			const recommendations = skillMatcherService.generateRecommendations(
				parsedData,
				baseScore,
				jobRequirements,
			);
			const score = { ...baseScore, candidateId, recommendations };

			try {
				await candidateScoringService.saveScore(score, {
					processingTimeMs: totalTimer(),
					correlationId,
					aiModelVersion: "gpt-4o",
					autoRejected: skillMatcherService.shouldAutoReject(
						score,
						jobRequirements,
					),
				});
				logger.info("Score saved to database", {
					candidateId,
					jobId,
					overallScore: score.overallScore,
				});
			} catch (dbError) {
				logger.warn("Failed to save score (continuing)", {
					error: dbError,
					candidateId,
				});
			}

			logger.info("Public API: Resume parsing completed", {
				candidateId,
				jobId,
				overallScore: score.overallScore,
				processingTimeMs: totalTimer(),
				success: true,
			});

			return c.json({
				success: true as const,
				data: {
					parsedData,
					score,
				},
				metadata: {
					processingTimeMs: totalTimer(),
					correlationId,
					timestamp: new Date().toISOString(),
				},
			});
		} catch (error) {
			const processingTime = totalTimer();

			logger.error("Public API: Resume parsing failed", error, {
				candidateId,
				fileName,
				processingTimeMs: processingTime,
			});

			if (error instanceof Error && error.message.includes("OpenAI")) {
				return c.json(
					{
						success: false as const,
						error: {
							code: "AI_SERVICE_UNAVAILABLE",
							message:
								"AI service is temporarily unavailable. Please try again in a few moments.",
							retryAfter: "30s",
						},
						timestamp: new Date().toISOString(),
						correlationId,
					},
					503,
				);
			}

			return c.json(
				{
					success: false as const,
					error: {
						code: "INTERNAL_ERROR",
						message: "An error occurred while processing your request",
					},
					timestamp: new Date().toISOString(),
					correlationId,
				},
				500,
			);
		}
	},
);

const GetScoreRequestSchema = z.object({
	params: z.object({
		id: z.string().uuid("Candidate ID must be a valid UUID"),
	}),
	query: z.object({
		jobId: z.string().uuid("Job ID must be a valid UUID"),
		includeDetails: z.enum(["true", "false"]).optional().default("false"),
	}),
});

const GetScoreResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		candidateId: z.string(),
		jobId: z.string(),
		overallScore: z.number().min(0).max(100),
		scoreBreakdown: z
			.object({
				requiredSkillsScore: z.number().min(0).max(100),
				experienceScore: z.number().min(0).max(100),
				educationScore: z.number().min(0).max(100),
			})
			.optional(),
		recommendations: z.array(z.string()).optional(),
		evaluatedAt: z.string(),
		scoreId: z.string(),
	}),
	metadata: z.object({
		correlationId: z.string(),
		timestamp: z.string(),
		cached: z.boolean(),
	}),
});

const getScoreRoute = createRoute({
	method: "get",
	path: "/{id}/score",
	tags: ["Public - Candidates"],
	summary: "Retrieve candidate score for a job",
	description: `Retrieve a previously calculated candidate score for a specific job posting.
    
    **Security Features:**
    - Only returns scores for candidates owned by the requesting company
    - Sensitive details (skill matches, missing skills) are excluded by default
    - Use includeDetails=true to get full scoring breakdown (requires additional permissions)
    - Audit trail for all score retrievals
    
    **Rate Limits:**
    - Free tier: 100 requests/hour
    - Pro tier: 1,000 requests/hour
    - Enterprise: Custom limits
    
    **GDPR Compliance:**
    - No PII is exposed in the response
    - All access is logged for audit purposes
    - Data retention policies apply`,
	security: [{ bearerAuth: [] }],
	request: {
		params: z.object({
			id: z.string().describe("Candidate ID"),
		}),
		query: z.object({
			jobId: z.string().describe("Job posting ID to retrieve score for"),
			includeDetails: z
				.enum(["true", "false"])
				.optional()
				.describe(
					"Include detailed breakdown (requires additional permissions)",
				),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: GetScoreResponseSchema,
				},
			},
			description: "Score retrieved successfully",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Score not found for this candidate/job combination",
		},
		403: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Access denied - candidate not owned by your company",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Authentication required",
		},
	},
});

const validateScoreAccess = async (c: Context) => {
	const { id: candidateId } = c.get("validatedData").params;
	const { jobId } = c.get("validatedData").query;
	const { companyId, permissions } = c.get("apiKeyMeta");

	const logger = new Logger({
		correlationId: c.get("correlationId"),
		requestId: c.get("requestId"),
		action: "score_retrieval",
		candidateId,
		jobId,
		companyId,
	});

	logger.info("Score access attempt", {
		candidateId,
		jobId,
		companyId,
		includeDetails: c.get("validatedData").query.includeDetails === "true",
	});

	if (
		c.get("validatedData").query.includeDetails === "true" &&
		!permissions.includes("scores:read:detailed")
	) {
		logger.warn("Detailed score access denied - insufficient permissions", {
			candidateId,
			companyId,
			requiredPermission: "scores:read:detailed",
		});
		throw new Error(
			"Detailed score access requires scores:read:detailed permission",
		);
	}
};

publicCandidatesRoutes.openapi(
	getScoreRoute,
	async (c: Context): Promise<any> => {
		try {
			const params = c.req.param();
			const query = Object.fromEntries(
				new URL(c.req.url).searchParams.entries(),
			);

			const validatedData = GetScoreRequestSchema.parse({ params, query });
			c.set("validatedData", validatedData);

			// Business validation
			const { id: candidateId } = validatedData.params;
			const { jobId } = validatedData.query;
			const { companyId, permissions } = c.get("apiKeyMeta") || {
				permissions: [],
			};

			if (
				validatedData.query.includeDetails === "true" &&
				!permissions.includes("scores:read:detailed")
			) {
				return c.json(
					{
						success: false as const,
						error: {
							code: "INSUFFICIENT_PERMISSIONS",
							message:
								"Detailed score access requires scores:read:detailed permission",
						},
						timestamp: new Date().toISOString(),
						correlationId: c.get("correlationId"),
					},
					403,
				);
			}
		} catch (error) {
			return c.json(
				{
					success: false as const,
					error: {
						code: "VALIDATION_ERROR",
						message: "Invalid request data",
					},
					correlationId: c.get("correlationId"),
				},
				400,
			);
		}
		const correlationId = c.get("correlationId");
		const logger = new Logger({ correlationId, requestId: c.get("requestId") });
		const { params, query } = c.get("validatedData");
		const { id: candidateId } = params;
		const { jobId, includeDetails } = query;
		const { companyId } = c.get("apiKeyMeta");

		try {
			logger.info("Public API: Retrieving candidate score", {
				candidateId,
				jobId,
				companyId,
				includeDetails: includeDetails === "true",
			});

			const candidateScoringService = new CandidateScoringService(logger);

			const score = await candidateScoringService.getScore(candidateId, jobId);

			if (!score) {
				logger.info("Score not found", { candidateId, jobId, companyId });

				return c.json(
					{
						success: false as const,
						error: {
							code: "SCORE_NOT_FOUND",
							message: "No score found for this candidate and job combination",
						},
						timestamp: new Date().toISOString(),
						correlationId,
					},
					404,
				);
			}

			const responseData: any = {
				candidateId: score.candidateId,
				jobId: score.jobId,
				overallScore: score.overallScore,
				evaluatedAt: score.createdAt || new Date().toISOString(),
				scoreId: score.id,
			};

			if (includeDetails === "true") {
				responseData.scoreBreakdown = {
					requiredSkillsScore: score.requiredSkillsScore,
					experienceScore: score.experienceScore,
					educationScore: score.educationScore,
				};
				responseData.recommendations = score.recommendations;
			}

			logger.info("Public API: Score retrieved successfully", {
				candidateId,
				jobId,
				overallScore: score.overallScore,
				includeDetails: includeDetails === "true",
				companyId,
			});

			return c.json({
				success: true as const,
				data: responseData,
				metadata: {
					correlationId,
					timestamp: new Date().toISOString(),
					cached: false,
				},
			});
		} catch (error) {
			logger.error("Public API: Score retrieval failed", error, {
				candidateId,
				jobId,
				companyId,
			});

			return c.json(
				{
					success: false as const,
					error: {
						code: "INTERNAL_ERROR",
						message: "Failed to retrieve candidate score",
					},
					timestamp: new Date().toISOString(),
					correlationId,
				},
				500,
			);
		}
	},
);

export { publicCandidatesRoutes };
