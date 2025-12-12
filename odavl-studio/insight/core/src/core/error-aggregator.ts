/**
 * ODAVL Insight - Error Aggregation Layer
 * Wave 8 Phase 2 - Process Isolation Infrastructure
 * 
 * Centralizes and normalizes detector errors from various sources:
 * - Timeouts (tsc, eslint, build processes)
 * - Worker crashes (process exits, OOM)
 * - External tool failures (compilation, linting)
 * 
 * Provides consistent error format for Brain to handle failures gracefully.
 * 
 * @since Wave 8 Phase 2 (December 2025)
 */

/**
 * Severity levels for detector errors
 */
export type DetectorErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Normalized detector error format
 */
export interface NormalizedDetectorError {
  detector: string;           // Detector name (e.g., 'typescript', 'eslint')
  severity: DetectorErrorSeverity;
  code: string;               // Error code: 'TIMEOUT', 'WORKER_CRASH', 'TOOL_ERROR', etc.
  message: string;            // Human-readable error message
  timestamp: string;          // ISO 8601 timestamp
  details?: unknown;          // Optional additional context (exit codes, durations, etc.)
}

/**
 * Centralized error collection and normalization for detector execution
 * 
 * Usage:
 * ```typescript
 * const aggregator = new DetectorErrorAggregator();
 * 
 * // Collect timeout
 * aggregator.addTimeoutError('typescript', 120000);
 * 
 * // Collect crash
 * aggregator.addWorkerCrashError('eslint', 137);
 * 
 * // Collect external tool error
 * aggregator.addExternalToolError('build', 'tsc', new Error('Compilation failed'));
 * 
 * // Get all errors
 * const allErrors = aggregator.getErrors();
 * 
 * // Get errors for specific detector
 * const tsErrors = aggregator.getErrorsByDetector('typescript');
 * ```
 */
export class DetectorErrorAggregator {
  private readonly errors = new Map<string, NormalizedDetectorError[]>();

  /**
   * Add a normalized error to the collection
   */
  add(error: NormalizedDetectorError): void {
    const list = this.errors.get(error.detector) ?? [];
    list.push(error);
    this.errors.set(error.detector, list);
  }

  /**
   * Add a timeout error for a detector that exceeded its time limit
   * 
   * @param detector - Detector name
   * @param durationMs - Time in milliseconds before timeout occurred
   */
  addTimeoutError(detector: string, durationMs: number): void {
    this.add({
      detector,
      severity: 'high',
      code: 'TIMEOUT',
      message: `Detector "${detector}" exceeded timeout (${durationMs} ms)`,
      timestamp: new Date().toISOString(),
      details: { durationMs },
    });
  }

  /**
   * Add a worker crash error for a detector whose worker process terminated unexpectedly
   * 
   * @param detector - Detector name
   * @param exitCode - Process exit code (null if killed by signal)
   */
  addWorkerCrashError(detector: string, exitCode: number | null): void {
    this.add({
      detector,
      severity: 'critical',
      code: 'WORKER_CRASH',
      message: `Worker for detector "${detector}" crashed${exitCode != null ? ` with exit code ${exitCode}` : ''}`,
      timestamp: new Date().toISOString(),
      details: { exitCode },
    });
  }

  /**
   * Add an external tool error for a detector that uses external processes (tsc, eslint, etc.)
   * 
   * @param detector - Detector name
   * @param tool - External tool name (e.g., 'tsc', 'eslint', 'pnpm')
   * @param rawError - Original error object from the tool
   */
  addExternalToolError(detector: string, tool: string, rawError: unknown): void {
    this.add({
      detector,
      severity: 'medium',
      code: 'TOOL_ERROR',
      message: `External tool "${tool}" failed for detector "${detector}"`,
      timestamp: new Date().toISOString(),
      details: { tool, rawError },
    });
  }

  /**
   * Get all errors across all detectors
   * 
   * @returns Flat array of all normalized errors
   */
  getErrors(): NormalizedDetectorError[] {
    return Array.from(this.errors.values()).flat();
  }

  /**
   * Get errors for a specific detector
   * 
   * @param detector - Detector name
   * @returns Array of errors for the specified detector (empty if none)
   */
  getErrorsByDetector(detector: string): NormalizedDetectorError[] {
    return this.errors.get(detector) ?? [];
  }

  /**
   * Get all detectors that have errors
   * 
   * @returns Array of detector names with at least one error
   */
  getDetectorsWithErrors(): string[] {
    return Array.from(this.errors.keys());
  }

  /**
   * Check if a specific detector has any errors
   * 
   * @param detector - Detector name
   * @returns True if detector has errors, false otherwise
   */
  hasErrors(detector: string): boolean {
    return (this.errors.get(detector)?.length ?? 0) > 0;
  }

  /**
   * Get total error count across all detectors
   * 
   * @returns Total number of errors
   */
  getTotalErrorCount(): number {
    return this.getErrors().length;
  }

  /**
   * Clear all errors (useful for testing or re-runs)
   */
  clear(): void {
    this.errors.clear();
  }

  /**
   * Export errors as JSON string (useful for logging)
   * 
   * @returns JSON string of all errors
   */
  toJSON(): string {
    return JSON.stringify(this.getErrors(), null, 2);
  }

  /**
   * Export errors as JSONL format (one JSON object per line)
   * Useful for streaming logs or worker communication
   * 
   * @returns JSONL string
   */
  toJSONL(): string {
    return this.getErrors()
      .map((error) => JSON.stringify(error))
      .join('\n');
  }
}
