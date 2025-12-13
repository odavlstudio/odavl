/**
 * Error Presenter - Phase 4.1.5
 * 
 * Centralized error handling that presents attributed errors with:
 * - No spam: Max 1 toast per error kind per session
 * - No stack traces: User-facing messages only
 * - Clear responsibility: INSIGHT vs USER vs EXTERNAL
 * - Actionable suggestions: For USER errors
 * 
 * INSIGHT errors get one error toast (our fault).
 * USER errors get warning toast with fix suggestion.
 * EXTERNAL errors get logged only (status bar shows mode).
 */

import * as vscode from 'vscode';
import { InsightError, InsightErrorKind } from '../core/errors';

/**
 * Error presentation options
 */
interface ErrorPresenterOptions {
  /**
   * Output channel for detailed logging
   */
  outputChannel?: vscode.OutputChannel;
  
  /**
   * Suppress toasts (for background operations)
   */
  silent?: boolean;
}

/**
 * Centralized error presenter with deduplication
 */
export class ErrorPresenter {
  private outputChannel?: vscode.OutputChannel;
  
  // Deduplication: Track shown errors per session
  private shownErrors = new Set<string>();
  
  constructor(options?: ErrorPresenterOptions) {
    this.outputChannel = options?.outputChannel;
  }
  
  /**
   * Present error with appropriate UI based on attribution
   */
  async present(error: unknown, context?: string): Promise<void> {
    // Convert to InsightError for attribution
    const insightError = InsightError.isInsightError(error)
      ? error
      : InsightError.from(error);
    
    // Log to output channel (always, with full details)
    this.logToOutput(insightError, context);
    
    // Show toast based on error kind (with deduplication)
    await this.showToast(insightError, context);
  }
  
  /**
   * Log error to output channel with full details
   */
  private logToOutput(error: InsightError, context?: string): void {
    if (!this.outputChannel) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const prefix = context ? `[${context}]` : '[Error]';
    
    this.outputChannel.appendLine(`${timestamp} ${prefix} [${error.kind}] ${error.message}`);
    
    if (error.suggestion) {
      this.outputChannel.appendLine(`  Suggestion: ${error.suggestion}`);
    }
    
    if (error.cause) {
      this.outputChannel.appendLine(`  Caused by: ${error.cause.message}`);
      if (error.cause.stack) {
        this.outputChannel.appendLine(`  Stack: ${error.cause.stack}`);
      }
    }
  }
  
  /**
   * Show toast notification (with deduplication)
   */
  private async showToast(error: InsightError, context?: string): Promise<void> {
    // Generate deduplication key
    const dedupeKey = `${error.kind}:${error.message}`;
    
    // Skip if already shown in this session
    if (this.shownErrors.has(dedupeKey)) {
      return;
    }
    
    // Mark as shown
    this.shownErrors.add(dedupeKey);
    
    // Present based on error kind
    switch (error.kind) {
      case 'INSIGHT':
        await this.presentInsightError(error, context);
        break;
        
      case 'USER':
        await this.presentUserError(error, context);
        break;
        
      case 'EXTERNAL':
        // No toast for external errors - rely on status bar (Offline mode)
        // and output channel logging
        break;
    }
  }
  
  /**
   * Present INSIGHT error (our bug)
   */
  private async presentInsightError(error: InsightError, context?: string): Promise<void> {
    const message = context
      ? `${context}: ${error.message}`
      : error.message;
    
    const action = await vscode.window.showErrorMessage(
      message,
      'View Logs',
      'Report Bug'
    );
    
    if (action === 'View Logs' && this.outputChannel) {
      this.outputChannel.show();
    } else if (action === 'Report Bug') {
      // Open GitHub issue page
      vscode.env.openExternal(
        vscode.Uri.parse('https://github.com/odavlstudio/odavl/issues/new?labels=bug,insight-vscode&template=bug_report.md')
      );
    }
  }
  
  /**
   * Present USER error (configuration/environment issue)
   */
  private async presentUserError(error: InsightError, context?: string): Promise<void> {
    const message = context
      ? `${context}: ${error.message}`
      : error.message;
    
    const actions: string[] = [];
    
    if (error.suggestion) {
      actions.push('Show Fix');
    }
    
    actions.push('View Logs');
    
    const action = await vscode.window.showWarningMessage(
      message,
      ...actions
    );
    
    if (action === 'Show Fix' && error.suggestion) {
      vscode.window.showInformationMessage(error.suggestion);
    } else if (action === 'View Logs' && this.outputChannel) {
      this.outputChannel.show();
    }
  }
  
  /**
   * Clear deduplication cache (e.g., on new analysis)
   */
  clearCache(): void {
    this.shownErrors.clear();
  }
  
  /**
   * Set output channel for logging
   */
  setOutputChannel(channel: vscode.OutputChannel): void {
    this.outputChannel = channel;
  }
  
  /**
   * Check if specific error has been shown
   */
  hasShown(kind: InsightErrorKind, message: string): boolean {
    return this.shownErrors.has(`${kind}:${message}`);
  }
}

/**
 * Global error presenter instance
 * 
 * Initialized in extension activation, shared across services
 */
let globalPresenter: ErrorPresenter | undefined;

/**
 * Initialize global error presenter
 */
export function initErrorPresenter(outputChannel: vscode.OutputChannel): ErrorPresenter {
  globalPresenter = new ErrorPresenter({ outputChannel });
  return globalPresenter;
}

/**
 * Get global error presenter
 */
export function getErrorPresenter(): ErrorPresenter {
  if (!globalPresenter) {
    throw new Error('ErrorPresenter not initialized - call initErrorPresenter first');
  }
  return globalPresenter;
}
