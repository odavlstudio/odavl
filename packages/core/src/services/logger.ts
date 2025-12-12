/**
 * Logger Service Stub
 * 
 * Original implementation used winston logging library.
 * Replaced with stub to avoid dependency installation.
 * studio-hub uses app-specific logging at apps/studio-hub/lib/logger.ts
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogMetadata {
  [key: string]: any;
}

export class Logger {
  constructor(private context: string = 'App') {}

  error(message: string, meta?: LogMetadata): void {
    console.error(`[${this.context}] ERROR: ${message}`, meta || '');
  }

  warn(message: string, meta?: LogMetadata): void {
    console.warn(`[${this.context}] WARN: ${message}`, meta || '');
  }

  info(message: string, meta?: LogMetadata): void {
    console.info(`[${this.context}] INFO: ${message}`, meta || '');
  }

  debug(message: string, meta?: LogMetadata): void {
    console.debug(`[${this.context}] DEBUG: ${message}`, meta || '');
  }

  log(level: LogLevel, message: string, meta?: LogMetadata): void {
    switch (level) {
      case LogLevel.ERROR:
        this.error(message, meta);
        break;
      case LogLevel.WARN:
        this.warn(message, meta);
        break;
      case LogLevel.INFO:
        this.info(message, meta);
        break;
      case LogLevel.DEBUG:
        this.debug(message, meta);
        break;
    }
  }
}

export const logger = new Logger('ODAVL');
