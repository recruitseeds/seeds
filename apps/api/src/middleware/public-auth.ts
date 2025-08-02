import type { Context, Next } from "hono";

export interface PublicAuthContext {
	Variables: {
		correlationId: string;
		requestId: string;
		apiKeyOwner: string;
		apiKeyMeta: {
			tier: "free" | "pro" | "enterprise";
			companyId: string;
			permissions: string[];
		};
	};
}

export const publicAuth = () => {
	return async (c: Context<PublicAuthContext>, next: Next) => {
		const authHeader = c.req.header("Authorization");
		const apiKey = authHeader?.replace("Bearer ", "");

		if (!apiKey) {
			return c.json(
				{
					success: false,
					error: {
						code: "MISSING_API_KEY",
						message:
							"API key required. Include 'Authorization: Bearer <your-api-key>' header",
						documentation: "https://docs.recruitseeds.com/authentication",
					},
					correlationId: c.get("correlationId"),
				},
				401,
			);
		}

		try {
			const unkeyApiKey = process.env.UNKEY_API_KEY;
			const unkeyAppId = process.env.UNKEY_APP_ID;

			if (!unkeyApiKey || !unkeyAppId) {
				return c.json(
					{
						success: false,
						error: {
							code: "AUTH_SERVICE_UNAVAILABLE",
							message: "Authentication service temporarily unavailable",
						},
						correlationId: c.get("correlationId"),
					},
					503,
				);
			}

			const response = await fetch("https://api.unkey.dev/v1/keys.verifyKey", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${unkeyApiKey}`,
				},
				body: JSON.stringify({
					apiId: unkeyAppId,
					key: apiKey,
				}),
			});

			if (!response.ok) {
				return c.json(
					{
						success: false,
						error: {
							code: "AUTH_SERVICE_ERROR",
							message: "Authentication service error",
						},
						correlationId: c.get("correlationId"),
					},
					500,
				);
			}

			const result = (await response.json()) as {
				valid: boolean;
				code?: string;
				message?: string;
				ownerId?: string;
				meta?: {
					tier?: string;
					companyId?: string;
					permissions?: string[];
				};
			};

			if (!result.valid) {
				return c.json(
					{
						success: false,
						error: {
							code: result.code || "INVALID_API_KEY",
							message: result.message || "Invalid or expired API key",
							documentation: "https://docs.recruitseeds.com/authentication",
						},
						correlationId: c.get("correlationId"),
					},
					401,
				);
			}

			const tier =
				(result.meta?.tier as "free" | "pro" | "enterprise") || "free";
			const companyId = result.meta?.companyId || result.ownerId || "unknown";
			const permissions = result.meta?.permissions || [];

			c.set("apiKeyOwner", result.ownerId || "unknown");
			c.set("apiKeyMeta", {
				tier,
				companyId,
				permissions,
			});

			return next();
		} catch (error) {
			return c.json(
				{
					success: false,
					error: {
						code: "AUTH_ERROR",
						message: "Authentication failed",
					},
					correlationId: c.get("correlationId"),
				},
				500,
			);
		}
	};
};
