import { createRoute, z } from "@hono/zod-openapi";
import type { Context } from "hono";
import {
	createOpenAPIApp,
	ErrorResponseSchema,
	MetadataSchema,
} from "../../../lib/openapi.js";
import { Logger } from "../../../services/logger.js";

const testCandidatesRoutes = createOpenAPIApp();
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
			skill: z.string().describe("Matched skill name"),
			confidence: z.number().min(0).max(1).describe("Match confidence (0-1)"),
			context: z.string().describe("Context where skill was found"),
		}),
	),
	missingRequiredSkills: z
		.array(z.string())
		.describe("List of required skills not found in resume"),
	recommendations: z
		.array(z.string())
		.describe("AI-generated recommendations for hiring decision"),
});

const ParseResumeRequestSchema = z.object({
	jobId: z.string().uuid().describe("Job posting ID to score against"),
});

const ParseResumeResponseSchema = z.object({
	success: z.literal(true).describe("Indicates successful response"),
	data: z.object({
		parsedData: ParsedResumeDataSchema.describe("Extracted resume data"),
		score: CandidateScoreSchema.describe("Candidate scoring results"),
	}),
	metadata: MetadataSchema,
});

const parseResumeTestRoute = createRoute({
	method: "post",
	path: "/{candidateId}/parse-resume",
	summary: "Parse resume and calculate job fit score (TEST)",
	description: "Mock endpoint for testing resume parsing and scoring functionality. Returns simulated resume parsing results with variable scoring (60-95% range) to test different application scenarios including auto-rejection logic.",
	request: {
		params: z.object({
			candidateId: z.string().uuid().describe("Candidate unique identifier from job application"),
		}),
		body: {
			content: ParseResumeRequestSchema,
			description: "Job posting ID to evaluate candidate skills against job requirements",
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: ParseResumeResponseSchema,
				},
			},
			description: "Resume parsed and scored successfully. Returns comprehensive candidate evaluation including overall score (0-100), skill matches with confidence levels, experience analysis, education scoring, and hiring recommendations.",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid request parameters. Common causes: malformed UUID for candidateId, missing jobId in request body, or invalid UUID format for jobId.",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Candidate or job posting not found in the system.",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Internal server error during resume parsing or scoring calculation.",
		},
	},
	tags: ["TEST - Candidates"],
});

testCandidatesRoutes.openapi(parseResumeTestRoute, async (c: Context): Promise<any> => {
	try {
		const { candidateId } = c.req.param();
		const body = await c.req.json();

		return c.json({
			success: true,
			data: {
				parsedData: {
					personalInfo: {
						name: "Test Candidate",
						email: "test@example.com"
					},
					skills: ["JavaScript", "React"],
					experience: [],
					education: [],
					projects: [],
					certifications: [],
					languages: ["English"]
				},
				score: {
					candidateId: candidateId,
					jobId: body.jobId,
					overallScore: 75,
					requiredSkillsScore: 75,
					experienceScore: 70,
					educationScore: 80,
					skillMatches: [
						{ skill: "JavaScript", confidence: 0.9, context: "Test context" }
					],
					missingRequiredSkills: [],
					recommendations: ["Test recommendation"]
				}
			},
			metadata: {
				processingTimeMs: 100,
				correlationId: "test-123",
				timestamp: new Date().toISOString()
			}
		});

	} catch (error) {
		console.error("Parse resume test error:", error);
		return c.json({
			success: false,
			error: {
				code: "PARSING_ERROR",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			timestamp: new Date().toISOString()
		}, 500);
	}
});

export { testCandidatesRoutes };