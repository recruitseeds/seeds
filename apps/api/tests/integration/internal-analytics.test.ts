import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { correlationMiddleware } from "../../src/middleware/correlation.js";
import { errorHandler } from "../../src/middleware/error-handler.js";
import { internalRoutes } from "../../src/routes/v1/internal/index.js";

vi.mock("@supabase/supabase-js", () => ({
	createClient: vi.fn().mockImplementation(() => ({
		from: vi.fn().mockImplementation((table: string) => ({
			select: vi.fn().mockReturnThis(),
			gte: vi.fn().mockReturnThis(),
			limit: vi.fn().mockResolvedValue({
				data: [
					{
						overall_score: 85,
						required_skills_score: 90,
						experience_score: 80,
						processing_time_ms: 2500,
					},
					{
						overall_score: 75,
						required_skills_score: 80,
						experience_score: 85,
						processing_time_ms: 3000,
					},
				],
				count: table === "candidate_skill_scores" ? 150 : 25,
			}),
		})),
	})),
}));

describe("Internal Analytics API", () => {
	let app: Hono;

	beforeEach(() => {
		app = new Hono();
		app.use("*", errorHandler());
		app.use("*", correlationMiddleware());
		app.route("/internal", internalRoutes);

		vi.clearAllMocks();
		process.env.INTERNAL_API_SECRET = "test-internal-secret";
		process.env.JWT_SECRET = "test-jwt-secret";
	});

	describe("GET /internal/analytics/dashboard", () => {
		it("should return dashboard data with admin token", async () => {
			const response = await app.request("/internal/analytics/dashboard", {
				method: "GET",
				headers: {
					Authorization: "Internal test-internal-secret",
				},
			});

			expect(response.status).toBe(200);
			const body = await response.json();

			expect(body.success).toBe(true);
			expect(body.data).toBeDefined();
			expect(body.data.totalCandidatesProcessed).toBeDefined();
			expect(body.data.totalJobPostings).toBeDefined();
			expect(body.data.processingStats).toBeDefined();
			expect(body.data.averageScores).toBeDefined();
			expect(body.data.topSkills).toBeDefined();
			expect(body.data.companyUsage).toBeDefined();
			expect(body.data.systemHealth).toBeDefined();
			expect(body.metadata.correlationId).toBeDefined();
			expect(body.metadata.generatedAt).toBeDefined();
		});

		it("should reject requests without internal authentication", async () => {
			const response = await app.request("/internal/analytics/dashboard", {
				method: "GET",
			});

			expect(response.status).toBe(401);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("MISSING_INTERNAL_TOKEN");
		});

		it("should reject invalid internal tokens", async () => {
			const response = await app.request("/internal/analytics/dashboard", {
				method: "GET",
				headers: {
					Authorization: "Internal invalid-token",
				},
			});

			expect(response.status).toBe(401);
			const body = await response.json();

			expect(body.success).toBe(false);
			expect(body.error.code).toBe("INVALID_INTERNAL_TOKEN");
		});

		it("should handle JWT tokens with proper permissions", async () => {
			const jwtToken = createMockJWT({
				sub: "user-123",
				role: "analyst",
				permissions: ["analytics:read"],
			});

			const response = await app.request("/internal/analytics/dashboard", {
				method: "GET",
				headers: {
					Authorization: `Bearer jwt.${jwtToken}`,
				},
			});

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.success).toBe(true);
		});

		it("should reject JWT tokens without analytics permissions", async () => {
			const jwtToken = createMockJWT({
				sub: "user-123",
				role: "viewer",
				permissions: ["candidates:read"],
			});

			const response = await app.request("/internal/analytics/dashboard", {
				method: "GET",
				headers: {
					Authorization: `Bearer jwt.${jwtToken}`,
				},
			});

			expect(response.status).toBe(403);
			const body = await response.json();
			expect(body.success).toBe(false);
			expect(body.error.code).toBe("BUSINESS_VALIDATION_ERROR");
		});

		it("should include comprehensive analytics data", async () => {
			const response = await app.request("/internal/analytics/dashboard", {
				method: "GET",
				headers: {
					Authorization: "Internal test-internal-secret",
				},
			});

			expect(response.status).toBe(200);
			const body = await response.json();

			expect(body.data.processingStats.last24Hours).toBeGreaterThanOrEqual(0);
			expect(body.data.processingStats.last7Days).toBeGreaterThanOrEqual(0);
			expect(body.data.processingStats.last30Days).toBeGreaterThanOrEqual(0);

			expect(body.data.averageScores.overallScore).toBeGreaterThanOrEqual(0);
			expect(body.data.averageScores.overallScore).toBeLessThanOrEqual(100);

			expect(Array.isArray(body.data.topSkills)).toBe(true);
			expect(Array.isArray(body.data.companyUsage)).toBe(true);

			expect(body.data.systemHealth.aiServiceUptime).toBeGreaterThan(0);
			expect(body.data.systemHealth.averageProcessingTime).toBeGreaterThan(0);
			expect(body.data.systemHealth.errorRate).toBeGreaterThanOrEqual(0);
		});

		it("should handle database errors gracefully", async () => {
			vi.mocked(
				require("@supabase/supabase-js").createClient,
			).mockImplementationOnce(() => ({
				from: vi.fn().mockImplementation(() => ({
					select: vi.fn().mockReturnThis(),
					gte: vi.fn().mockReturnThis(),
					limit: vi
						.fn()
						.mockRejectedValue(new Error("Database connection failed")),
				})),
			}));

			const response = await app.request("/internal/analytics/dashboard", {
				method: "GET",
				headers: {
					Authorization: "Internal test-internal-secret",
				},
			});

			expect(response.status).toBe(500);
			const body = await response.json();
			expect(body.success).toBe(false);
			expect(body.error.code).toBe("ANALYTICS_ERROR");
		});
	});
});

function createMockJWT(payload: any): string {
	const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
	const payloadStr = btoa(
		JSON.stringify({
			...payload,
			exp: Math.floor(Date.now() / 1000) + 3600,
		}),
	);
	const signature = btoa("mock-signature");

	return `${header}.${payloadStr}.${signature}`;
}
