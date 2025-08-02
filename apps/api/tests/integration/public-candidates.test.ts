import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { correlationMiddleware } from "../../src/middleware/correlation.js";
import { errorHandler } from "../../src/middleware/error-handler.js";
import { publicRoutes } from "../../src/routes/v1/public/index.js";
import { TestDataFactory } from "../fixtures/test-data-factory.js";

vi.mock("../../src/services/ai.js", () => ({
	AIService: vi.fn().mockImplementation(() => ({
		parseResume: vi.fn().mockResolvedValue({
			personalInfo: {
				name: "John Doe",
				email: "john@example.com",
				phone: "(555) 123-4567",
				location: "San Francisco, CA",
			},
			skills: ["JavaScript", "React", "Node.js", "TypeScript"],
			experience: [
				{
					company: "TechCorp",
					position: "Senior Engineer",
					startDate: "2021-01",
					endDate: null,
					description: "Built React applications",
				},
			],
			education: [
				{
					institution: "UC Berkeley",
					degree: "BS Computer Science",
					field: "Computer Science",
					graduationDate: "2019-05",
				},
			],
			projects: [
				{
					name: "Test Project",
					description: "A test project",
					technologies: ["React", "Node.js"],
				},
			],
			certifications: [
				{
					name: "AWS Certified",
					issuer: "Amazon",
					issueDate: "2023-01",
				},
			],
			languages: ["English"],
		}),
	})),
}));

vi.mock("../../src/services/candidate-scoring.js", () => ({
	CandidateScoringService: vi.fn().mockImplementation(() => ({
		saveScore: vi.fn().mockResolvedValue("test-score-id"),
	})),
}));

vi.mock("../../src/services/job-requirements.js", () => ({
	JobRequirementsService: vi.fn().mockImplementation(() => ({
		getJobRequirements: vi.fn().mockResolvedValue({
			id: "job-456",
			title: "Software Engineer",
			required_skills: ["JavaScript", "React", "Node.js"],
			nice_to_have_skills: ["TypeScript", "AWS"],
			min_experience_years: 3,
			education_requirements: ["Bachelor degree"],
			experience_requirements: ["Full-stack experience"],
		}),
	})),
}));

vi.mock("../../src/services/skill-matcher.js", () => ({
	SkillMatcherService: vi.fn().mockImplementation(() => ({
		calculateCandidateScore: vi.fn().mockReturnValue({
			jobId: "job-456",
			overallScore: 85,
			requiredSkillsScore: 90,
			experienceScore: 80,
			educationScore: 85,
			skillMatches: [
				{
					skill: "JavaScript",
					found: true,
					confidence: 1.0,
					context: "Found exact match",
				},
				{
					skill: "React",
					found: true,
					confidence: 1.0,
					context: "Found exact match",
				},
				{
					skill: "Node.js",
					found: true,
					confidence: 1.0,
					context: "Found exact match",
				},
			],
			missingRequiredSkills: [],
		}),
		generateRecommendations: vi
			.fn()
			.mockReturnValue([
				"🌟 Excellent candidate - highly recommended",
				"💼 Strong technical skills match",
			]),
		shouldAutoReject: vi.fn().mockReturnValue(false),
	})),
}));

const MOCK_UNKEY_RESPONSE = {
	valid: true,
	ownerId: "company-123",
	meta: {
		tier: "pro",
		companyId: "company-123",
		permissions: ["candidates:read", "candidates:write"],
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

describe("Public Candidates API", () => {
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

	describe("POST /public/candidates/:id/parse-resume", () => {
		it("should successfully parse resume with valid authentication", async () => {
			const requestData = {
				candidateId: "candidate-123",
				jobId: "job-456",
				fileContent: TestDataFactory.createResumeContent("strong"),
				fileName: "test-resume.txt",
			};

			const response = await app.request(
				"/public/candidates/candidate-123/parse-resume",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer uk_test_key_123",
					},
					body: JSON.stringify(requestData),
				},
			);

			expect(response.status).toBe(200);
			const body = await response.json();

			expect(body.success).toBe(true);
			expect(body.data.parsedData).toBeDefined();
			expect(body.data.score).toBeDefined();
			expect(body.data.score.overallScore).toBe(85);
			expect(body.metadata.processingTimeMs).toBeGreaterThan(0);
			expect(body.metadata.correlationId).toBeDefined();
		});

		it("should reject requests without authentication", async () => {
			const requestData = {
				candidateId: "candidate-123",
				jobId: "job-456",
				fileContent: "Test resume content",
				fileName: "test-resume.txt",
			};

			const response = await app.request(
				"/public/candidates/candidate-123/parse-resume",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestData),
				},
			);

			expect(response.status).toBe(401);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("MISSING_API_KEY");
			expect(body.error.documentation).toBeDefined();
		});

		it("should validate request payload", async () => {
			const invalidRequestData = {
				candidateId: "invalid-uuid",
				jobId: "job-456",
				fileContent: "",
				fileName: "",
			};

			const response = await app.request(
				"/public/candidates/candidate-123/parse-resume",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer uk_test_key_123",
					},
					body: JSON.stringify(invalidRequestData),
				},
			);

			expect(response.status).toBe(400);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("VALIDATION_ERROR");
			expect(body.error.details).toBeDefined();
			expect(Array.isArray(body.error.details)).toBe(true);
		});

		it("should validate candidate ID consistency", async () => {
			const requestData = {
				candidateId: "different-candidate",
				jobId: "job-456",
				fileContent: "Test resume content",
				fileName: "test-resume.txt",
			};

			const response = await app.request(
				"/public/candidates/candidate-123/parse-resume",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer uk_test_key_123",
					},
					body: JSON.stringify(requestData),
				},
			);

			expect(response.status).toBe(400);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("BUSINESS_VALIDATION_ERROR");
		});

		it("should handle invalid API keys", async () => {
			vi.mocked(global.fetch).mockImplementationOnce(() =>
				Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ valid: false, code: "INVALID_KEY" }),
				} as any),
			);

			const requestData = {
				candidateId: "candidate-123",
				jobId: "job-456",
				fileContent: "Test resume content",
				fileName: "test-resume.txt",
			};

			const response = await app.request(
				"/public/candidates/candidate-123/parse-resume",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer invalid_key",
					},
					body: JSON.stringify(requestData),
				},
			);

			expect(response.status).toBe(401);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("INVALID_KEY");
		});

		it("should include proper headers and metadata", async () => {
			const requestData = {
				candidateId: "candidate-123",
				jobId: "job-456",
				fileContent: "Test resume content with proper length",
				fileName: "test-resume.txt",
			};

			const response = await app.request(
				"/public/candidates/candidate-123/parse-resume",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer uk_test_key_123",
					},
					body: JSON.stringify(requestData),
				},
			);

			expect(response.status).toBe(200);
			expect(response.headers.get("x-correlation-id")).toBeDefined();

			const body = await response.json();
			expect(body.metadata.correlationId).toBeDefined();
			expect(body.metadata.timestamp).toBeDefined();
			expect(body.metadata.processingTimeMs).toBeGreaterThan(0);
		});

		it("should handle AI service errors gracefully", async () => {
			vi.mocked(
				require("../../src/services/ai.js").AIService,
			).mockImplementationOnce(() => ({
				parseResume: vi.fn().mockRejectedValue(new Error("OpenAI API error")),
			}));

			const requestData = {
				candidateId: "candidate-123",
				jobId: "job-456",
				fileContent: "Test resume content",
				fileName: "test-resume.txt",
			};

			const response = await app.request(
				"/public/candidates/candidate-123/parse-resume",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer uk_test_key_123",
					},
					body: JSON.stringify(requestData),
				},
			);

			expect(response.status).toBe(503);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("AI_SERVICE_UNAVAILABLE");
			expect(body.error.retryAfter).toBeDefined();
		});
	});

	describe("GET /public/candidates/:id/score", () => {
		beforeEach(() => {
			vi.mocked(
				require("../../src/services/candidate-scoring.js")
					.CandidateScoringService,
			).mockReset();
			vi.mocked(
				require("../../src/services/candidate-scoring.js")
					.CandidateScoringService,
			).mockImplementation(() => ({
				saveScore: vi.fn().mockResolvedValue("test-score-id"),
				getScore: vi.fn().mockResolvedValue({
					candidateId: "candidate-123",
					jobId: "job-456",
					overallScore: 85,
					requiredSkillsScore: 90,
					experienceScore: 80,
					educationScore: 85,
					skillMatches: [
						{
							skill: "JavaScript",
							found: true,
							confidence: 1.0,
							context: "Found exact match",
						},
						{
							skill: "React",
							found: true,
							confidence: 1.0,
							context: "Found exact match",
						},
						{
							skill: "Node.js",
							found: true,
							confidence: 1.0,
							context: "Found exact match",
						},
					],
					missingRequiredSkills: [],
					recommendations: [
						"🌟 Excellent candidate - highly recommended",
						"💼 Strong technical skills match",
					],
					id: "score-789",
					createdAt: "2024-01-01T12:00:00.000Z",
				}),
			}));
		});

		it("should successfully retrieve score with valid authentication", async () => {
			const response = await app.request(
				"/public/candidates/candidate-123/score?jobId=job-456",
				{
					method: "GET",
					headers: {
						Authorization: "Bearer uk_test_key_123",
					},
				},
			);

			expect(response.status).toBe(200);
			const body = await response.json();

			expect(body.success).toBe(true);
			expect(body.data.candidateId).toBe("candidate-123");
			expect(body.data.jobId).toBe("job-456");
			expect(body.data.overallScore).toBe(85);
			expect(body.data.evaluatedAt).toBe("2024-01-01T12:00:00.000Z");
			expect(body.data.scoreId).toBe("score-789");
			expect(body.data.scoreBreakdown).toBeUndefined();
			expect(body.data.recommendations).toBeUndefined();
			expect(body.metadata.correlationId).toBeDefined();
			expect(body.metadata.cached).toBe(false);
		});

		it("should include detailed breakdown when includeDetails=true", async () => {
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
								permissions: [
									"candidates:read",
									"candidates:write",
									"scores:read:detailed",
								],
							},
						}),
				} as any),
			);

			const response = await app.request(
				"/public/candidates/candidate-123/score?jobId=job-456&includeDetails=true",
				{
					method: "GET",
					headers: {
						Authorization: "Bearer uk_test_key_123",
					},
				},
			);

			expect(response.status).toBe(200);
			const body = await response.json();

			expect(body.success).toBe(true);
			expect(body.data.scoreBreakdown).toBeDefined();
			expect(body.data.scoreBreakdown.requiredSkillsScore).toBe(90);
			expect(body.data.scoreBreakdown.experienceScore).toBe(80);
			expect(body.data.scoreBreakdown.educationScore).toBe(85);
			expect(body.data.recommendations).toBeDefined();
			expect(body.data.recommendations).toHaveLength(2);
		});

		it("should reject detailed access without proper permissions", async () => {
			const response = await app.request(
				"/public/candidates/candidate-123/score?jobId=job-456&includeDetails=true",
				{
					method: "GET",
					headers: {
						Authorization: "Bearer uk_test_key_123",
					},
				},
			);

			expect(response.status).toBe(400);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("BUSINESS_VALIDATION_ERROR");
			expect(body.error.message).toContain("scores:read:detailed permission");
		});

		it("should return 404 when score not found", async () => {
			vi.mocked(
				require("../../src/services/candidate-scoring.js")
					.CandidateScoringService,
			).mockImplementationOnce(() => ({
				getScore: vi.fn().mockResolvedValue(null),
			}));

			const response = await app.request(
				"/public/candidates/candidate-123/score?jobId=job-456",
				{
					method: "GET",
					headers: {
						Authorization: "Bearer uk_test_key_123",
					},
				},
			);

			expect(response.status).toBe(404);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("SCORE_NOT_FOUND");
			expect(body.error.message).toContain("No score found");
		});

		it("should validate required query parameters", async () => {
			const response = await app.request(
				"/public/candidates/candidate-123/score",
				{
					method: "GET",
					headers: {
						Authorization: "Bearer uk_test_key_123",
					},
				},
			);

			expect(response.status).toBe(400);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("VALIDATION_ERROR");
			expect(body.error.details).toBeDefined();
		});

		it("should validate UUID format for candidate ID", async () => {
			const response = await app.request(
				"/public/candidates/invalid-id/score?jobId=job-456",
				{
					method: "GET",
					headers: {
						Authorization: "Bearer uk_test_key_123",
					},
				},
			);

			expect(response.status).toBe(400);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("VALIDATION_ERROR");
		});

		it("should validate UUID format for job ID", async () => {
			const response = await app.request(
				"/public/candidates/candidate-123/score?jobId=invalid-job-id",
				{
					method: "GET",
					headers: {
						Authorization: "Bearer uk_test_key_123",
					},
				},
			);

			expect(response.status).toBe(400);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("VALIDATION_ERROR");
		});

		it("should reject requests without authentication", async () => {
			const response = await app.request(
				"/public/candidates/candidate-123/score?jobId=job-456",
				{
					method: "GET",
				},
			);

			expect(response.status).toBe(401);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("MISSING_API_KEY");
		});

		it("should handle database errors gracefully", async () => {
			vi.mocked(
				require("../../src/services/candidate-scoring.js")
					.CandidateScoringService,
			).mockImplementationOnce(() => ({
				getScore: vi
					.fn()
					.mockRejectedValue(new Error("Database connection failed")),
			}));

			const response = await app.request(
				"/public/candidates/candidate-123/score?jobId=job-456",
				{
					method: "GET",
					headers: {
						Authorization: "Bearer uk_test_key_123",
					},
				},
			);

			expect(response.status).toBe(500);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("INTERNAL_ERROR");
			expect(body.error.message).toContain(
				"Failed to retrieve candidate score",
			);
		});

		it("should only accept true/false values for includeDetails", async () => {
			const response = await app.request(
				"/public/candidates/candidate-123/score?jobId=job-456&includeDetails=maybe",
				{
					method: "GET",
					headers: {
						Authorization: "Bearer uk_test_key_123",
					},
				},
			);

			expect(response.status).toBe(400);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("VALIDATION_ERROR");
		});

		it("should include correlation ID in all responses", async () => {
			const response = await app.request(
				"/public/candidates/candidate-123/score?jobId=job-456",
				{
					method: "GET",
					headers: {
						Authorization: "Bearer uk_test_key_123",
					},
				},
			);

			expect(response.headers.get("x-correlation-id")).toBeDefined();
			const body = await response.json();
			expect(body.metadata?.correlationId || body.correlationId).toBeDefined();
		});
	});
});
