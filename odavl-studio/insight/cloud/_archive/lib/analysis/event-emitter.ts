/**
 * Analysis Event Emitter
 * Emits real-time events during analysis execution
 */

import { getSocketIO } from '@/lib/socket/server';
import type {
  AnalysisStartedPayload,
  AnalysisProgressPayload,
  AnalysisCompletePayload,
  AnalysisErrorPayload,
  AnalysisCancelledPayload,
} from '@/lib/socket/events';

export class AnalysisEventEmitter {
  private analysisId: string;
  private projectId: string;
  private userId: string;
  private startTime: number;
  private detectorCount: number;
  private completedDetectors: number;
  private totalIssues: Map<string, number>;
  private cancelled: boolean;

  constructor(analysisId: string, projectId: string, userId: string) {
    this.analysisId = analysisId;
    this.projectId = projectId;
    this.userId = userId;
    this.startTime = Date.now();
    this.detectorCount = 0;
    this.completedDetectors = 0;
    this.totalIssues = new Map();
    this.cancelled = false;
  }

  /**
   * Emit analysis started event
   */
  emitStarted(detectors: string[]): void {
    this.detectorCount = detectors.length;

    const payload: AnalysisStartedPayload = {
      analysisId: this.analysisId,
      projectId: this.projectId,
      userId: this.userId,
      detectors,
      timestamp: new Date().toISOString(),
    };

    try {
      const io = getSocketIO();
      
      // Emit to user's personal room
      io.to(`user:${this.userId}`).emit('analysis:started', payload);
      
      // Emit to project room
      io.to(`project:${this.projectId}`).emit('analysis:started', payload);

      console.log(`[Analysis] Started: ${this.analysisId} with ${detectors.length} detectors`);
    } catch (error) {
      console.error('[Analysis] Failed to emit started event:', error);
    }
  }

  /**
   * Emit detector progress event
   */
  emitProgress(
    detector: string,
    progress: number,
    status: 'running' | 'complete' | 'error',
    issuesFound: number = 0
  ): void {
    if (this.cancelled) return;

    this.totalIssues.set(detector, issuesFound);

    if (status === 'complete' || status === 'error') {
      this.completedDetectors++;
    }

    // Calculate estimated time remaining
    const elapsed = Date.now() - this.startTime;
    const avgTimePerDetector = elapsed / Math.max(1, this.completedDetectors);
    const remainingDetectors = this.detectorCount - this.completedDetectors;
    const estimatedTimeRemaining = Math.round((avgTimePerDetector * remainingDetectors) / 1000);

    const payload: AnalysisProgressPayload = {
      analysisId: this.analysisId,
      projectId: this.projectId,
      detector,
      progress,
      status,
      issuesFound,
      estimatedTimeRemaining: estimatedTimeRemaining > 0 ? estimatedTimeRemaining : undefined,
      timestamp: new Date().toISOString(),
    };

    try {
      const io = getSocketIO();
      
      // Emit to user's personal room
      io.to(`user:${this.userId}`).emit('analysis:progress', payload);
      
      // Emit to project room
      io.to(`project:${this.projectId}`).emit('analysis:progress', payload);

      console.log(
        `[Analysis] Progress: ${detector} - ${progress}% (${status}) - ${issuesFound} issues`
      );
    } catch (error) {
      console.error('[Analysis] Failed to emit progress event:', error);
    }
  }

  /**
   * Emit analysis complete event
   */
  emitComplete(issuesBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  }): void {
    if (this.cancelled) return;

    const duration = Math.round((Date.now() - this.startTime) / 1000);
    const totalIssues =
      issuesBySeverity.critical +
      issuesBySeverity.high +
      issuesBySeverity.medium +
      issuesBySeverity.low;

    const payload: AnalysisCompletePayload = {
      analysisId: this.analysisId,
      projectId: this.projectId,
      totalIssues,
      criticalIssues: issuesBySeverity.critical,
      highIssues: issuesBySeverity.high,
      mediumIssues: issuesBySeverity.medium,
      lowIssues: issuesBySeverity.low,
      duration,
      timestamp: new Date().toISOString(),
    };

    try {
      const io = getSocketIO();
      
      // Emit to user's personal room
      io.to(`user:${this.userId}`).emit('analysis:complete', payload);
      
      // Emit to project room
      io.to(`project:${this.projectId}`).emit('analysis:complete', payload);

      console.log(
        `[Analysis] Complete: ${this.analysisId} - ${totalIssues} issues in ${duration}s`
      );
    } catch (error) {
      console.error('[Analysis] Failed to emit complete event:', error);
    }
  }

  /**
   * Emit analysis error event
   */
  emitError(detector: string, error: string): void {
    const payload: AnalysisErrorPayload = {
      analysisId: this.analysisId,
      projectId: this.projectId,
      detector,
      error,
      timestamp: new Date().toISOString(),
    };

    try {
      const io = getSocketIO();
      
      // Emit to user's personal room
      io.to(`user:${this.userId}`).emit('analysis:error', payload);
      
      // Emit to project room
      io.to(`project:${this.projectId}`).emit('analysis:error', payload);

      console.error(`[Analysis] Error in ${detector}: ${error}`);
    } catch (error) {
      console.error('[Analysis] Failed to emit error event:', error);
    }
  }

  /**
   * Emit analysis cancelled event
   */
  emitCancelled(): void {
    this.cancelled = true;

    const payload: AnalysisCancelledPayload = {
      analysisId: this.analysisId,
      projectId: this.projectId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
    };

    try {
      const io = getSocketIO();
      
      // Emit to user's personal room
      io.to(`user:${this.userId}`).emit('analysis:cancelled', payload);
      
      // Emit to project room
      io.to(`project:${this.projectId}`).emit('analysis:cancelled', payload);

      console.log(`[Analysis] Cancelled: ${this.analysisId}`);
    } catch (error) {
      console.error('[Analysis] Failed to emit cancelled event:', error);
    }
  }

  /**
   * Check if analysis is cancelled
   */
  isCancelled(): boolean {
    return this.cancelled;
  }

  /**
   * Cancel analysis
   */
  cancel(): void {
    this.emitCancelled();
  }
}

/**
 * Active analysis tracking
 */
const activeAnalyses = new Map<string, AnalysisEventEmitter>();

/**
 * Create and register analysis emitter
 */
export function createAnalysisEmitter(
  analysisId: string,
  projectId: string,
  userId: string
): AnalysisEventEmitter {
  const emitter = new AnalysisEventEmitter(analysisId, projectId, userId);
  activeAnalyses.set(analysisId, emitter);
  return emitter;
}

/**
 * Get active analysis emitter
 */
export function getAnalysisEmitter(analysisId: string): AnalysisEventEmitter | undefined {
  return activeAnalyses.get(analysisId);
}

/**
 * Cancel analysis by ID
 */
export function cancelAnalysis(analysisId: string): boolean {
  const emitter = activeAnalyses.get(analysisId);
  if (emitter) {
    emitter.cancel();
    return true;
  }
  return false;
}

/**
 * Remove completed analysis
 */
export function removeAnalysisEmitter(analysisId: string): void {
  activeAnalyses.delete(analysisId);
}

/**
 * Get all active analyses
 */
export function getActiveAnalyses(): string[] {
  return Array.from(activeAnalyses.keys());
}
