/**
 * ODAVL Telemetry — Structured Logger
 * Google Cloud–grade JSON logging with levels
 * Output: .odavl/logs/odavl.log
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
  product?: 'insight' | 'autopilot' | 'guardian' | 'cli';
}

export class Logger {
  private logPath: string;

  constructor(workspaceRoot: string = process.cwd()) {
    const logsDir = join(workspaceRoot, '.odavl', 'logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }
    this.logPath = join(logsDir, 'odavl.log');
  }

  private write(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta && { meta })
    };
    const line = JSON.stringify(entry) + '\n';
    writeFileSync(this.logPath, line, { flag: 'a' });
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.write('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.write('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.write('error', message, meta);
  }
}
