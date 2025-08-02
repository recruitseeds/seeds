import { rateLimiter } from "hono-rate-limiter";
import type { Context, Next } from "hono";

const RATE_LIMITS = {
	free: { requests: 100, windowMs: 60 * 60 * 1000 },
	pro: { requests: 1000, windowMs: 60 * 60 * 1000 },
	enterprise: { requests: 10000, windowMs: 60 * 60 * 1000 },
} as const;

export const createRateLimiter = (tier: keyof typeof RATE_LIMITS = "free") => {
	const config = RATE_LIMITS[tier];
	
	return rateLimiter({
		windowMs: config.windowMs,
		limit: config.requests,
		standardHeaders: "draft-6",
		keyGenerator: (c: Context) => {
			const apiKeyOwner = c.get("apiKeyOwner");
			if (apiKeyOwner) {
				return apiKeyOwner;
			}
			
			return c.req.header("cf-connecting-ip") || 
				   c.req.header("x-forwarded-for") || 
				   c.req.header("x-real-ip") || 
				   "unknown";
		},
		handler: (c: Context) => {
			return c.json(
				{
					success: false,
					error: {
						code: "RATE_LIMIT_EXCEEDED",
						message: `Rate limit exceeded. Maximum ${config.requests} requests per hour allowed.`,
						details: {
							limit: config.requests,
							windowMs: config.windowMs,
							resetTime: new Date(Date.now() + config.windowMs).toISOString(),
						},
					},
					correlationId: c.get("correlationId"),
				},
				429,
				{
					"Retry-After": Math.ceil(config.windowMs / 1000).toString(),
				}
			);
		},
	});
};

// Specific rate limiters for different use cases
export const defaultRateLimit = createRateLimiter("free");
export const proRateLimit = createRateLimiter("pro");
export const enterpriseRateLimit = createRateLimiter("enterprise");

// Adaptive rate limiter that checks API key tier
export const adaptiveRateLimit = () => {
	return async (c: Context, next: Next) => {
		const apiKeyMeta = c.get("apiKeyMeta") as { tier?: string } | undefined;
		const tier = (apiKeyMeta?.tier as keyof typeof RATE_LIMITS) || "free";
		
		const rateLimiter = createRateLimiter(tier);
		return rateLimiter(c, next);
	};
};