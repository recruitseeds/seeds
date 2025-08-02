import type { Context, Next } from "hono";
import { type ZodSchema, z } from "zod";

export interface ValidationContext {
	Variables: {
		validatedData: Record<string, unknown>;
		correlationId: string;
		requestId: string;
	};
}

export const validate = <T>(schema: ZodSchema<T>) => {
	return async (c: Context<ValidationContext>, next: Next) => {
		try {
			const body = await c.req.json().catch(() => ({}));
			const params = c.req.param();
			const query = Object.fromEntries(
				new URL(c.req.url).searchParams.entries(),
			);

			const data = {
				body,
				params,
				query,
			};

			const validatedData = schema.parse(data);
			c.set("validatedData", validatedData as Record<string, unknown>);

			return next();
		} catch (error) {
			if (error instanceof z.ZodError) {
				return c.json(
					{
						success: false,
						error: {
							code: "VALIDATION_ERROR",
							message: "Request validation failed",
							details: error.errors.map((err) => ({
								field: err.path.join("."),
								message: err.message,
								code: err.code,
							})),
						},
						correlationId: c.get("correlationId"),
					},
					400,
				);
			}

			return c.json(
				{
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Invalid request format",
					},
					correlationId: c.get("correlationId"),
				},
				400,
			);
		}
	};
};

export const businessValidation = (
	validator: (context: Context) => Promise<void>,
) => {
	return async (c: Context, next: Next) => {
		try {
			await validator(c);
			return next();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Business validation failed";

			return c.json(
				{
					success: false,
					error: {
						code: "BUSINESS_VALIDATION_ERROR",
						message,
					},
					correlationId: c.get("correlationId"),
				},
				400,
			);
		}
	};
};
