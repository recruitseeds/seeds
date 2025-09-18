export interface CloudflareR2Config {
	readonly accountId: string;
	readonly accessKeyId: string;
	readonly secretAccessKey: string;
	readonly bucketName: string;
}

export interface Config {
	readonly openaiApiKey: string;
	readonly supabaseUrl: string;
	readonly supabaseAnonKey: string;
	readonly supabaseServiceRoleKey: string;
	readonly port: number;
	readonly nodeEnv: string;
	readonly sentryDsn?: string;
	readonly posthogApiKey?: string;
	readonly posthogHost?: string;
	readonly unkeyApiKey?: string;
	readonly unkeyAppId?: string;
	readonly resendApiKey?: string;
	readonly defaultFromEmail?: string;
	readonly internalApiSecret?: string;
	readonly jwtSecret?: string;
	readonly cloudflareR2: CloudflareR2Config;
}

export class ConfigService {
	private static instance: ConfigService;
	private config: Config;

	private constructor() {
		const openaiApiKey = process.env.OPENAI_API_KEY;
		const supabaseUrl =
			process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
		const supabaseAnonKey =
			process.env.SUPABASE_ANON_KEY ||
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
		const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

		const cloudflareR2AccountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
		const cloudflareR2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
		const cloudflareR2SecretAccessKey =
			process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
		const cloudflareR2BucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

		if (!openaiApiKey) {
			throw new Error("OPENAI_API_KEY environment variable is required");
		}

		if (!supabaseUrl || !supabaseAnonKey) {
			throw new Error("Supabase environment variables are required");
		}

		if (!supabaseServiceRoleKey) {
			throw new Error(
				"SUPABASE_SERVICE_ROLE_KEY environment variable is required",
			);
		}

		if (
			!cloudflareR2AccountId ||
			!cloudflareR2AccessKeyId ||
			!cloudflareR2SecretAccessKey ||
			!cloudflareR2BucketName
		) {
			throw new Error("Cloudflare R2 environment variables are required");
		}

		this.config = {
			openaiApiKey,
			supabaseUrl,
			supabaseAnonKey,
			supabaseServiceRoleKey,
			port: process.env.PORT ? Number.parseInt(process.env.PORT) : 3001,
			nodeEnv: process.env.NODE_ENV || "development",
			sentryDsn: process.env.SENTRY_DSN,
			posthogApiKey: process.env.POSTHOG_API_KEY,
			posthogHost: process.env.POSTHOG_HOST || "https://app.posthog.com",
			unkeyApiKey: process.env.UNKEY_API_KEY,
			unkeyAppId: process.env.UNKEY_APP_ID,
			resendApiKey: process.env.RESEND_API_KEY,
			defaultFromEmail: process.env.DEFAULT_FROM_EMAIL,
			internalApiSecret: process.env.INTERNAL_API_SECRET,
			jwtSecret: process.env.JWT_SECRET,
			cloudflareR2: {
				accountId: cloudflareR2AccountId,
				accessKeyId: cloudflareR2AccessKeyId,
				secretAccessKey: cloudflareR2SecretAccessKey,
				bucketName: cloudflareR2BucketName,
			},
		};
	}

	static getInstance(): ConfigService {
		if (!ConfigService.instance) {
			ConfigService.instance = new ConfigService();
		}
		return ConfigService.instance;
	}

	getConfig(): Config {
		return this.config;
	}
}
