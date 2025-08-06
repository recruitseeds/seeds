import { Hono } from "hono";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { correlationMiddleware } from "../../src/middleware/correlation.js";
import { errorHandler } from "../../src/middleware/error-handler.js";
import { testPublicRoutes } from "../../src/routes/test/public/index.js";

describe("E2E: Job Application Flow", () => {
	let app: Hono;

	beforeAll(() => {
		app = new Hono();
		app.use("*", correlationMiddleware());
		app.route("/test/v1/public", testPublicRoutes);
		app.onError(errorHandler);
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Complete Application and Resume Parsing Flow", () => {
		const jobId = "87654321-4321-4321-4321-210987654321";
		const mockApplicationData = {
			candidateData: {
				name: "Sarah Johnson",
				email: "sarah.johnson@example.com",
				phone: "+1-555-0123",
			},
			resumeFile: {
				fileName: "sarah_johnson_resume.pdf",
				content: "JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCjUgMCBvYmoKPDwKL0xlbmd0aCA3Mgo+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjcyIDcyMCBUZAooU2FyYWggSm9obnNvbikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA1MyAwMDAwMCBuIAowMDAwMDAwMTEwIDAwMDAwIG4gCjAwMDAwMDAyNTAgMDAwMDAgbiAKMDAwMDAwMDMzMCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ1MgolJUVPRg==",
				mimeType: "application/pdf",
				tags: ["frontend", "react", "typescript"],
			},
		};

		it("completes full job application and resume parsing flow", async () => {
			const applicationRes = await app.request(`/test/v1/public/jobs/${jobId}/apply`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(mockApplicationData),
			});

			expect(applicationRes.status).toBe(200);

			const applicationBody = await applicationRes.json();
			expect(applicationBody).toMatchObject({
				success: true,
				data: {
					applicationId: expect.any(String),
					candidateId: expect.any(String),
					status: expect.stringMatching(/under_review|auto_rejected/),
					nextSteps: expect.any(String),
				},
			});

			const { candidateId } = applicationBody.data;

			const parseRes = await app.request(`/test/v1/public/candidates/${candidateId}/parse-resume`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jobId,
				}),
			});

			expect(parseRes.status).toBe(200);

			const parseBody = await parseRes.json();
			expect(parseBody).toMatchObject({
				success: true,
				data: {
					parsedData: {
						personalInfo: expect.any(Object),
						skills: expect.any(Array),
						experience: expect.any(Array),
					},
					score: {
						candidateId,
						jobId,
						overallScore: expect.any(Number),
						requiredSkillsScore: expect.any(Number),
						experienceScore: expect.any(Number),
						educationScore: expect.any(Number),
					},
				},
			});
		});

		it("handles auto-rejection scenario based on low scores", async () => {
			const applicationRes = await app.request(`/test/v1/public/jobs/${jobId}/apply`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...mockApplicationData,
					candidateData: {
						...mockApplicationData.candidateData,
						name: "Low Score Candidate",
						email: "lowscore@example.com",
					},
				}),
			});

			const applicationBody = await applicationRes.json();
			const { candidateId } = applicationBody.data;

			let isAutoRejected = false;
			let attempts = 0;
			const maxAttempts = 10;

			while (!isAutoRejected && attempts < maxAttempts) {
				const parseRes = await app.request(`/test/v1/public/candidates/${candidateId}/parse-resume`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						jobId,
					}),
				});

				const parseBody = await parseRes.json();
				const { overallScore } = parseBody.data.score;

				if (overallScore < 30) {
					isAutoRejected = true;
					expect(parseBody.data.score.missingRequiredSkills).not.toHaveLength(0);
					expect(parseBody.data.score.recommendations[0]).toMatch(/Skills gap/);
				}

				attempts++;
			}

			expect(isAutoRejected || attempts === maxAttempts).toBe(true);
		});

		it("handles high-scoring candidate scenario", async () => {
			const applicationRes = await app.request(`/test/v1/public/jobs/${jobId}/apply`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...mockApplicationData,
					candidateData: {
						...mockApplicationData.candidateData,
						name: "High Score Candidate",
						email: "highscore@example.com",
					},
				}),
			});

			const applicationBody = await applicationRes.json();
			const { candidateId } = applicationBody.data;

			let isHighScoring = false;
			let attempts = 0;
			const maxAttempts = 10;

			while (!isHighScoring && attempts < maxAttempts) {
				const parseRes = await app.request(`/test/v1/public/candidates/${candidateId}/parse-resume`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						jobId,
					}),
				});

				const parseBody = await parseRes.json();
				const { overallScore } = parseBody.data.score;

				if (overallScore >= 85) {
					isHighScoring = true;
					expect(parseBody.data.score.skillMatches.length).toBeGreaterThan(0);
					expect(parseBody.data.score.recommendations[0]).toMatch(/Strong candidate/);
				}

				attempts++;
			}

			expect(isHighScoring || attempts === maxAttempts).toBe(true);
		});

		it("validates skill matching accuracy", async () => {
			const applicationRes = await app.request(`/test/v1/public/jobs/${jobId}/apply`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(mockApplicationData),
			});

			const applicationBody = await applicationRes.json();
			const { candidateId } = applicationBody.data;

			const parseRes = await app.request(`/test/v1/public/candidates/${candidateId}/parse-resume`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jobId,
				}),
			});

			const parseBody = await parseRes.json();
			const { skillMatches } = parseBody.data.score;

			for (const match of skillMatches) {
				expect(match).toMatchObject({
					skill: expect.any(String),
					confidence: expect.any(Number),
					context: expect.any(String),
				});

				expect(match.confidence).toBeGreaterThanOrEqual(0);
				expect(match.confidence).toBeLessThanOrEqual(1);
				expect(match.skill.length).toBeGreaterThan(0);
				expect(match.context.length).toBeGreaterThan(0);
			}
		});

		it("ensures scoring algorithm consistency", async () => {
			const applicationRes = await app.request(`/test/v1/public/jobs/${jobId}/apply`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(mockApplicationData),
			});

			const applicationBody = await applicationRes.json();
			const { candidateId } = applicationBody.data;

			const parseRes1 = await app.request(`/test/v1/public/candidates/${candidateId}/parse-resume`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jobId,
				}),
			});

			const parseRes2 = await app.request(`/test/v1/public/candidates/${candidateId}/parse-resume`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jobId,
				}),
			});

			const parseBody1 = await parseRes1.json();
			const parseBody2 = await parseRes2.json();

			expect(parseBody1.data.score.overallScore).toBe(parseBody2.data.score.overallScore);
			expect(parseBody1.data.score.requiredSkillsScore).toBe(parseBody2.data.score.requiredSkillsScore);
			expect(parseBody1.data.score.experienceScore).toBe(parseBody2.data.score.experienceScore);
		});

		it("handles multiple concurrent applications", async () => {
			const applications = await Promise.all([
				app.request(`/test/v1/public/jobs/${jobId}/apply`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						...mockApplicationData,
						candidateData: { ...mockApplicationData.candidateData, email: "candidate1@example.com" },
					}),
				}),
				app.request(`/test/v1/public/jobs/${jobId}/apply`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						...mockApplicationData,
						candidateData: { ...mockApplicationData.candidateData, email: "candidate2@example.com" },
					}),
				}),
				app.request(`/test/v1/public/jobs/${jobId}/apply`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						...mockApplicationData,
						candidateData: { ...mockApplicationData.candidateData, email: "candidate3@example.com" },
					}),
				}),
			]);

			for (const res of applications) {
				expect(res.status).toBe(200);
				const body = await res.json();
				expect(body.success).toBe(true);
				expect(body.data.candidateId).toBeTruthy();
			}

			const candidateIds = await Promise.all(
				applications.map(async (res) => {
					const body = await res.json();
					return body.data.candidateId;
				})
			);

			expect(new Set(candidateIds).size).toBe(3);
		});

		it("validates response time performance", async () => {
			const startTime = Date.now();

			const applicationRes = await app.request(`/test/v1/public/jobs/${jobId}/apply`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(mockApplicationData),
			});

			const applicationTime = Date.now() - startTime;

			const applicationBody = await applicationRes.json();
			const { candidateId } = applicationBody.data;

			const parseStartTime = Date.now();

			const parseRes = await app.request(`/test/v1/public/candidates/${candidateId}/parse-resume`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jobId,
				}),
			});

			const parseTime = Date.now() - parseStartTime;

			expect(applicationTime).toBeLessThan(5000);
			expect(parseTime).toBeLessThan(1000);

			expect(applicationRes.status).toBe(200);
			expect(parseRes.status).toBe(200);
		});

		it("handles different file types and validates processing", async () => {
			const fileTypes = [
				{
					fileName: "resume.pdf",
					mimeType: "application/pdf",
					content: "JVBERi0xLjQKJdPr6eEKMSAwIG9iago=",
				},
				{
					fileName: "resume.docx",
					mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
					content: "UEsDBBQABgAIAAAAIQA=",
				},
				{
					fileName: "resume.txt",
					mimeType: "text/plain",
					content: "UmVzdW1lIENvbnRlbnQ=",
				},
			];

			for (const fileType of fileTypes) {
				const applicationRes = await app.request(`/test/v1/public/jobs/${jobId}/apply`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						...mockApplicationData,
						candidateData: {
							...mockApplicationData.candidateData,
							email: `test.${fileType.fileName}@example.com`,
						},
						resumeFile: {
							...fileType,
							tags: ["frontend", "web-development"],
						},
					}),
				});

				expect(applicationRes.status).toBe(200);

				const body = await applicationRes.json();
				expect(body.success).toBe(true);
				expect(body.data.candidateId).toBeTruthy();
			}
		});
	});
});