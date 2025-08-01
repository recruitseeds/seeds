import { Effect } from 'effect'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoggerService, LoggerServiceBasic } from '../../../src/services/logger.js'

describe('LoggerService', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('should log info messages with structured format', async () => {
    const program = Effect.gen(function* () {
      const logger = yield* LoggerService
      yield* logger.info('Test message', { key: 'value' })
    })

    await Effect.runPromise(Effect.provide(program, LoggerServiceBasic))

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"level":"INFO"'))
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"message":"Test message"'))
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"metadata":{"key":"value"}'))
  })

  it('should include correlation ID when provided', async () => {
    const program = Effect.gen(function* () {
      const logger = yield* LoggerService
      const contextLogger = logger.withCorrelationId('test-correlation-id')
      yield* contextLogger.info('Test message')
    })

    await Effect.runPromise(Effect.provide(program, LoggerServiceBasic))

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"correlationId":"test-correlation-id"'))
  })

  it('should track timing correctly', async () => {
    const program = Effect.gen(function* () {
      const logger = yield* LoggerService
      const getTimer = yield* logger.startTimer()

      yield* Effect.sleep(10)

      const duration = getTimer()
      expect(duration).toBeGreaterThan(5)
    })

    await Effect.runPromise(Effect.provide(program, LoggerServiceBasic))
  })

  it('should format errors properly', async () => {
    const error = new Error('Test error')
    const program = Effect.gen(function* () {
      const logger = yield* LoggerService
      yield* logger.error('Error occurred', error)
    })

    await Effect.runPromise(Effect.provide(program, LoggerServiceBasic))

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"error":{"name":"Error","message":"Test error"')
    )
  })

  it('should chain context correctly', async () => {
    const program = Effect.gen(function* () {
      const logger = yield* LoggerService
      const contextLogger = logger
        .withCorrelationId('correlation-123')
        .withRequestId('request-456')
        .withContext({ organizationId: 'org-789', userId: 'user-abc' })

      yield* contextLogger.info('Contextual message')
    })

    await Effect.runPromise(Effect.provide(program, LoggerServiceBasic))

    const logCall = consoleSpy.mock.calls[0][0]
    expect(logCall).toContain('"correlationId":"correlation-123"')
    expect(logCall).toContain('"requestId":"request-456"')
    expect(logCall).toContain('"organizationId":"org-789"')
    expect(logCall).toContain('"userId":"user-abc"')
  })
})
