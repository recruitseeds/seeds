export interface LogEntry {
  timestamp: string
  level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG'
  message: string
  correlationId?: string
  requestId?: string
  organizationId?: string
  userId?: string
  duration?: number
  action?: string
  candidateId?: string
  jobId?: string
  companyId?: string
  error?: {
    name: string
    message: string
    stack?: string
  }
  metadata?: Record<string, unknown>
}

export class Logger {
  private context: Partial<LogEntry>

  constructor(context: Partial<LogEntry> = {}) {
    this.context = context
  }

  private log(level: LogEntry['level'], message: string, error?: unknown, metadata?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
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

    console.log(JSON.stringify(entry))
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('INFO', message, undefined, metadata)
  }

  error(message: string, error?: unknown, metadata?: Record<string, unknown>): void {
    this.log('ERROR', message, error, metadata)
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('WARN', message, undefined, metadata)
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('DEBUG', message, undefined, metadata)
  }

  withCorrelationId(correlationId: string): Logger {
    return new Logger({ ...this.context, correlationId })
  }

  withRequestId(requestId: string): Logger {
    return new Logger({ ...this.context, requestId })
  }

  withContext(context: Partial<Pick<LogEntry, 'organizationId' | 'userId'>>): Logger {
    return new Logger({ ...this.context, ...context })
  }

  startTimer(): () => number {
    const startTime = Date.now()
    return () => Date.now() - startTime
  }
}