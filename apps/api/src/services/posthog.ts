import { Context, Effect, Layer } from "effect";
import { PostHog } from "posthog-node";
import { ConfigService } from "./config.js";

export interface PostHogEvent {
	distinctId: string;
	event: string;
	properties?: Record<string, unknown>;
	timestamp?: Date;
}

export interface PostHogService {
	readonly capture: (event: PostHogEvent) => Effect.Effect<void>;
	readonly identify: (
		distinctId: string,
		properties?: Record<string, unknown>,
	) => Effect.Effect<void>;
	readonly setPersonProperties: (
		distinctId: string,
		properties: Record<string, unknown>,
	) => Effect.Effect<void>;
	readonly alias: (distinctId: string, alias: string) => Effect.Effect<void>;
	readonly isFeatureEnabled: (
		flag: string,
		distinctId: string,
	) => Effect.Effect<boolean, Error>;
	readonly shutdown: () => Effect.Effect<void, Error>;
}

export const PostHogService =
	Context.GenericTag<PostHogService>("PostHogService");

const make = Effect.gen(function* () {
	const config = yield* ConfigService;

	let client: PostHog | null = null;

	if (config.posthogApiKey) {
		client = new PostHog(config.posthogApiKey, {
			host: config.posthogHost,
			flushAt: config.nodeEnv === "production" ? 20 : 1,
			flushInterval: config.nodeEnv === "production" ? 10000 : 1000,
		});
	}

	return {
		capture: (event: PostHogEvent) =>
			Effect.sync(() => {
				if (client) {
					client.capture({
						distinctId: event.distinctId,
						event: event.event,
						properties: {
							...event.properties,
							$timestamp: event.timestamp || new Date(),
							environment: config.nodeEnv,
							service: "recruit-seeds-api",
							version: process.env.npm_package_version,
						},
					});
				}
			}),

		identify: (distinctId: string, properties?: Record<string, unknown>) =>
			Effect.sync(() => {
				if (client) {
					client.identify({
						distinctId,
						properties: {
							...properties,
							environment: config.nodeEnv,
							last_seen: new Date().toISOString(),
						},
					});
				}
			}),

		setPersonProperties: (
			distinctId: string,
			properties: Record<string, unknown>,
		) =>
			Effect.sync(() => {
				if (client) {
					client.identify({
						distinctId,
						properties: {
							...properties,
							updated_at: new Date().toISOString(),
						},
					});
				}
			}),

		alias: (distinctId: string, alias: string) =>
			Effect.sync(() => {
				if (client) {
					client.alias({
						distinctId,
						alias,
					});
				}
			}),

		isFeatureEnabled: (flag: string, distinctId: string) =>
			Effect.tryPromise({
				try: async () => {
					if (client) {
						const result = await client.isFeatureEnabled(flag, distinctId);
						return result ?? false;
					}
					return false;
				},
				catch: () => new Error(`Failed to check feature flag: ${flag}`),
			}),

		shutdown: () =>
			Effect.tryPromise({
				try: async () => {
					if (client) {
						await client.shutdown();
					}
				},
				catch: (error) => new Error(`Failed to shutdown PostHog: ${error}`),
			}),
	} satisfies PostHogService;
});

export const PostHogServiceLive = Layer.effect(PostHogService, make);

export const ResumeParsingEvents = {
	RESUME_PARSE_STARTED: "resume_parse_started",
	RESUME_PARSE_COMPLETED: "resume_parse_completed",
	RESUME_PARSE_FAILED: "resume_parse_failed",
	SKILL_MATCHING_COMPLETED: "skill_matching_completed",
	CANDIDATE_AUTO_REJECTED: "candidate_auto_rejected",
	CANDIDATE_AUTO_ADVANCED: "candidate_auto_advanced",
	AI_API_ERROR: "ai_api_error",
	AI_API_RATE_LIMITED: "ai_api_rate_limited",
} as const;

export type ResumeParsingEventType =
	(typeof ResumeParsingEvents)[keyof typeof ResumeParsingEvents];
