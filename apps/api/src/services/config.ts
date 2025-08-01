import { Context, Effect, Layer } from 'effect'

export interface ConfigService {
  readonly openaiApiKey: string
  readonly supabaseUrl: string
  readonly supabaseAnonKey: string
  readonly port: number
  readonly nodeEnv: string
  readonly sentryDsn?: string
  readonly posthogApiKey?: string
  readonly posthogHost?: string
}

export const ConfigService = Context.GenericTag<ConfigService>('ConfigService')

const make = Effect.gen(function* () {
  const openaiApiKey = process.env.OPENAI_API_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!openaiApiKey) {
    yield* Effect.fail(new Error('OPENAI_API_KEY environment variable is required'))
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    yield* Effect.fail(new Error('Supabase environment variables are required'))
  }

  return {
    openaiApiKey: openaiApiKey as string,
    supabaseUrl: supabaseUrl as string,
    supabaseAnonKey: supabaseAnonKey as string,
    port: process.env.PORT ? Number.parseInt(process.env.PORT) : 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    sentryDsn: process.env.SENTRY_DSN,
    posthogApiKey: process.env.POSTHOG_API_KEY,
    posthogHost: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
  } satisfies ConfigService
})

export const ConfigServiceLive = Layer.effect(ConfigService, make)
