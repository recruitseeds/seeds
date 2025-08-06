import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { correlationMiddleware } from "../../src/middleware/correlation.js";
import { errorHandler } from "../../src/middleware/error-handler.js";
import { testPublicRoutes } from "../../src/routes/test/public/index.js";

describe("Test Candidates API", () => {
	let app: Hono;

	beforeEach(() => {
		app = new Hono();
		app.use("*", correlationMiddleware());
		app.route("/test/v1/public", testPublicRoutes);
		app.onError(errorHandler);
	});

	describe("POST /test/v1/public/candidates/{candidateId}/parse-resume", () => {
		const validCandidateId = "12345678-1234-1234-1234-123456789012";
		const validJobId = "87654321-4321-4321-4321-210987654321";

		it("should parse resume and return scoring results", async () => {
			const res = await app.request(`/test/v1/public/candidates/${validCandidateId}/parse-resume`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jobId: validJobId,
				}),
			});

			expect(res.status).toBe(200);

			const body = await res.json();
			expect(body).toEqual({
				success: true,
				data: {
					parsedData: {
						personalInfo: {
							name: "Test Candidate",
							email: "test@example.com",
						},
						skills: ["JavaScript", "React"],
						experience: [],
						education: [],
						projects: [],
						certifications: [],
						languages: ["English"],
					},
					score: {
						candidateId: validCandidateId,
						jobId: validJobId,
						overallScore: 75,
						requiredSkillsScore: 75,
						experienceScore: 70,
						educationScore: 80,
						skillMatches: [
							{
								skill: "JavaScript",
								confidence: 0.9,
								context: "Test context",
							},
						],
						missingRequiredSkills: [],
						recommendations: ["Test recommendation"],
					},
				},
				metadata: {
					processingTimeMs: 100,
					correlationId: "test-123",
					timestamp: expect.any(String),
				},
			});
		});

		it("should return 400 for invalid candidate UUID", async () => {
			const res = await app.request("/test/v1/public/candidates/invalid-uuid/parse-resume", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jobId: validJobId,
				}),
			});

			expect(res.status).toBe(400);

			const body = await res.json();
			expect(body).toMatchObject({
				success: false,
				error: {
					issues: expect.arrayContaining([
						expect.objectContaining({
							validation: "uuid",
							code: "invalid_string",
							message: "Invalid uuid",
							path: ["candidateId"],
						}),
					]),
				},
			});
		});

		it("should handle requests with valid data", async () => {
			const res = await app.request(`/test/v1/public/candidates/${validCandidateId}/parse-resume`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jobId: validJobId,
				}),
			});

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.success).toBe(true);
			expect(body.data.score.candidateId).toBe(validCandidateId);
			expect(body.data.score.jobId).toBe(validJobId);
		});

		it("should return consistent response structure", async () => {
			const res = await app.request(`/test/v1/public/candidates/${validCandidateId}/parse-resume`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jobId: validJobId,
				}),
			});

			const body = await res.json();

			expect(body).toHaveProperty("success");
			expect(body).toHaveProperty("data");
			expect(body).toHaveProperty("metadata");

			expect(body.data).toHaveProperty("parsedData");
			expect(body.data).toHaveProperty("score");

			expect(body.data.parsedData).toHaveProperty("personalInfo");
			expect(body.data.parsedData).toHaveProperty("skills");
			expect(body.data.parsedData).toHaveProperty("experience");
			expect(body.data.parsedData).toHaveProperty("education");
			expect(body.data.parsedData).toHaveProperty("projects");
			expect(body.data.parsedData).toHaveProperty("certifications");
			expect(body.data.parsedData).toHaveProperty("languages");

			expect(body.data.score).toHaveProperty("candidateId");
			expect(body.data.score).toHaveProperty("jobId");
			expect(body.data.score).toHaveProperty("overallScore");
			expect(body.data.score).toHaveProperty("requiredSkillsScore");
			expect(body.data.score).toHaveProperty("experienceScore");
			expect(body.data.score).toHaveProperty("educationScore");
			expect(body.data.score).toHaveProperty("skillMatches");
			expect(body.data.score).toHaveProperty("missingRequiredSkills");
			expect(body.data.score).toHaveProperty("recommendations");

			expect(body.metadata).toHaveProperty("processingTimeMs");
			expect(body.metadata).toHaveProperty("correlationId");
			expect(body.metadata).toHaveProperty("timestamp");
		});

		it("should return scores within valid ranges", async () => {
			const res = await app.request(`/test/v1/public/candidates/${validCandidateId}/parse-resume`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jobId: validJobId,
				}),
			});

			const body = await res.json();
			const { score } = body.data;

			expect(score.overallScore).toBeGreaterThanOrEqual(0);
			expect(score.overallScore).toBeLessThanOrEqual(100);

			expect(score.requiredSkillsScore).toBeGreaterThanOrEqual(0);
			expect(score.requiredSkillsScore).toBeLessThanOrEqual(100);

			expect(score.experienceScore).toBeGreaterThanOrEqual(0);
			expect(score.experienceScore).toBeLessThanOrEqual(100);

			expect(score.educationScore).toBeGreaterThanOrEqual(0);
			expect(score.educationScore).toBeLessThanOrEqual(100);
		});

		it("should include skill matches with proper structure", async () => {
			const res = await app.request(`/test/v1/public/candidates/${validCandidateId}/parse-resume`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jobId: validJobId,
				}),
			});

			const body = await res.json();
			const { skillMatches } = body.data.score;

			expect(Array.isArray(skillMatches)).toBe(true);

			if (skillMatches.length > 0) {
				const skillMatch = skillMatches[0];
				expect(skillMatch).toHaveProperty("skill");
				expect(skillMatch).toHaveProperty("confidence");
				expect(skillMatch).toHaveProperty("context");

				expect(typeof skillMatch.skill).toBe("string");
				expect(typeof skillMatch.confidence).toBe("number");
				expect(typeof skillMatch.context).toBe("string");

				expect(skillMatch.confidence).toBeGreaterThanOrEqual(0);
				expect(skillMatch.confidence).toBeLessThanOrEqual(1);
			}
		});

		it("should include proper arrays for missing skills and recommendations", async () => {
			const res = await app.request(`/test/v1/public/candidates/${validCandidateId}/parse-resume`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jobId: validJobId,
				}),
			});

			const body = await res.json();
			const { missingRequiredSkills, recommendations } = body.data.score;

			expect(Array.isArray(missingRequiredSkills)).toBe(true);
			expect(Array.isArray(recommendations)).toBe(true);

			if (recommendations.length > 0) {
				expect(typeof recommendations[0]).toBe("string");
			}

			if (missingRequiredSkills.length > 0) {
				expect(typeof missingRequiredSkills[0]).toBe("string");
			}
		});

		it("should return valid timestamp format", async () => {
			const res = await app.request(`/test/v1/public/candidates/${validCandidateId}/parse-resume`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jobId: validJobId,
				}),
			});

			const body = await res.json();
			const { timestamp } = body.metadata;

			expect(() => new Date(timestamp)).not.toThrow();

			const date = new Date(timestamp);
			expect(date.getTime()).not.toBeNaN();
		});
	});
});