/**
 * Centralized Logger for ODAVL Studio Hub
 * Replaces console.log/error/warn for better production logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  userId?: string;
  orgId?: string;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isTest = process.env.NODE_ENV === 'test';

  /**
   * Format log message with timestamp and context
   */
  private format(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}]${contextStr} ${message}`;
  }

  /**
   * Log debug message (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment && !this.isTest) {
      console.log(this.format('debug', message, context));
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    if (!this.isTest) {
      console.log(this.format('info', message, context));
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    if (!this.isTest) {
      console.warn(this.format('warn', message, context));
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.isTest) {
      const errorDetails = error instanceof Error 
        ? { message: error.message, stack: error.stack, name: error.name }
        : error;
      
      console.error(this.format('error', message, { ...context, error: errorDetails }));
    }
  }

  /**
   * Log success message with emoji (development)
   */
  success(message: string, context?: LogContext): void {
    if (this.isDevelopment && !this.isTest) {
      console.log(`✅ ${this.format('info', message, context)}`);
    } else if (!this.isTest) {
      this.info(message, context);
    }
  }

  /**
   * Log with custom emoji prefix
   */
  emoji(emoji: string, message: string, context?: LogContext): void {
    if (this.isDevelopment && !this.isTest) {
      console.log(`${emoji} ${this.format('info', message, context)}`);
    } else if (!this.isTest) {
      this.info(message, context);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing
export { Logger };
