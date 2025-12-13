/**
 * Error Attribution System - Phase 4.1.5
 * 
 * Eliminates generic "analysis failed" errors by clearly attributing failures to:
 * 1. INSIGHT - Our bug (detector crash, internal error)
 * 2. USER - Misconfiguration, missing CLI, environment issue
 * 3. EXTERNAL - Network failure, cloud unavailable
 * 
 * This enables context-appropriate error handling without spam.
 */

/**
 * Error category for attribution
 */
export type InsightErrorKind = 'INSIGHT' | 'USER' | 'EXTERNAL';

/**
 * Attributed error with clear responsibility
 */
export class InsightError extends Error {
  /**
   * Error category - determines UI handling
   */
  readonly kind: InsightErrorKind;
  
  /**
   * User-facing error message (no stack traces, calm language)
   */
  override readonly message: string;
  
  /**
   * Original error (optional, for logging only)
   */
  readonly cause?: Error;
  
  /**
   * Actionable suggestion for USER errors (optional)
   */
  readonly suggestion?: string;

  constructor(
    kind: InsightErrorKind,
    message: string,
    options?: {
      cause?: Error;
      suggestion?: string;
    }
  ) {
    super(message);
    this.name = 'InsightError';
    this.kind = kind;
    this.message = message;
    this.cause = options?.cause;
    this.suggestion = options?.suggestion;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InsightError);
    }
  }
  
  /**
   * Factory: Detector crash (INSIGHT error)
   */
  static detectorCrash(detectorName: string, cause?: Error): InsightError {
    return new InsightError(
      'INSIGHT',
      `Detector "${detectorName}" crashed - this is a bug in Insight, not your code.`,
      { cause }
    );
  }
  
  /**
   * Factory: Invalid configuration (USER error)
   */
  static invalidConfig(reason: string, suggestion?: string): InsightError {
    return new InsightError(
      'USER',
      `Configuration error: ${reason}`,
      { suggestion: suggestion || 'Check your workspace settings or .odavl/config.json' }
    );
  }
  
  /**
   * Factory: Missing CLI tool (USER error)
   */
  static missingCLI(tool: string): InsightError {
    return new InsightError(
      'USER',
      `Required tool "${tool}" not found in PATH`,
      { suggestion: `Install ${tool} or disable the detector that requires it` }
    );
  }
  
  /**
   * Factory: Cloud API failure (EXTERNAL error)
   */
  static cloudUnavailable(cause?: Error): InsightError {
    return new InsightError(
      'EXTERNAL',
      'Cloud analysis unavailable',
      { cause, suggestion: 'Local analysis will continue. Check network connection or retry later.' }
    );
  }
  
  /**
   * Factory: Network error (EXTERNAL error)
   */
  static networkError(operation: string, cause?: Error): InsightError {
    return new InsightError(
      'EXTERNAL',
      `Network error during ${operation}`,
      { cause, suggestion: 'Check your internet connection and try again' }
    );
  }
  
  /**
   * Factory: File system error (USER error - usually permissions)
   */
  static fileSystemError(path: string, cause?: Error): InsightError {
    return new InsightError(
      'USER',
      `Cannot access file: ${path}`,
      { cause, suggestion: 'Check file permissions and ensure the path is valid' }
    );
  }
  
  /**
   * Factory: Workspace not found (USER error)
   */
  static noWorkspace(): InsightError {
    return new InsightError(
      'USER',
      'No workspace folder open',
      { suggestion: 'Open a folder or workspace to run analysis' }
    );
  }
  
  /**
   * Check if error is an InsightError
   */
  static isInsightError(error: unknown): error is InsightError {
    return error instanceof InsightError;
  }
  
  /**
   * Extract InsightError from unknown error, or classify it
   */
  static from(error: unknown, defaultKind: InsightErrorKind = 'INSIGHT'): InsightError {
    if (InsightError.isInsightError(error)) {
      return error;
    }
    
    if (error instanceof Error) {
      // Classify common error patterns
      const message = error.message.toLowerCase();
      
      // Network/fetch errors → EXTERNAL
      if (message.includes('fetch') || 
          message.includes('network') || 
          message.includes('econnrefused') ||
          message.includes('timeout')) {
        return InsightError.networkError('cloud request', error);
      }
      
      // Permission/file errors → USER
      if (message.includes('eacces') || 
          message.includes('eperm') || 
          message.includes('enoent')) {
        return new InsightError('USER', error.message, { cause: error });
      }
      
      // Default classification
      return new InsightError(defaultKind, error.message, { cause: error });
    }
    
    // Unknown error type
    return new InsightError(defaultKind, String(error));
  }
}
