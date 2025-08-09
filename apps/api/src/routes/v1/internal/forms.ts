import { createRoute, z } from "@hono/zod-openapi";
import type { Database } from "@seeds/supabase/types/db";
import { createClient } from "@supabase/supabase-js";
import {
	createOpenAPIApp,
	ErrorResponseSchema,
	MetadataSchema,
} from "../../../lib/openapi.js";
import { internalAuth } from "../../../middleware/internal-auth.js";
import { ConfigService } from "../../../services/config.js";
import { Logger } from "../../../services/logger.js";

const internalFormsRoutes = createOpenAPIApp();

internalFormsRoutes.use("*", internalAuth());

// Simple form field schema
const formFieldSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: z.enum(["text", "number", "email", "tel", "url", "file", "date", "select", "checkbox", "radio", "textarea"]),
	required: z.boolean(),
	order: z.number(),
	placeholder: z.string().optional(),
	helpText: z.string().optional(),
	validation: z.record(z.any()).optional(),
	options: z.array(z.string()).optional(),
});

// Simplified response schema to avoid complex type inference
const SimpleFormResponseSchema = z.object({
	success: z.literal(true),
	data: z.any(), // Using any to avoid complex type inference issues
	metadata: MetadataSchema,
});

const createFormRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Form Templates"],
	summary: "Create form template",
	description: "Create a new form template",
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						organization_id: z.string().uuid(),
						name: z.string().min(1).max(200),
						description: z.string().optional(),
						category: z.string().optional(),
						is_default: z.boolean().optional(),
						fields: z.array(formFieldSchema).min(1),
					}),
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: SimpleFormResponseSchema,
				},
			},
			description: "Form template created successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Invalid request data",
		},
	},
});

const getFormRoute = createRoute({
	method: "get",
	path: "/{id}",
	tags: ["Form Templates"],
	summary: "Get form template",
	description: "Get form template by ID",
	security: [{ bearerAuth: [] }],
	request: {
		params: z.object({
			id: z.string().uuid(),
		}),
		query: z.object({
			organization_id: z.string().uuid(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: SimpleFormResponseSchema,
				},
			},
			description: "Form template retrieved successfully",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Form template not found",
		},
	},
});

const listFormsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Form Templates"],
	summary: "List form templates",
	description: "List form templates for organization",
	security: [{ bearerAuth: [] }],
	request: {
		query: z.object({
			organization_id: z.string().uuid(),
			page: z.coerce.number().int().positive().default(1),
			limit: z.coerce.number().int().positive().max(100).default(20),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						success: z.literal(true),
						data: z.array(z.any()),
						metadata: MetadataSchema.extend({
							count: z.number(),
							total: z.number(),
							page: z.number(),
							limit: z.number(),
						}),
					}),
				},
			},
			description: "Form templates listed successfully",
		},
	},
});

internalFormsRoutes.openapi(createFormRoute, async (c) => {
	const logger = new Logger({
		correlationId: c.get("correlationId"),
		requestId: c.get("requestId"),
	});

	const timer = logger.startTimer();

	try {
		const userId = c.get("userId");
		const body = c.req.valid("json");
		const config = ConfigService.getInstance();
		const supabase = createClient<Database>(
			config.getConfig().supabaseUrl,
			config.getConfig().supabaseServiceRoleKey,
		);

		logger.info("Creating form template", {
			organizationId: body.organization_id,
			userId,
			name: body.name,
		});

		// Validate field order uniqueness
		const orders = body.fields.map(f => f.order);
		const uniqueOrders = new Set(orders);
		if (orders.length !== uniqueOrders.size) {
			return c.json(
				{
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Field orders must be unique",
					},
					timestamp: new Date().toISOString(),
					correlationId: c.get("correlationId"),
				},
				400,
			);
		}

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
				created_by: userId,
			})
			.select("*")
			.single();

		if (error) {
			logger.error("Failed to create form template", error);
			return c.json(
				{
					success: false,
					error: {
						code: "DATABASE_ERROR",
						message: "Failed to create form template",
					},
					timestamp: new Date().toISOString(),
					correlationId: c.get("correlationId"),
				},
				400,
			);
		}

		const duration = timer();
		logger.info("Form template created successfully", {
			templateId: data.id,
			name: data.name,
			duration,
		});

		return c.json(
			{
				success: true,
				data,
				metadata: {
					processingTimeMs: duration,
					correlationId: c.get("correlationId"),
					timestamp: new Date().toISOString(),
				},
			},
			201,
		);
	} catch (error) {
		const duration = timer();
		logger.error("Request failed", error);

		return c.json(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "Internal server error",
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId"),
			},
			500,
		);
	}
});

internalFormsRoutes.openapi(getFormRoute, async (c) => {
	const logger = new Logger({
		correlationId: c.get("correlationId"),
		requestId: c.get("requestId"),
	});

	const timer = logger.startTimer();

	try {
		const { id } = c.req.valid("param");
		const query = c.req.valid("query");
		const config = ConfigService.getInstance();
		const supabase = createClient<Database>(
			config.getConfig().supabaseUrl,
			config.getConfig().supabaseServiceRoleKey,
		);

		logger.info("Fetching form template", {
			templateId: id,
			organizationId: query.organization_id,
		});

		const { data, error } = await supabase
			.from("application_form_templates")
			.select("*")
			.eq("id", id)
			.eq("organization_id", query.organization_id)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return c.json(
					{
						success: false,
						error: {
							code: "FORM_NOT_FOUND",
							message: "Form template not found",
						},
						timestamp: new Date().toISOString(),
						correlationId: c.get("correlationId"),
					},
					404,
				);
			}

			logger.error("Database error", error);
			return c.json(
				{
					success: false,
					error: {
						code: "DATABASE_ERROR",
						message: "Failed to fetch form template",
					},
					timestamp: new Date().toISOString(),
					correlationId: c.get("correlationId"),
				},
				400,
			);
		}

		const duration = timer();
		logger.info("Form template fetched successfully", {
			templateId: id,
			duration,
		});

		return c.json({
			success: true,
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

		return c.json(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "Internal server error",
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId"),
			},
			500,
		);
	}
});

internalFormsRoutes.openapi(listFormsRoute, async (c) => {
	const logger = new Logger({
		correlationId: c.get("correlationId"),
		requestId: c.get("requestId"),
	});

	const timer = logger.startTimer();

	try {
		const query = c.req.valid("query");
		const config = ConfigService.getInstance();
		const supabase = createClient<Database>(
			config.getConfig().supabaseUrl,
			config.getConfig().supabaseServiceRoleKey,
		);

		logger.info("Listing form templates", {
			organizationId: query.organization_id,
			page: query.page,
		});

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
			return c.json(
				{
					success: false,
					error: {
						code: "DATABASE_ERROR",
						message: "Failed to fetch form templates",
					},
					timestamp: new Date().toISOString(),
					correlationId: c.get("correlationId"),
				},
				400,
			);
		}

		const duration = timer();
		logger.info("Form templates listed successfully", {
			count: data?.length || 0,
			total: count || 0,
			duration,
		});

		return c.json({
			success: true,
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

		return c.json(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "Internal server error",
				},
				timestamp: new Date().toISOString(),
				correlationId: c.get("correlationId"),
			},
			500,
		);
	}
});

export { internalFormsRoutes };