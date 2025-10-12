import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class Logger {
  private readonly logPath: string;
  private readonly outputChannel: vscode.OutputChannel;

  constructor(workspaceRoot?: string) {
    this.outputChannel = vscode.window.createOutputChannel('ODAVL Control');
    this.logPath = workspaceRoot 
      ? path.join(workspaceRoot, '.odavl', 'logs', 'control.log')
      : '';
    
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (this.logPath) {
      try {
        const logDir = path.dirname(this.logPath);
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
      } catch (error) {
        console.error('Failed to create log directory:', error);
      }
    }
  }

  private formatMessage(level: string, message: string, source?: string): string {
    const timestamp = new Date().toISOString();
    const sourceInfo = source ? ` [${source}]` : '';
    return `${timestamp} [${level}]${sourceInfo} ${message}`;
  }

  private writeToFile(message: string): void {
    if (this.logPath) {
      try {
        fs.appendFileSync(this.logPath, message + '\n');
      } catch (error) {
        console.error('Failed to write to log file:', error);
      }
    }
  }

  info(message: string, source?: string): void {
    const formatted = this.formatMessage('INFO', message, source);
    this.outputChannel.appendLine(formatted);
    this.writeToFile(formatted);
  }

  warn(message: string, source?: string): void {
    const formatted = this.formatMessage('WARN', message, source);
    this.outputChannel.appendLine(formatted);
    this.writeToFile(formatted);
  }

  error(message: string, source?: string, error?: Error): void {
    const errorInfo = error ? ` - ${error.message}` : '';
    const formatted = this.formatMessage('ERROR', message + errorInfo, source);
    this.outputChannel.appendLine(formatted);
    this.writeToFile(formatted);
    
    if (error?.stack) {
      this.outputChannel.appendLine(error.stack);
      this.writeToFile(error.stack);
    }
  }

  debug(message: string, source?: string): void {
    const formatted = this.formatMessage('DEBUG', message, source);
    this.outputChannel.appendLine(formatted);
    this.writeToFile(formatted);
  }

  success(message: string, source?: string): void {
    const formatted = this.formatMessage('SUCCESS', message, source);
    this.outputChannel.appendLine(formatted);
    this.writeToFile(formatted);
  }

  show(): void {
    this.outputChannel.show();
  }

  dispose(): void {
    this.outputChannel.dispose();
  }
}