import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

beforeAll(async () => {
	process.env.NODE_ENV = "test";
	process.env.OPENAI_API_KEY = "test-key";
	process.env.SUPABASE_URL = "https:
	process.env.SUPABASE_ANON_KEY = "test-anon-key";
	process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
	process.env.UNKEY_API_KEY = "test-unkey-key";
	process.env.UNKEY_APP_ID = "test-app-id";
	process.env.SENTRY_DSN = "https:
	process.env.POSTHOG_API_KEY = "test-posthog-key";
	process.env.PORT = "3001";
});

afterAll(async () => {});

beforeEach(async () => {});

afterEach(async () => {});
