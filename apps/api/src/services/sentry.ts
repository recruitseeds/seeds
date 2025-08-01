import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import { Context, Effect, Layer } from 'effect'
import { ConfigService } from './config.js'

export interface SentryService {
  readonly captureException: (error: Error, extra?: Record<string, unknown>) => Effect.Effect<void>
  readonly captureMessage: (
    message: string,
    level?: Sentry.SeverityLevel,
    extra?: Record<string, unknown>
  ) => Effect.Effect<void>
  readonly setUser: (user: { id?: string; email?: string; username?: string }) => Effect.Effect<void>
  readonly setTag: (key: string, value: string) => Effect.Effect<void>
  readonly setContext: (name: string, context: Record<string, unknown>) => Effect.Effect<void>
  readonly startTransaction: (name: string, op?: string) => Effect.Effect<unknown>
  readonly addBreadcrumb: (breadcrumb: Sentry.Breadcrumb) => Effect.Effect<void>
}

export const SentryService = Context.GenericTag<SentryService>('SentryService')

const make = Effect.gen(function* () {
  const config = yield* ConfigService

  if (config.sentryDsn) {
    Sentry.init({
      dsn: config.sentryDsn,
      environment: config.nodeEnv,
      integrations: [nodeProfilingIntegration(), Sentry.httpIntegration(), Sentry.expressIntegration()],
      tracesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0,
      profilesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0,
      release: process.env.npm_package_version,
      beforeSend: (event) => {
        if (config.nodeEnv === 'development' && event.level === 'warning') {
          return null
        }
        return event
      },
    })
  }

  return {
    captureException: (error: Error, extra?: Record<string, unknown>) =>
      Effect.sync(() => {
        if (config.sentryDsn) {
          Sentry.withScope((scope) => {
            if (extra) {
              for (const [key, value] of Object.entries(extra)) {
                scope.setExtra(key, value)
              }
            }
            Sentry.captureException(error)
          })
        }
      }),

    captureMessage: (message: string, level: Sentry.SeverityLevel = 'info', extra?: Record<string, unknown>) =>
      Effect.sync(() => {
        if (config.sentryDsn) {
          Sentry.withScope((scope) => {
            if (extra) {
              for (const [key, value] of Object.entries(extra)) {
                scope.setExtra(key, value)
              }
            }
            Sentry.captureMessage(message, level)
          })
        }
      }),

    setUser: (user: { id?: string; email?: string; username?: string }) =>
      Effect.sync(() => {
        if (config.sentryDsn) {
          Sentry.setUser(user)
        }
      }),

    setTag: (key: string, value: string) =>
      Effect.sync(() => {
        if (config.sentryDsn) {
          Sentry.setTag(key, value)
        }
      }),

    setContext: (name: string, context: Record<string, unknown>) =>
      Effect.sync(() => {
        if (config.sentryDsn) {
          Sentry.setContext(name, context)
        }
      }),

    startTransaction: (name: string, op = 'http.server') =>
      Effect.sync(() => {
        if (config.sentryDsn) {
          return Sentry.startSpan({ name, op }, (span) => span)
        }
        return {
          finish: () => {},
          setTag: () => {},
          setData: () => {},
          setStatus: () => {},
        }
      }),

    addBreadcrumb: (breadcrumb: Sentry.Breadcrumb) =>
      Effect.sync(() => {
        if (config.sentryDsn) {
          Sentry.addBreadcrumb(breadcrumb)
        }
      }),
  } satisfies SentryService
})

export const SentryServiceLive = Layer.effect(SentryService, make)
