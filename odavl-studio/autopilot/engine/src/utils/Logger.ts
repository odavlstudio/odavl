/**
 * ODAVL CLI Logger
 * Production-ready logging utility with levels and timestamps
 * Prevents security issues from console.log in production
 * 
 * @module Logger
 * @version 1.0.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: unknown;
}

class Logger {
    private isDebugMode: boolean;
    private logFile?: string;

    constructor() {
        this.isDebugMode = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';

        // Initialize log file in .odavl/logs/
        try {
            const logDir = path.join(process.cwd(), '.odavl', 'logs');
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            this.logFile = path.join(logDir, 'cli.log');
        } catch {
            // If .odavl/logs/ can't be created, log to console only
            this.logFile = undefined;
        }
    }

    /**
     * Format log entry with timestamp and level
     */
    private format(level: LogLevel, message: string, data?: unknown): string {
        const timestamp = new Date().toISOString();
        const entry: LogEntry = { timestamp, level, message, data };
        return JSON.stringify(entry);
    }

    /**
     * Write to log file (async, non-blocking)
     */
    private writeToFile(content: string): void {
        if (!this.logFile) return;

        try {
            fs.appendFileSync(this.logFile, content + '\n', 'utf8');
        } catch {
            // Fail silently - don't crash app on logging errors
        }
    }

    /**
     * Debug logging - only in DEBUG mode
     */
    debug(message: string, data?: unknown): void {
        if (this.isDebugMode) {
            const formatted = `🔍 [DEBUG] ${message}`;
            process.stdout.write(formatted + '\n');
            this.writeToFile(this.format('debug', message, data));
        }
    }

    /**
     * Info logging - only in DEBUG mode
     */
    info(message: string, data?: unknown): void {
        if (this.isDebugMode) {
            const formatted = `ℹ️  [INFO] ${message}`;
            process.stdout.write(formatted + '\n');
            this.writeToFile(this.format('info', message, data));
        }
    }

    /**
     * Warning logging - always shown
     */
    warn(message: string, data?: unknown): void {
        const formatted = `⚠️  [WARN] ${message}`;
        process.stderr.write(formatted + '\n');
        this.writeToFile(this.format('warn', message, data));
    }

    /**
     * Error logging - always shown
     */
    error(message: string, error?: unknown): void {
        const formatted = `❌ [ERROR] ${message}`;
        process.stderr.write(formatted + '\n');
        this.writeToFile(this.format('error', message, error));
    }

    /**
     * Success logging - only in DEBUG mode
     */
    success(message: string, data?: unknown): void {
        if (this.isDebugMode) {
            const formatted = `✅ [SUCCESS] ${message}`;
            process.stdout.write(formatted + '\n');
            this.writeToFile(this.format('success', message, data));
        }
    }

    /**
     * Production-safe log - always writes to file, only prints in debug mode
     */
    log(message: string, data?: unknown): void {
        this.writeToFile(this.format('info', message, data));
        if (this.isDebugMode) {
            process.stdout.write(message + '\n');
        }
    }
}

// Singleton instance
export const logger = new Logger();
