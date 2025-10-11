/**
 * Enhanced Logging Service for ODAVL Studio
 * 
 * Enterprise-grade logging with structured output, multiple levels,
 * and integration with VS Code's output channels.
 */

import * as vscode from 'vscode';

export interface LogEntry {
    timestamp: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    context?: Record<string, any>;
    error?: {
        message: string;
        stack?: string;
    };
}

export class LoggingService {
    private outputChannel: vscode.OutputChannel;
    private logBuffer: LogEntry[] = [];
    private maxBufferSize = 1000;

    constructor(private context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('ODAVL Studio Enhanced');
        this.context.subscriptions.push(this.outputChannel);
    }

    async initialize(): Promise<void> {
        this.info('LoggingService initialized');
    }

    debug(message: string, context?: Record<string, any>): void {
        this.log('debug', message, context);
    }

    info(message: string, context?: Record<string, any>): void {
        this.log('info', message, context);
    }

    warn(message: string, context?: Record<string, any>): void {
        this.log('warn', message, context);
    }

    error(message: string, context?: Record<string, any>): void {
        this.log('error', message, context);
    }

    private log(level: LogEntry['level'], message: string, context?: Record<string, any>): void {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...(context && { context })
        };

        this.logBuffer.push(entry);
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.shift();
        }

        const formatted = this.formatLogEntry(entry);
        this.outputChannel.appendLine(formatted);

        if (level === 'error') {
            console.error(formatted);
        }
    }

    private formatLogEntry(entry: LogEntry): string {
        const timestamp = entry.timestamp.substring(11, 23); // HH:mm:ss.SSS
        const level = entry.level.toUpperCase().padEnd(5);
        let formatted = `[${timestamp}] ${level} ${entry.message}`;
        
        if (entry.context) {
            formatted += ` | ${JSON.stringify(entry.context)}`;
        }
        
        return formatted;
    }

    getRecentLogs(count: number = 100): LogEntry[] {
        return this.logBuffer.slice(-count);
    }

    async dispose(): Promise<void> {
        this.outputChannel.dispose();
    }
}