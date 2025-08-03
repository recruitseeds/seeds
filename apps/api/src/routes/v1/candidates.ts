import { createRoute, z } from "@hono/zod-openapi";
import {
	createOpenAPIApp,
	ErrorResponseSchema,
	MetadataSchema,
} from "../../lib/openapi.js";
import { AIService } from "../../services/ai.js";
import { CandidateScoringService } from "../../services/candidate-scoring.js";
import { JobRequirementsService } from "../../services/job-requirements.js";
import { Logger } from "../../services/logger.js";
import { SkillMatcherService } from "../../services/skill-matcher.js";

const candidatesRoutes = createOpenAPIApp();

const PersonalInfoSchema = z
	.object({
		name: z
			.string()
			.describe("Full name of the candidate")
			.openapi({ example: "Sarah Johnson" }),
		email: z
			.string()
			.email()
			.optional()
			.describe("Email address")
			.openapi({ example: "sarah.johnson@email.com" }),
		phone: z
			.string()
			.optional()
			.describe("Phone number")
			.openapi({ example: "+1-555-0123" }),
		location: z
			.string()
			.optional()
			.describe("Current location")
			.openapi({ example: "San Francisco, CA" }),
		linkedinUrl: z
			.string()
			.url()
			.optional()
			.describe("LinkedIn profile URL")
			.openapi({ example: "https://linkedin.com/in/sarahjohnson" }),
		githubUrl: z
			.string()
			.url()
			.optional()
			.describe("GitHub profile URL")
			.openapi({ example: "https://github.com/sarahjohnson" }),
		portfolioUrl: z
			.string()
			.url()
			.optional()
			.describe("Personal portfolio website")
			.openapi({ example: "https://sarahjohnson.dev" }),
	})
	.describe("Personal information extracted from resume");

const ExperienceSchema = z
	.object({
		company: z
			.string()
			.describe("Company name")
			.openapi({ example: "Tech Unicorn Inc" }),
		position: z
			.string()
			.describe("Job title/position")
			.openapi({ example: "Senior Software Engineer" }),
		startDate: z
			.string()
			.describe("Start date (YYYY-MM format)")
			.openapi({ example: "2021-03" }),
		endDate: z
			.string()
			.optional()
			.describe("End date (YYYY-MM format), null if current position")
			.openapi({ example: "2024-01" }),
		description: z
			.string()
			.describe("Job description and responsibilities")
			.openapi({
				example:
					"Led development of React-based dashboard serving 10M+ users. Built microservices architecture with Node.js and TypeScript.",
			}),
		skills: z
			.array(z.string())
			.describe("Technologies and skills used in this role")
			.openapi({
				example: ["React", "TypeScript", "Node.js", "AWS", "Docker"],
			}),
		location: z
			.string()
			.optional()
			.describe("Job location")
			.openapi({ example: "San Francisco, CA" }),
	})
	.describe("Work experience entry");

const EducationSchema = z
	.object({
		institution: z
			.string()
			.describe("Educational institution name")
			.openapi({ example: "Stanford University" }),
		degree: z
			.string()
			.describe("Degree type")
			.openapi({ example: "Bachelor of Science" }),
		field: z
			.string()
			.describe("Field of study")
			.openapi({ example: "Computer Science" }),
		graduationDate: z
			.string()
			.optional()
			.describe("Graduation date (YYYY-MM format)")
			.openapi({ example: "2018-06" }),
		gpa: z
			.string()
			.optional()
			.describe("Grade point average")
			.openapi({ example: "3.8" }),
	})
	.describe("Education entry");

const ProjectSchema = z
	.object({
		name: z
			.string()
			.describe("Project name")
			.openapi({ example: "E-commerce Analytics Dashboard" }),
		description: z.string().describe("Project description").openapi({
			example: "Real-time analytics dashboard for e-commerce platforms",
		}),
		technologies: z
			.array(z.string())
			.describe("Technologies used")
			.openapi({ example: ["TypeScript", "D3.js", "Express.js", "Redis"] }),
		url: z
			.string()
			.url()
			.optional()
			.describe("Live project URL")
			.openapi({ example: "https://analytics.example.com" }),
		githubUrl: z
			.string()
			.url()
			.optional()
			.describe("GitHub repository URL")
			.openapi({
				example: "https://github.com/sarahjohnson/analytics-dashboard",
			}),
	})
	.describe("Project entry");

const CertificationSchema = z
	.object({
		name: z
			.string()
			.describe("Certification name")
			.openapi({ example: "AWS Solutions Architect Associate" }),
		issuer: z
			.string()
			.describe("Issuing organization")
			.openapi({ example: "Amazon Web Services" }),
		issueDate: z
			.string()
			.optional()
			.describe("Issue date (YYYY-MM format)")
			.openapi({ example: "2023-05" }),
		expirationDate: z
			.string()
			.optional()
			.describe("Expiration date (YYYY-MM format)")
			.openapi({ example: "2026-05" }),
		credentialId: z
			.string()
			.optional()
			.describe("Credential ID or badge number")
			.openapi({ example: "AWS-ASA-123456" }),
		url: z
			.string()
			.url()
			.optional()
			.describe("Verification URL")
			.openapi({ example: "https://aws.amazon.com/verification/123456" }),
	})
	.describe("Professional certification");

const ParsedResumeDataSchema = z
	.object({
		personalInfo: PersonalInfoSchema,
		summary: z
			.string()
			.optional()
			.describe("Professional summary or objective")
			.openapi({
				example:
					"Senior full-stack engineer with 6+ years of experience building scalable web applications using modern JavaScript frameworks and cloud technologies.",
			}),
		experience: z.array(ExperienceSchema).describe("Work experience history"),
		education: z.array(EducationSchema).describe("Educational background"),
		skills: z
			.array(z.string())
			.describe("Technical skills and competencies")
			.openapi({
				example: [
					"React",
					"TypeScript",
					"Node.js",
					"AWS",
					"Docker",
					"PostgreSQL",
				],
			}),
		projects: z
			.array(ProjectSchema)
			.describe("Notable projects and portfolio items"),
		certifications: z
			.array(CertificationSchema)
			.describe("Professional certifications"),
		languages: z
			.array(z.string())
			.describe("Spoken languages")
			.openapi({ example: ["English", "Spanish"] }),
	})
	.describe("Complete parsed resume data structure");

const SkillMatchSchema = z
	.object({
		skill: z
			.string()
			.describe("Skill or technology name")
			.openapi({ example: "React" }),
		found: z
			.boolean()
			.describe("Whether this skill was found in candidate's resume")
			.openapi({ example: true }),
		confidence: z
			.number()
			.min(0)
			.max(1)
			.describe("Confidence score for skill match (0-1)")
			.openapi({ example: 0.95 }),
		context: z
			.string()
			.optional()
			.describe("Additional context about the skill match")
			.openapi({ example: "Exact match found in candidate skills" }),
	})
	.describe("Individual skill matching result");

const CandidateScoreSchema = z
	.object({
		candidateId: z
			.string()
			.describe("Candidate unique identifier")
			.openapi({ example: "candidate-123" }),
		jobId: z
			.string()
			.describe("Job posting unique identifier")
			.openapi({ example: "job-456" }),
		overallScore: z
			.number()
			.min(0)
			.max(100)
			.describe("Overall candidate fit score (0-100)")
			.openapi({ example: 85 }),
		requiredSkillsScore: z
			.number()
			.min(0)
			.max(100)
			.describe("Score for required skills match (0-100)")
			.openapi({ example: 90 }),
		experienceScore: z
			.number()
			.min(0)
			.max(100)
			.describe("Experience relevance score (0-100)")
			.openapi({ example: 80 }),
		educationScore: z
			.number()
			.min(0)
			.max(100)
			.describe("Education background score (0-100)")
			.openapi({ example: 85 }),
		skillMatches: z
			.array(SkillMatchSchema)
			.describe("Detailed skill matching results"),
		missingRequiredSkills: z
			.array(z.string())
			.describe("Required skills not found in resume")
			.openapi({ example: ["Kubernetes", "GraphQL"] }),
		recommendations: z
			.array(z.string())
			.describe("AI-generated hiring recommendations")
			.openapi({
				example: [
					"🌟 Excellent candidate - highly recommended for interview",
					"💡 Has all required technical skills",
				],
			}),
	})
	.describe("Comprehensive candidate scoring and analysis results");

const ParseResumeRequestSchema = z
	.object({
		candidateId: z
			.string()
			.describe("Unique identifier for the candidate")
			.openapi({ example: "candidate-123" }),
		jobId: z
			.string()
			.describe("Job posting ID to match against for skill scoring")
			.openapi({ example: "job-456" }),
		fileContent: z
			.string()
			.describe("Resume text content (extracted from PDF/DOCX/TXT files)")
			.openapi({
				example:
					"SARAH JOHNSON\\nSenior Software Engineer\\n\\nEXPERIENCE\\nTech Corp - Senior Engineer (2020-2024)\\nBuilt React applications with TypeScript...",
			}),
		fileName: z
			.string()
			.describe("Original filename of the resume for processing context")
			.openapi({ example: "sarah_johnson_resume.pdf" }),
	})
	.describe("Resume parsing and skill analysis request");

const ParseResumeResponseSchema = z
	.object({
		success: z.literal(true).describe("Request success indicator"),
		data: z
			.object({
				parsedData: ParsedResumeDataSchema.describe(
					"Structured resume data extracted by AI",
				),
				score: CandidateScoreSchema.describe(
					"Candidate scoring and skill matching results",
				),
			})
			.describe("Response payload containing parsed resume and scoring data"),
		metadata: MetadataSchema.describe(
			"Request metadata including processing time and correlation ID",
		),
	})
	.describe("Successful resume parsing and candidate scoring response");

const parseResumeRoute = createRoute({
	method: "post",
	path: "/{id}/parse-resume",
	tags: ["Candidates"],
	summary: "Parse resume and calculate skill match score",
	description: `Parse a candidate's resume using AI and calculate their skill match score against a job posting.
    
    This endpoint:
    - Extracts structured data from resume text using OpenAI GPT-4
    - Identifies skills, experience, education, projects, and certifications
    - Finds hidden links like GitHub profiles in resume text
    - Compares candidate skills against job requirements
    - Calculates weighted scores for overall fit
    - Generates hiring recommendations
    - Tracks performance metrics and business events`,
	request: {
		params: z.object({
			id: z.string().describe("Candidate ID"),
		}),
		body: {
			content: {
				"application/json": {
					schema: ParseResumeRequestSchema,
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
			description: "Resume parsed successfully with skill matching results",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid request data",
		},
		503: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "AI service temporarily unavailable",
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
});

candidatesRoutes.openapi(parseResumeRoute, async (c) => {
	const candidateId = c.req.param("id");
	const body = c.req.valid("json");
	const correlationId = c.get("correlationId") || crypto.randomUUID();
	const requestId = c.get("requestId") || crypto.randomUUID();

	const logger = new Logger({ correlationId, requestId });

	try {
		const getTimer = logger.startTimer();

		logger.info("Starting resume parse request", {
			candidateId,
			jobId: body.jobId,
			fileName: body.fileName,
			fileSizeBytes: body.fileContent.length,
		});

		const aiService = new AIService(logger);
		const jobRequirementsService = new JobRequirementsService(logger);
		const skillMatcher = new SkillMatcherService(logger);
		const candidateScoringService = new CandidateScoringService(logger);

		const parsedData = await aiService.parseResume(
			body.fileContent,
			body.fileName,
			[],
		);

		const parseTime = getTimer();

		logger.info("AI parsing completed successfully", {
			candidateId,
			fileName: body.fileName,
			skillsExtracted: parsedData.skills?.length || 0,
			experienceEntries: parsedData.experience?.length || 0,
			educationEntries: parsedData.education?.length || 0,
			projectsFound: parsedData.projects?.length || 0,
			certificationsFound: parsedData.certifications?.length || 0,
			processingTimeMs: parseTime,
			parsedDataStructure: {
				hasSkills: !!parsedData.skills,
				hasExperience: !!parsedData.experience,
				hasEducation: !!parsedData.education,
				keys: Object.keys(parsedData || {}),
			},
		});

		const jobRequirements = await jobRequirementsService.getJobRequirements(
			body.jobId,
		);

		logger.info("Job requirements retrieved", {
			jobId: body.jobId,
			jobTitle: jobRequirements.title,
			requiredSkillsCount: jobRequirements.required_skills.length,
			niceToHaveSkillsCount: jobRequirements.nice_to_have_skills.length,
		});

		const baseScore = skillMatcher.calculateCandidateScore(
			parsedData,
			jobRequirements,
		);

		const recommendations = skillMatcher.generateRecommendations(
			parsedData,
			baseScore,
			jobRequirements,
		);

		const score = { ...baseScore, candidateId, recommendations };

		const shouldAutoReject = skillMatcher.shouldAutoReject(
			score,
			jobRequirements,
		);

		if (shouldAutoReject) {
			logger.info("Candidate auto-rejected", {
				candidateId,
				jobId: body.jobId,
				overallScore: score.overallScore,
				requiredSkillsScore: score.requiredSkillsScore,
				missingRequiredSkills: score.missingRequiredSkills,
			});
		}

		const totalTime = getTimer();

		let scoreId: string | null = null;

		try {
			scoreId = await candidateScoringService.saveScore(score, {
				processingTimeMs: totalTime,
				correlationId,
				aiModelVersion: "gpt-4o",
				autoRejected: shouldAutoReject,
				autoRejectionReason: shouldAutoReject
					? `Overall score ${score.overallScore} below threshold or missing critical skills`
					: undefined,
			});

			logger.info("Candidate score persisted to database", {
				scoreId,
				candidateId,
				jobId: body.jobId,
				overallScore: score.overallScore,
			});
		} catch (dbError) {
			logger.warn(
				"Failed to persist score to database (continuing with response)",
				{
					error: dbError,
					candidateId,
					jobId: body.jobId,
					reason: "Possibly test data or missing candidate profile",
				},
			);
			scoreId = "test-score-id";
		}

		logger.info("Resume parsing workflow completed", {
			candidateId,
			jobId: body.jobId,
			totalProcessingTimeMs: totalTime,
			overallScore: score.overallScore,
			shouldAutoReject,
			success: true,
		});

		return c.json(
			{
				success: true as const,
				data: {
					parsedData,
					score,
					shouldAutoReject,
				},
				metadata: {
					processingTimeMs: totalTime,
					correlationId,
					timestamp: new Date().toISOString(),
				},
			},
			200,
		);
	} catch (error) {
		logger.error("Resume parsing failed", error, {
			candidateId,
			fileName: body.fileName,
			errorType: error instanceof Error ? error.constructor.name : "Unknown",
		});

		return c.json(
			{
				success: false as const,
				error: {
					code: "INTERNAL_ERROR",
					message: "An internal error occurred during resume parsing",
					details: error instanceof Error ? error.message : String(error),
				},
				timestamp: new Date().toISOString(),
				correlationId,
			},
			500,
		);
	}
});

export { candidatesRoutes };
