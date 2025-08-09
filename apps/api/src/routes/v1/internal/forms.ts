import { Hono } from "hono";
import { z } from "zod";
import type { Database } from "@seeds/supabase/types/db";
import { createClient } from "@supabase/supabase-js";
import { type InternalAuthContext, internalAuth } from "../../../middleware/internal-auth.js";
import { ConfigService } from "../../../services/config.js";
import { Logger } from "../../../services/logger.js";

const internalFormsRoutes = new Hono<InternalAuthContext>();
internalFormsRoutes.use("*", internalAuth());

// Validation schemas
const CreateFormSchema = z.object({
	organization_id: z.string().uuid(),
	name: z.string().min(1).max(200),
	description: z.string().optional(),
	category: z.string().optional(),
	is_default: z.boolean().optional(),
	fields: z.array(z.object({
		id: z.string(),
		name: z.string(),
		type: z.enum(["text", "number", "email", "tel", "url", "file", "date", "select", "checkbox", "radio", "textarea"]),
		required: z.boolean(),
		order: z.number(),
		placeholder: z.string().optional(),
		helpText: z.string().optional(),
		validation: z.record(z.any()).optional(),
		options: z.array(z.string()).optional(),
	})).min(1),
});

const GetFormParamsSchema = z.object({
	id: z.string().uuid(),
});

const GetFormQuerySchema = z.object({
	organization_id: z.string().uuid(),
});

const ListFormsQuerySchema = z.object({
	organization_id: z.string().uuid(),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(20),
});

// POST /forms - Create form template
internalFormsRoutes.post("/", async (c) => {
	const logger = new Logger({
		correlationId: c.get("correlationId") as string,
		requestId: c.get("requestId") as string,
	});

	const timer = logger.startTimer();

	try {
		const rawBody = await c.req.json();
		const body = CreateFormSchema.parse(rawBody);
		
		const config = ConfigService.getInstance();
		const supabase = createClient<Database>(
			config.getConfig().supabaseUrl,
			config.getConfig().supabaseServiceRoleKey,
		);

		logger.info("Creating form template", {
			organizationId: body.organization_id,
			name: body.name,
		});

		// Handle default template logic
		if (body.is_default) {
			await supabase
				.from("application_form_templates")
				.update({ is_default: false })
				.eq("organization_id", body.organization_id)
				.eq("is_default", true);
		}

		const { data, error } = await supabase
			.from("application_form_templates")
			.insert({
				...body,
				created_by: c.get("userId") || "system",
			})
			.select("*")
			.single();

		if (error) {
			logger.error("Failed to create form template", error);
			return c.json({
				success: false,
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to create form template",
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId") as string,
			}, 400);
		}

		const duration = timer();
		return c.json({
			success: true,
			data,
			metadata: {
				processingTimeMs: duration,
				correlationId: c.get("correlationId") as string,
				timestamp: new Date().toISOString(),
			},
		}, 201);
	} catch (error) {
		const duration = timer();
		logger.error("Request failed", error);
		
		if (error instanceof z.ZodError) {
			return c.json({
				success: false,
				error: {
					code: "VALIDATION_ERROR",
					message: "Invalid request data",
					details: error.errors,
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId") as string,
			}, 400);
		}
		
		return c.json({
			success: false,
			error: {
				code: "INTERNAL_ERROR",
				message: "Internal server error",
			},
			timestamp: new Date().toISOString(),
			correlationId: c.get("correlationId") as string,
		}, 500);
	}
});

// GET /forms/:id - Get form template by ID
internalFormsRoutes.get("/:id", async (c) => {
	const logger = new Logger({
		correlationId: c.get("correlationId") as string,
		requestId: c.get("requestId") as string,
	});

	const timer = logger.startTimer();

	try {
		const params = GetFormParamsSchema.parse({ id: c.req.param("id") });
		const query = GetFormQuerySchema.parse({
			organization_id: c.req.query("organization_id"),
		});
		
		const config = ConfigService.getInstance();
		const supabase = createClient<Database>(
			config.getConfig().supabaseUrl,
			config.getConfig().supabaseServiceRoleKey,
		);

		const { data, error } = await supabase
			.from("application_form_templates")
			.select("*")
			.eq("id", params.id)
			.eq("organization_id", query.organization_id)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return c.json({
					success: false,
					error: {
						code: "FORM_NOT_FOUND",
						message: "Form template not found",
					},
					timestamp: new Date().toISOString(),
					correlationId: c.get("correlationId") as string,
				}, 404);
			}

			logger.error("Database error", error);
			return c.json({
				success: false,
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch form template",
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId") as string,
			}, 400);
		}

		const duration = timer();
		return c.json({
			success: true,
			data,
			metadata: {
				processingTimeMs: duration,
				correlationId: c.get("correlationId") as string,
				timestamp: new Date().toISOString(),
			},
		});
	} catch (error) {
		const duration = timer();
		logger.error("Request failed", error);
		
		if (error instanceof z.ZodError) {
			return c.json({
				success: false,
				error: {
					code: "VALIDATION_ERROR",
					message: "Invalid request data",
					details: error.errors,
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId") as string,
			}, 400);
		}
		
		return c.json({
			success: false,
			error: {
				code: "INTERNAL_ERROR",
				message: "Internal server error",
			},
			timestamp: new Date().toISOString(),
			correlationId: c.get("correlationId") as string,
		}, 500);
	}
});

// GET /forms - List form templates for organization
internalFormsRoutes.get("/", async (c) => {
	const logger = new Logger({
		correlationId: c.get("correlationId") as string,
		requestId: c.get("requestId") as string,
	});

	const timer = logger.startTimer();

	try {
		const query = ListFormsQuerySchema.parse({
			organization_id: c.req.query("organization_id"),
			page: c.req.query("page"),
			limit: c.req.query("limit"),
		});
		
		const config = ConfigService.getInstance();
		const supabase = createClient<Database>(
			config.getConfig().supabaseUrl,
			config.getConfig().supabaseServiceRoleKey,
		);

		const countQuery = supabase
			.from("application_form_templates")
			.select("*", { count: "exact", head: true })
			.eq("organization_id", query.organization_id);

		const { count } = await countQuery;

		const offset = (query.page - 1) * query.limit;
		const { data, error } = await supabase
			.from("application_form_templates")
			.select("*")
			.eq("organization_id", query.organization_id)
			.order("created_at", { ascending: false })
			.range(offset, offset + query.limit - 1);

		if (error) {
			logger.error("Database error", error);
			return c.json({
				success: false,
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch form templates",
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId") as string,
			}, 400);
		}

		const duration = timer();
		return c.json({
			success: true,
			data,
			metadata: {
				count: data?.length || 0,
				total: count || 0,
				page: query.page,
				limit: query.limit,
				processingTimeMs: duration,
				correlationId: c.get("correlationId") as string,
				timestamp: new Date().toISOString(),
			},
		});
	} catch (error) {
		const duration = timer();
		logger.error("Request failed", error);
		
		if (error instanceof z.ZodError) {
			return c.json({
				success: false,
				error: {
					code: "VALIDATION_ERROR",
					message: "Invalid request data",
					details: error.errors,
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId") as string,
			}, 400);
		}
		
		return c.json({
			success: false,
			error: {
				code: "INTERNAL_ERROR",
				message: "Internal server error",
			},
			timestamp: new Date().toISOString(),
			correlationId: c.get("correlationId") as string,
		}, 500);
	}
});

export { internalFormsRoutes };