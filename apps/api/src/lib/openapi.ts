import { swaggerUI } from "@hono/swagger-ui";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

export const createOpenAPIApp = () => {
	return new OpenAPIHono<{
		Variables: {
			correlationId: string;
			requestId: string;
			apiKeyOwner?: string;
			apiKeyMeta?: Record<string, unknown>;
		};
	}>();
};

export const ErrorResponseSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.string(),
		message: z.string(),
		details: z.union([z.string(), z.record(z.unknown())]).optional(),
	}),
	timestamp: z.string(),
	correlationId: z.string().optional(),
});

export const MetadataSchema = z.object({
	processingTimeMs: z.number(),
	correlationId: z.string(),
	timestamp: z.string(),
});

export const HealthResponseSchema = z.object({
	status: z.literal("ok"),
	version: z.string(),
	timestamp: z.string(),
	uptime: z.number(),
	environment: z.string(),
});

export const addSwaggerUI = (
	app: OpenAPIHono<{
		Variables: {
			correlationId: string;
			requestId: string;
			apiKeyOwner?: string;
			apiKeyMeta?: Record<string, unknown>;
		};
	}>,
) => {
	app.doc("/openapi.json", {
		openapi: "3.0.0",
		info: {
			version: "1.0.0",
			title: "Seeds API",
			description: `
# AI-Powered Recruitment API

The Seeds API provides comprehensive resume parsing and candidate scoring capabilities using advanced AI technology.

## Key Features

- **AI Resume Parsing**: Extract structured data from PDF, DOCX, and text resumes
- **Intelligent Skill Matching**: Match candidates against job requirements with fuzzy matching
- **Comprehensive Scoring**: Multi-factor scoring algorithm (skills, experience, education)
- **Auto-Rejection Logic**: Configurable thresholds for automated candidate filtering
- **Hiring Recommendations**: AI-generated insights for recruiters

## Authentication

All API endpoints require authentication using API keys. Include your API key in the Authorization header:

\`\`\`
Authorization: Bearer uk_your_api_key_here
\`\`\`

## Rate Limits

- **Free Tier**: 100 requests per hour
- **Pro Tier**: 1,000 requests per hour  
- **Enterprise**: Custom limits available

## Support

For API support, visit our [documentation](https://docs.recruitseeds.com) or contact support@recruitseeds.com.
      `,
			contact: {
				name: "API Support",
				url: "https://docs.recruitseeds.com",
				email: "support@recruitseeds.com",
			},
			license: {
				name: "Commercial License",
				url: "https://recruitseeds.com/license",
			},
			termsOfService: "https://recruitseeds.com/terms",
		},
		servers: [
			{
				url: "http://localhost:3001",
				description: "Development server",
			},
			{
				url: "https://api.recruitseeds.com",
				description: "Production server",
			},
		],
		tags: [
			{
				name: "Health",
				description: "Health check and system status endpoints",
			},
			{
				name: "Candidates",
				description: "Resume parsing, skill matching, and candidate scoring",
			},
			{
				name: "Jobs",
				description: "Job posting and requirements management",
			},
			{
				name: "Pipeline",
				description: "Hiring pipeline and workflow automation",
			},
		],
	});

	app.get("/docs", swaggerUI({ url: "/openapi.json" }));

	return app;
};

export const healthRoute = createRoute({
	method: "get",
	path: "/health",
	tags: ["Health"],
	summary: "Health check",
	description: "Returns the current health status of the API",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: HealthResponseSchema,
				},
			},
			description: "Health status",
		},
	},
});
