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

const publicFormTemplatesRoutes = createOpenAPIApp();
publicFormTemplatesRoutes.use("*", publicAuth());

// Form template schemas
const FormFieldSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: z.enum(["text", "number", "email", "tel", "url", "file", "date", "select", "checkbox", "radio", "textarea"]),
	required: z.boolean(),
	order: z.number(),
	placeholder: z.string().default(""),
	helpText: z.string().optional(),
	validation: z.record(z.any()).default({}),
	options: z.array(z.string()).optional(),
});

const CreateFormTemplateSchema = z.object({
	name: z.string().min(1).max(200),
	description: z.string().optional(),
	category: z.string().optional(),
	is_default: z.boolean().optional(),
	fields: z.array(FormFieldSchema).min(1),
});

const UpdateFormTemplateSchema = z.object({
	name: z.string().min(1).max(200).optional(),
	description: z.string().optional(),
	category: z.string().optional(),
	is_default: z.boolean().optional(),
	fields: z.array(FormFieldSchema).min(1).optional(),
});

const FormTemplateResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		id: z.string(),
		name: z.string(),
		description: z.string().nullable(),
		category: z.string().nullable(),
		is_default: z.boolean().nullable(),
		fields: z.any(), // JSON field
		organization_id: z.string(),
		created_by: z.string().nullable(),
		created_at: z.string().nullable(),
		updated_at: z.string().nullable(),
	}),
	metadata: MetadataSchema,
});

const FormTemplateListResponseSchema = z.object({
	success: z.literal(true),
	data: z.array(z.object({
		id: z.string(),
		name: z.string(),
		description: z.string().nullable(),
		category: z.string().nullable(),
		is_default: z.boolean().nullable(),
		fields: z.any(),
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

// Routes
const createFormTemplateRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Form Templates"],
	summary: "Create form template",
	description: "Create a new application form template for your organization",
	security: [{ apiKey: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateFormTemplateSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: FormTemplateResponseSchema } },
			description: "Form template created successfully",
		},
		400: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Invalid request data",
		},
	},
});

const listFormTemplatesRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Form Templates"],
	summary: "List form templates",
	description: "Get all application form templates for your organization",
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
			content: { "application/json": { schema: FormTemplateListResponseSchema } },
			description: "Form templates retrieved successfully",
		},
	},
});

const getFormTemplateRoute = createRoute({
	method: "get",
	path: "/{id}",
	tags: ["Form Templates"],
	summary: "Get form template",
	description: "Get a specific application form template by ID",
	security: [{ apiKey: [] }],
	request: {
		params: z.object({ id: z.string().uuid() }),
	},
	responses: {
		200: {
			content: { "application/json": { schema: FormTemplateResponseSchema } },
			description: "Form template retrieved successfully",
		},
		404: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Form template not found",
		},
	},
});

const updateFormTemplateRoute = createRoute({
	method: "put",
	path: "/{id}",
	tags: ["Form Templates"],
	summary: "Update form template",
	description: "Update an existing application form template",
	security: [{ apiKey: [] }],
	request: {
		params: z.object({ id: z.string().uuid() }),
		body: {
			content: {
				"application/json": {
					schema: UpdateFormTemplateSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: FormTemplateResponseSchema } },
			description: "Form template updated successfully",
		},
		404: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Form template not found",
		},
	},
});

const deleteFormTemplateRoute = createRoute({
	method: "delete",
	path: "/{id}",
	tags: ["Form Templates"],
	summary: "Delete form template",
	description: "Delete an application form template",
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
			description: "Form template deleted successfully",
		},
		404: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Form template not found",
		},
	},
});

// Implementations
publicFormTemplatesRoutes.openapi(createFormTemplateRoute, async (c: any) => {
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

		// Handle default template logic
		if (body.is_default) {
			await supabase
				.from("application_form_templates")
				.update({ is_default: false })
				.eq("organization_id", organizationId)
				.eq("is_default", true);
		}

		const { data, error } = await supabase
			.from("application_form_templates")
			.insert({
				...body,
				organization_id: organizationId,
				created_by: (c.get("apiKeyOwner") as string) || "api",
			})
			.select("*")
			.single();

		if (error) {
			logger.error("Failed to create form template", { 
				error: error.message || "Unknown database error",
				code: error.code,
				details: error.details,
				hint: error.hint,
			});
			return c.json({
				success: false as const,
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to create form template",
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

publicFormTemplatesRoutes.openapi(listFormTemplatesRoute, async (c: any) => {
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

		// Build query
		let dbQuery = supabase
			.from("application_form_templates")
			.select("*", { count: "exact" })
			.eq("organization_id", organizationId)
			.order("created_at", { ascending: false });

		if (query.category) {
			dbQuery = dbQuery.eq("category", query.category);
		}

		// Get total count
		const { count } = await supabase
			.from("application_form_templates")
			.select("*", { count: "exact", head: true })
			.eq("organization_id", organizationId);

		// Get paginated data
		const offset = (query.page - 1) * query.limit;
		const { data, error } = await dbQuery.range(offset, offset + query.limit - 1);

		if (error) {
			logger.error("Database error", error);
			return c.json({
				success: false as const,
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch form templates",
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

publicFormTemplatesRoutes.openapi(getFormTemplateRoute, async (c: any) => {
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
			.from("application_form_templates")
			.select("*")
			.eq("id", id)
			.eq("organization_id", organizationId)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return c.json({
					success: false as const,
					error: {
						code: "FORM_NOT_FOUND",
						message: "Form template not found",
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
					message: "Failed to fetch form template",
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

publicFormTemplatesRoutes.openapi(updateFormTemplateRoute, async (c: any) => {
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

		// Handle default template logic
		if (body.is_default) {
			await supabase
				.from("application_form_templates")
				.update({ is_default: false })
				.eq("organization_id", organizationId)
				.eq("is_default", true)
				.neq("id", id); // Don't update the current template
		}

		const { data, error } = await supabase
			.from("application_form_templates")
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
						code: "FORM_NOT_FOUND",
						message: "Form template not found",
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
					message: "Failed to update form template",
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

publicFormTemplatesRoutes.openapi(deleteFormTemplateRoute, async (c: any) => {
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
			.from("application_form_templates")
			.delete()
			.eq("id", id)
			.eq("organization_id", organizationId);

		if (error) {
			logger.error("Database error", error);
			return c.json({
				success: false as const,
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to delete form template",
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId"),
			}, 400);
		}

		const duration = timer();
		return c.json({
			success: true as const,
			message: "Form template deleted successfully",
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

export { publicFormTemplatesRoutes };