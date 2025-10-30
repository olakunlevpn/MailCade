/**
 * Logger utility for consistent logging across the application
 */

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class Logger {
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production'
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString()
    const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : ''
    return `[${timestamp}] [${level}] ${message}${formattedArgs}`
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, ...args))
    }
  }

  info(message: string, ...args: unknown[]): void {
    console.info(this.formatMessage(LogLevel.INFO, message, ...args))
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, ...args))
  }

  error(message: string, error?: unknown, ...args: unknown[]): void {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : ''
    console.error(
      this.formatMessage(LogLevel.ERROR, message, errorMessage, ...args),
      stack ? `\n${stack}` : ''
    )
  }
}

export const logger = new Logger()
