import { Console, Context, Effect, Layer } from 'effect'
import { PostHogService } from './posthog.js'
import { SentryService } from './sentry.js'

export interface LogEntry {
  timestamp: string
  level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG'
  message: string
  correlationId?: string
  requestId?: string
  organizationId?: string
  userId?: string
  duration?: number
  error?: {
    name: string
    message: string
    stack?: string
  }
  metadata?: Record<string, unknown>
}

export interface LoggerService {
  readonly info: (message: string, metadata?: Record<string, unknown>) => Effect.Effect<void>
  readonly error: (message: string, error?: unknown, metadata?: Record<string, unknown>) => Effect.Effect<void>
  readonly warn: (message: string, metadata?: Record<string, unknown>) => Effect.Effect<void>
  readonly debug: (message: string, metadata?: Record<string, unknown>) => Effect.Effect<void>
  readonly withCorrelationId: (correlationId: string) => LoggerService
  readonly withRequestId: (requestId: string) => LoggerService
  readonly withContext: (context: Partial<Pick<LogEntry, 'organizationId' | 'userId'>>) => LoggerService
  readonly startTimer: () => Effect.Effect<() => number>
  readonly captureEvent: (eventName: string, properties?: Record<string, unknown>) => Effect.Effect<void>
  readonly setUserContext: (user: { id: string; email?: string; organizationId?: string }) => Effect.Effect<void>
}

export const LoggerService = Context.GenericTag<LoggerService>('LoggerService')

const formatLogEntry = (entry: LogEntry): string => {
  return JSON.stringify({
    timestamp: entry.timestamp,
    level: entry.level,
    message: entry.message,
    ...(entry.correlationId && { correlationId: entry.correlationId }),
    ...(entry.requestId && { requestId: entry.requestId }),
    ...(entry.organizationId && { organizationId: entry.organizationId }),
    ...(entry.userId && { userId: entry.userId }),
    ...(entry.duration !== undefined && { duration: entry.duration }),
    ...(entry.error && { error: entry.error }),
    ...(entry.metadata && Object.keys(entry.metadata).length > 0 && { metadata: entry.metadata }),
  })
}

const createLoggerInstance = (
  context: Partial<LogEntry> = {},
  sentryService?: SentryService,
  posthogService?: PostHogService
): LoggerService => {
  const logWithLevel = (
    level: LogEntry['level'],
    message: string,
    error?: unknown,
    metadata?: Record<string, unknown>
  ) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
      ...(error
        ? {
            error: {
              name: error instanceof Error ? error.name : 'Unknown',
              message: error instanceof Error ? error.message : String(error),
              ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
            },
          }
        : {}),
      ...(metadata && { metadata }),
    }

    const formattedLog = formatLogEntry(entry)

    const consoleLog =
      level === 'ERROR'
        ? Console.error(formattedLog)
        : level === 'WARN'
          ? Console.warn(formattedLog)
          : Console.log(formattedLog)

    const externalLogging = Effect.gen(function* () {
      if (sentryService && (level === 'ERROR' || level === 'WARN')) {
        if (error instanceof Error) {
          yield* sentryService.captureException(error, {
            correlationId: context.correlationId,
            requestId: context.requestId,
            organizationId: context.organizationId,
            userId: context.userId,
            ...metadata,
          })
        } else {
          yield* sentryService.captureMessage(message, level === 'ERROR' ? 'error' : 'warning', {
            correlationId: context.correlationId,
            requestId: context.requestId,
            organizationId: context.organizationId,
            userId: context.userId,
            ...metadata,
          })
        }

        yield* sentryService.addBreadcrumb({
          message,
          level: level.toLowerCase() as 'debug' | 'info' | 'warning' | 'error',
          timestamp: Date.now() / 1000,
          data: metadata,
        })
      }

      if (posthogService && metadata && context.organizationId) {
        if (
          level === 'INFO' &&
          (message.includes('completed') || message.includes('started') || message.includes('failed'))
        ) {
          yield* posthogService.capture({
            distinctId: context.organizationId,
            event: `log_${message.toLowerCase().replace(/\s+/g, '_')}`,
            properties: {
              level,
              message,
              correlationId: context.correlationId,
              requestId: context.requestId,
              userId: context.userId,
              ...metadata,
            },
            timestamp: new Date(entry.timestamp),
          })
        }
      }
    })

    return Effect.all([consoleLog, externalLogging], { concurrency: 'unbounded' }).pipe(Effect.map(() => void 0))
  }

  return {
    info: (message: string, metadata?: Record<string, unknown>) => logWithLevel('INFO', message, undefined, metadata),
    error: (message: string, error?: unknown, metadata?: Record<string, unknown>) =>
      logWithLevel('ERROR', message, error, metadata),
    warn: (message: string, metadata?: Record<string, unknown>) => logWithLevel('WARN', message, undefined, metadata),
    debug: (message: string, metadata?: Record<string, unknown>) => logWithLevel('DEBUG', message, undefined, metadata),
    withCorrelationId: (correlationId: string) =>
      createLoggerInstance({ ...context, correlationId }, sentryService, posthogService),
    withRequestId: (requestId: string) =>
      createLoggerInstance({ ...context, requestId }, sentryService, posthogService),
    withContext: (newContext: Partial<Pick<LogEntry, 'organizationId' | 'userId'>>) =>
      createLoggerInstance({ ...context, ...newContext }, sentryService, posthogService),
    startTimer: () =>
      Effect.gen(function* () {
        const startTime = Date.now()
        return () => Date.now() - startTime
      }),
    captureEvent: (eventName: string, properties?: Record<string, unknown>) =>
      Effect.gen(function* () {
        if (posthogService && context.organizationId) {
          yield* posthogService.capture({
            distinctId: context.organizationId,
            event: eventName,
            properties: {
              correlationId: context.correlationId,
              requestId: context.requestId,
              userId: context.userId,
              ...properties,
            },
          })
        }
      }),
    setUserContext: (user: { id: string; email?: string; organizationId?: string }) =>
      Effect.gen(function* () {
        if (sentryService) {
          yield* sentryService.setUser({
            id: user.id,
            email: user.email,
          })
          if (user.organizationId) {
            yield* sentryService.setTag('organizationId', user.organizationId)
          }
        }
        if (posthogService) {
          yield* posthogService.identify(user.organizationId || user.id, {
            userId: user.id,
            email: user.email,
            organizationId: user.organizationId,
          })
        }
      }),
  }
}

const make = Effect.gen(function* () {
  const sentryService = yield* SentryService
  const posthogService = yield* PostHogService
  return createLoggerInstance({}, sentryService, posthogService)
})

export const LoggerServiceLive = Layer.effect(LoggerService, make)

const makeBasic = Effect.succeed(createLoggerInstance({}))

export const LoggerServiceBasic = Layer.effect(LoggerService, makeBasic)
