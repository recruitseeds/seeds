import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CandidateScoringService } from "../src/services/candidate-scoring.js";
import { Logger } from "../src/services/logger.js";

describe("CandidateScoringService", () => {
	let candidateScoringService: CandidateScoringService;
	let logger: Logger;

	beforeAll(() => {
		logger = new Logger({ correlationId: "test" });
		candidateScoringService = new CandidateScoringService(logger);
	});

	const testScore = {
		candidateId: "test-candidate-123",
		jobId: "test-job-456",
		overallScore: 85,
		requiredSkillsScore: 90,
		experienceScore: 80,
		educationScore: 85,
		skillMatches: [
			{
				skill: "React",
				found: true,
				confidence: 0.95,
				context: "Found in experience description",
			},
			{
				skill: "TypeScript",
				found: true,
				confidence: 0.88,
				context: "Mentioned in skills section",
			},
		],
		missingRequiredSkills: ["Kubernetes", "Docker"],
		recommendations: [
			"🌟 Strong candidate with excellent React skills",
			"💡 Consider for senior position",
		],
	};

	const testMetadata = {
		processingTimeMs: 2500,
		correlationId: "test-correlation-123",
		aiModelVersion: "gpt-4o",
		autoRejected: false,
	};

	it("should save and retrieve candidate score", async () => {
		const scoreId = await candidateScoringService.saveScore(
			testScore,
			testMetadata,
		);
		expect(scoreId).toBeDefined();
		expect(typeof scoreId).toBe("string");

		const retrievedScore = await candidateScoringService.getScore(
			testScore.candidateId,
			testScore.jobId,
		);

		expect(retrievedScore).toBeDefined();
		expect(retrievedScore?.candidateId).toBe(testScore.candidateId);
		expect(retrievedScore?.jobId).toBe(testScore.jobId);
		expect(retrievedScore?.overallScore).toBe(testScore.overallScore);
		expect(retrievedScore?.skillMatches).toHaveLength(2);
		expect(retrievedScore?.recommendations).toHaveLength(2);
	});

	it("should handle auto-rejected candidates", async () => {
		const autoRejectedScore = {
			...testScore,
			candidateId: "auto-rejected-candidate",
			overallScore: 25,
			requiredSkillsScore: 20,
		};

		const autoRejectedMetadata = {
			...testMetadata,
			autoRejected: true,
			autoRejectionReason: "Score below minimum threshold",
		};

		const scoreId = await candidateScoringService.saveScore(
			autoRejectedScore,
			autoRejectedMetadata,
		);
		expect(scoreId).toBeDefined();

		const retrievedScore = await candidateScoringService.getScore(
			autoRejectedScore.candidateId,
			autoRejectedScore.jobId,
		);

		expect(retrievedScore?.overallScore).toBe(25);
	});

	it("should get candidate scores for a specific candidate", async () => {
		const candidateId = "multi-score-candidate";
		const scores = [
			{ ...testScore, candidateId, jobId: "job-1", overallScore: 85 },
			{ ...testScore, candidateId, jobId: "job-2", overallScore: 78 },
			{ ...testScore, candidateId, jobId: "job-3", overallScore: 92 },
		];

		for (const score of scores) {
			await candidateScoringService.saveScore(score, testMetadata);
		}

		const candidateScores =
			await candidateScoringService.getCandidateScores(candidateId);

		expect(candidateScores).toHaveLength(3);
		expect(candidateScores.map((s) => s.overallScore).sort()).toEqual([
			78, 85, 92,
		]);
	});

	it("should get job scores with filtering", async () => {
		const jobId = "popular-job-123";
		const candidates = [
			{ ...testScore, candidateId: "candidate-1", jobId, overallScore: 95 },
			{ ...testScore, candidateId: "candidate-2", jobId, overallScore: 82 },
			{ ...testScore, candidateId: "candidate-3", jobId, overallScore: 67 },
			{ ...testScore, candidateId: "candidate-4", jobId, overallScore: 88 },
		];

		for (const candidate of candidates) {
			await candidateScoringService.saveScore(candidate, testMetadata);
		}

		const allCandidates = await candidateScoringService.getJobScores(jobId);
		expect(allCandidates.length).toBeGreaterThanOrEqual(4);

		const highScorers = await candidateScoringService.getJobScores(jobId, {
			minScore: 85,
		});
		expect(highScorers.length).toBeGreaterThanOrEqual(2);
		expect(highScorers.every((c) => c.overallScore >= 85)).toBe(true);

		expect(highScorers[0].overallScore).toBeGreaterThanOrEqual(
			highScorers[1]?.overallScore || 0,
		);
	});

	it("should return null for non-existent score", async () => {
		const result = await candidateScoringService.getScore(
			"non-existent-candidate",
			"non-existent-job",
		);
		expect(result).toBeNull();
	});
});
