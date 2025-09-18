import { createRoute, z } from "@hono/zod-openapi";
import type { Database } from "@seeds/supabase/types/db";
import { createClient } from "@supabase/supabase-js";
import {
	createOpenAPIApp,
	ErrorResponseSchema,
	MetadataSchema,
} from "../../../lib/openapi.js";
import { type PublicAuthContext, publicAuth } from "../../../middleware/public-auth.js";
import { ConfigService } from "../../../services/config.js";
import { Logger } from "../../../services/logger.js";

const publicPipelineTemplatesRoutes = createOpenAPIApp();
publicPipelineTemplatesRoutes.use("*", publicAuth());


const PipelineStepSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: z.enum(["application", "auto_screen", "manual_review", "interview", "assessment", "offer"]),
	order: z.number(),
	config: z.record(z.any()).default({}),
});

const CreatePipelineTemplateSchema = z.object({
	name: z.string().min(1).max(200),
	description: z.string().optional(),
	category: z.string().optional(),
	is_default: z.boolean().optional(),
	steps: z.array(PipelineStepSchema).min(1),
});

const UpdatePipelineTemplateSchema = z.object({
	name: z.string().min(1).max(200).optional(),
	description: z.string().optional(),
	category: z.string().optional(),
	is_default: z.boolean().optional(),
	steps: z.array(PipelineStepSchema).min(1).optional(),
});

const PipelineTemplateResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		id: z.string(),
		name: z.string(),
		description: z.string().nullable(),
		category: z.string().nullable(),
		is_default: z.boolean().nullable(),
		steps: z.any(), 
		organization_id: z.string(),
		created_by: z.string().nullable(),
		created_at: z.string().nullable(),
		updated_at: z.string().nullable(),
	}),
	metadata: MetadataSchema,
});

const PipelineTemplateListResponseSchema = z.object({
	success: z.literal(true),
	data: z.array(z.object({
		id: z.string(),
		name: z.string(),
		description: z.string().nullable(),
		category: z.string().nullable(),
		is_default: z.boolean().nullable(),
		steps: z.any(),
		organization_id: z.string(),
		created_by: z.string().nullable(),
		created_at: z.string().nullable(),
		updated_at: z.string().nullable(),
	})),
	metadata: MetadataSchema.extend({
		count: z.number(),
		total: z.number(),
		page: z.number(),
		limit: z.number(),
	}),
});


const createPipelineTemplateRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Pipeline Templates"],
	summary: "Create pipeline template",
	description: "Create a new hiring pipeline template for your organization",
	security: [{ apiKey: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreatePipelineTemplateSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: PipelineTemplateResponseSchema } },
			description: "Pipeline template created successfully",
		},
		400: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Invalid request data",
		},
	},
});

const listPipelineTemplatesRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Pipeline Templates"],
	summary: "List pipeline templates",
	description: "Get all hiring pipeline templates for your organization",
	security: [{ apiKey: [] }],
	request: {
		query: z.object({
			page: z.coerce.number().int().positive().default(1),
			limit: z.coerce.number().int().positive().max(100).default(20),
			category: z.string().optional(),
		}),
	},
	responses: {
		200: {
			content: { "application/json": { schema: PipelineTemplateListResponseSchema } },
			description: "Pipeline templates retrieved successfully",
		},
	},
});

const getPipelineTemplateRoute = createRoute({
	method: "get",
	path: "/{id}",
	tags: ["Pipeline Templates"],
	summary: "Get pipeline template",
	description: "Get a specific hiring pipeline template by ID",
	security: [{ apiKey: [] }],
	request: {
		params: z.object({ id: z.string().uuid() }),
	},
	responses: {
		200: {
			content: { "application/json": { schema: PipelineTemplateResponseSchema } },
			description: "Pipeline template retrieved successfully",
		},
		404: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Pipeline template not found",
		},
	},
});

const updatePipelineTemplateRoute = createRoute({
	method: "put",
	path: "/{id}",
	tags: ["Pipeline Templates"],
	summary: "Update pipeline template",
	description: "Update an existing hiring pipeline template",
	security: [{ apiKey: [] }],
	request: {
		params: z.object({ id: z.string().uuid() }),
		body: {
			content: {
				"application/json": {
					schema: UpdatePipelineTemplateSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: PipelineTemplateResponseSchema } },
			description: "Pipeline template updated successfully",
		},
		404: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Pipeline template not found",
		},
	},
});

const deletePipelineTemplateRoute = createRoute({
	method: "delete",
	path: "/{id}",
	tags: ["Pipeline Templates"],
	summary: "Delete pipeline template",
	description: "Delete a hiring pipeline template",
	security: [{ apiKey: [] }],
	request: {
		params: z.object({ id: z.string().uuid() }),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						success: z.literal(true),
						message: z.string(),
						metadata: MetadataSchema,
					}),
				},
			},
			description: "Pipeline template deleted successfully",
		},
		404: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Pipeline template not found",
		},
	},
});


publicPipelineTemplatesRoutes.openapi(createPipelineTemplateRoute, async (c: any) => {
	const logger = new Logger({
		correlationId: c.get("correlationId"),
		requestId: c.get("requestId"),
	});

	const timer = logger.startTimer();

	try {
		const body = c.req.valid("json");
		const apiKeyMeta = c.get("apiKeyMeta");
		if (!apiKeyMeta) {
			return c.json({
				success: false as const,
				error: {
					code: "AUTH_ERROR",
					message: "Authentication metadata missing",
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId"),
			}, 401);
		}
		const organizationId = apiKeyMeta.companyId as string;

		const config = ConfigService.getInstance();
		const supabase = createClient<Database>(
			config.getConfig().supabaseUrl,
			config.getConfig().supabaseServiceRoleKey,
		);

		
		if (body.is_default) {
			await supabase
				.from("pipeline_templates")
				.update({ is_default: false })
				.eq("organization_id", organizationId)
				.eq("is_default", true);
		}

		const { data, error } = await supabase
			.from("pipeline_templates")
			.insert({
				...body,
				organization_id: organizationId,
				created_by: null, 
			})
			.select("*")
			.single();

		if (error) {
			logger.error("Failed to create pipeline template", { 
				error: error.message || "Unknown database error",
				code: error.code,
				details: error.details,
				hint: error.hint,
			});
			return c.json({
				success: false as const,
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to create pipeline template",
					details: error.message || "Unknown database error",
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId"),
			}, 400);
		}

		const duration = timer();
		return c.json({
			success: true as const,
			data,
			metadata: {
				processingTimeMs: duration,
				correlationId: c.get("correlationId"),
				timestamp: new Date().toISOString(),
			},
		}, 201);
	} catch (error) {
		const duration = timer();
		logger.error("Request failed", error);
		return c.json({
			success: false as const,
			error: {
				code: "INTERNAL_ERROR",
				message: "Internal server error",
			},
			timestamp: new Date().toISOString(),
			correlationId: c.get("correlationId"),
		}, 500);
	}
});

publicPipelineTemplatesRoutes.openapi(listPipelineTemplatesRoute, async (c: any) => {
	const logger = new Logger({
		correlationId: c.get("correlationId"),
		requestId: c.get("requestId"),
	});

	const timer = logger.startTimer();

	try {
		const query = c.req.valid("query");
		const apiKeyMeta = c.get("apiKeyMeta");
		if (!apiKeyMeta) {
			return c.json({
				success: false as const,
				error: {
					code: "AUTH_ERROR",
					message: "Authentication metadata missing",
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId"),
			}, 401);
		}
		const organizationId = apiKeyMeta.companyId as string;

		const config = ConfigService.getInstance();
		const supabase = createClient<Database>(
			config.getConfig().supabaseUrl,
			config.getConfig().supabaseServiceRoleKey,
		);

		
		let dbQuery = supabase
			.from("pipeline_templates")
			.select("*", { count: "exact" })
			.eq("organization_id", organizationId)
			.order("created_at", { ascending: false });

		if (query.category) {
			dbQuery = dbQuery.eq("category", query.category);
		}

		
		const { count } = await supabase
			.from("pipeline_templates")
			.select("*", { count: "exact", head: true })
			.eq("organization_id", organizationId);

		
		const offset = (query.page - 1) * query.limit;
		const { data, error } = await dbQuery.range(offset, offset + query.limit - 1);

		if (error) {
			logger.error("Database error", error);
			return c.json({
				success: false as const,
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch pipeline templates",
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId"),
			}, 400);
		}

		const duration = timer();
		return c.json({
			success: true as const,
			data,
			metadata: {
				count: data?.length || 0,
				total: count || 0,
				page: query.page,
				limit: query.limit,
				processingTimeMs: duration,
				correlationId: c.get("correlationId"),
				timestamp: new Date().toISOString(),
			},
		});
	} catch (error) {
		const duration = timer();
		logger.error("Request failed", error);
		return c.json({
			success: false as const,
			error: {
				code: "INTERNAL_ERROR",
				message: "Internal server error",
			},
			timestamp: new Date().toISOString(),
			correlationId: c.get("correlationId"),
		}, 500);
	}
});

publicPipelineTemplatesRoutes.openapi(getPipelineTemplateRoute, async (c: any) => {
	const logger = new Logger({
		correlationId: c.get("correlationId"),
		requestId: c.get("requestId"),
	});

	const timer = logger.startTimer();

	try {
		const { id } = c.req.valid("param");
		const apiKeyMeta = c.get("apiKeyMeta");
		if (!apiKeyMeta) {
			return c.json({
				success: false as const,
				error: {
					code: "AUTH_ERROR",
					message: "Authentication metadata missing",
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId"),
			}, 401);
		}
		const organizationId = apiKeyMeta.companyId as string;

		const config = ConfigService.getInstance();
		const supabase = createClient<Database>(
			config.getConfig().supabaseUrl,
			config.getConfig().supabaseServiceRoleKey,
		);

		const { data, error } = await supabase
			.from("pipeline_templates")
			.select("*")
			.eq("id", id)
			.eq("organization_id", organizationId)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return c.json({
					success: false as const,
					error: {
						code: "PIPELINE_NOT_FOUND",
						message: "Pipeline template not found",
					},
					timestamp: new Date().toISOString(),
					correlationId: c.get("correlationId"),
				}, 404);
			}

			logger.error("Database error", error);
			return c.json({
				success: false as const,
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch pipeline template",
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId"),
			}, 400);
		}

		const duration = timer();
		return c.json({
			success: true as const,
			data,
			metadata: {
				processingTimeMs: duration,
				correlationId: c.get("correlationId"),
				timestamp: new Date().toISOString(),
			},
		});
	} catch (error) {
		const duration = timer();
		logger.error("Request failed", error);
		return c.json({
			success: false as const,
			error: {
				code: "INTERNAL_ERROR",
				message: "Internal server error",
			},
			timestamp: new Date().toISOString(),
			correlationId: c.get("correlationId"),
		}, 500);
	}
});

publicPipelineTemplatesRoutes.openapi(updatePipelineTemplateRoute, async (c: any) => {
	const logger = new Logger({
		correlationId: c.get("correlationId"),
		requestId: c.get("requestId"),
	});

	const timer = logger.startTimer();

	try {
		const { id } = c.req.valid("param");
		const body = c.req.valid("json");
		const apiKeyMeta = c.get("apiKeyMeta");
		if (!apiKeyMeta) {
			return c.json({
				success: false as const,
				error: {
					code: "AUTH_ERROR",
					message: "Authentication metadata missing",
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId"),
			}, 401);
		}
		const organizationId = apiKeyMeta.companyId as string;

		const config = ConfigService.getInstance();
		const supabase = createClient<Database>(
			config.getConfig().supabaseUrl,
			config.getConfig().supabaseServiceRoleKey,
		);

		
		if (body.is_default) {
			await supabase
				.from("pipeline_templates")
				.update({ is_default: false })
				.eq("organization_id", organizationId)
				.eq("is_default", true)
				.neq("id", id); 
		}

		const { data, error } = await supabase
			.from("pipeline_templates")
			.update(body)
			.eq("id", id)
			.eq("organization_id", organizationId)
			.select("*")
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return c.json({
					success: false as const,
					error: {
						code: "PIPELINE_NOT_FOUND",
						message: "Pipeline template not found",
					},
					timestamp: new Date().toISOString(),
					correlationId: c.get("correlationId"),
				}, 404);
			}

			logger.error("Database error", error);
			return c.json({
				success: false as const,
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to update pipeline template",
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId"),
			}, 400);
		}

		const duration = timer();
		return c.json({
			success: true as const,
			data,
			metadata: {
				processingTimeMs: duration,
				correlationId: c.get("correlationId"),
				timestamp: new Date().toISOString(),
			},
		});
	} catch (error) {
		const duration = timer();
		logger.error("Request failed", error);
		return c.json({
			success: false as const,
			error: {
				code: "INTERNAL_ERROR",
				message: "Internal server error",
			},
			timestamp: new Date().toISOString(),
			correlationId: c.get("correlationId"),
		}, 500);
	}
});

publicPipelineTemplatesRoutes.openapi(deletePipelineTemplateRoute, async (c: any) => {
	const logger = new Logger({
		correlationId: c.get("correlationId"),
		requestId: c.get("requestId"),
	});

	const timer = logger.startTimer();

	try {
		const { id } = c.req.valid("param");
		const apiKeyMeta = c.get("apiKeyMeta");
		if (!apiKeyMeta) {
			return c.json({
				success: false as const,
				error: {
					code: "AUTH_ERROR",
					message: "Authentication metadata missing",
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId"),
			}, 401);
		}
		const organizationId = apiKeyMeta.companyId as string;

		const config = ConfigService.getInstance();
		const supabase = createClient<Database>(
			config.getConfig().supabaseUrl,
			config.getConfig().supabaseServiceRoleKey,
		);

		const { error } = await supabase
			.from("pipeline_templates")
			.delete()
			.eq("id", id)
			.eq("organization_id", organizationId);

		if (error) {
			logger.error("Database error", error);
			return c.json({
				success: false as const,
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to delete pipeline template",
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId"),
			}, 400);
		}

		const duration = timer();
		return c.json({
			success: true as const,
			message: "Pipeline template deleted successfully",
			metadata: {
				processingTimeMs: duration,
				correlationId: c.get("correlationId"),
				timestamp: new Date().toISOString(),
			},
		});
	} catch (error) {
		const duration = timer();
		logger.error("Request failed", error);
		return c.json({
			success: false as const,
			error: {
				code: "INTERNAL_ERROR",
				message: "Internal server error",
			},
			timestamp: new Date().toISOString(),
			correlationId: c.get("correlationId"),
		}, 500);
	}
});

export { publicPipelineTemplatesRoutes };