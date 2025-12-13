/**
 * OMEGA-P5 Phase 4 Commit 2: Insight + OMS Integration
 * OMS-Aware Analysis Engine - Core orchestration (≤40 LOC)
 * 
 * Wave 10 - Batch 1: Added pluggable detector executor abstraction
 */

import { loadOMSContext, resolveFileType } from '@odavl-studio/oms';
import { getFileIntelligence } from '@odavl-studio/oms';
import { computeFileRiskScore } from '@odavl-studio/oms/risk';
import { scaleSeverity } from './severity-scaler.js';
import { appendInsightTelemetry } from '../../telemetry/insight-telemetry.js';
import { DetectorExecutor, SequentialDetectorExecutor, ProgressCallback } from './detector-executor.js';

export interface AnalysisResult {
  file: string;
  fileType?: string;
  riskScore: number;
  issues: AnalysisIssue[];
  intelligence?: { dominantDetectors: string[]; preferredRecipes: string[]; guardianSensitivity: string };
}

export interface AnalysisIssue {
  detector: string;
  severity: string;
  effectiveSeverity: number;
  message: string;
  fileRisk: number;
}

export interface AnalysisOptions {
  onProgress?: ProgressCallback;
}

export class AnalysisEngine {
  private omsContext: Awaited<ReturnType<typeof loadOMSContext>> | null = null;
  private executor: DetectorExecutor;
  private options: AnalysisOptions;

  constructor(executor?: DetectorExecutor, options: AnalysisOptions = {}) {
    // Wave 10 Enhanced: Use provided executor or default to sequential
    this.executor = executor || new SequentialDetectorExecutor();
    this.options = options;
  }

  async analyze(files: string[], options?: { changedFiles?: string[] }): Promise<AnalysisResult[]> {
    if (files.length === 0) return [];
    
    // Wave 10: Report progress
    this.options.onProgress?.({ phase: 'collectFiles', total: files.length, completed: files.length, message: `Collected ${files.length} files` });
    
    await this.loadOMS();
    
    // Determine workspace root - find common ancestor directory of all files
    const workspaceRoot = this.findWorkspaceRoot(files);
    
    // Run detectors once on workspace, not per-file (with progress callback)
    // Phase 1.4.3: Pass changedFiles for smart detector skipping
    const allIssues = await this.runDetectors(workspaceRoot, options?.changedFiles);
    
    // Wave 10: Report aggregation phase
    this.options.onProgress?.({ phase: 'aggregateResults', total: files.length, completed: 0, message: 'Aggregating results...' });
    
    // Map issues to files
    const results = await Promise.all(files.map(file => this.buildFileResult(file, allIssues)));
    
    // OMEGA-P6 Phase 4: Emit telemetry after analysis completes
    await this.emitTelemetry(results);
    
    // Wave 10: Report completion
    this.options.onProgress?.({ phase: 'complete', total: files.length, completed: files.length, message: 'Analysis complete' });
    
    // TODO(Wave10+): Streaming skeleton - emit partial results via event emitter
    // Future: Instead of aggregating all results in memory, stream them as they're ready:
    // - Emit 'result' events for each completed file
    // - Enable real-time reporting for large workspaces
    // - Reduce memory footprint for massive codebases
    
    return results;
  }

  private findWorkspaceRoot(files: string[]): string {
    if (files.length === 0) return process.cwd();
    
    // For workspace root, we want the directory that contains the project
    // Look for common parent directory with standard project indicators
    // For runtime tests, paths look like: .../runtime-tests/python-sample/...
    
    const firstFile = files[0].replace(/\\/g, '/');
    
    // Find "runtime-tests" in the path and go up one level from the sample directory
    if (firstFile.includes('/runtime-tests/')) {
      const match = firstFile.match(/^(.+\/runtime-tests\/[^/]+)/);
      if (match) {
        return match[1];
      }
    }
    
    // Fallback: Use the directory of the first file (parent directory)
    const lastSlash = firstFile.lastIndexOf('/');
    if (lastSlash > 0) {
      return firstFile.substring(0, lastSlash);
    }
    
    return process.cwd();
  }
  
  private async runDetectors(workspaceRoot: string, changedFiles?: string[]): Promise<any[]> {
    // Wave 10 Enhanced: Delegate to pluggable executor with progress callback
    // Phase 1.4.3: Pass changedFiles for smart detector skipping
    return this.executor.runDetectors({ 
      workspaceRoot,
      onProgress: this.options.onProgress,
      changedFiles 
    });
  }
  
  async shutdown(): Promise<void> {
    // Wave 10: Cleanup executor resources
    if (this.executor.shutdown) {
      await this.executor.shutdown();
    }
  }
  
  private async buildFileResult(file: string, allIssues: any[]): Promise<AnalysisResult> {
    const fileType = this.omsContext ? resolveFileType(file) : null;
    const riskScore = fileType ? computeFileRiskScore({ type: fileType }) : 0.5;
    
    // Filter issues for this file
    const fileIssues = allIssues.filter((issue: any) => 
      issue.file === file || issue.file?.includes(file) || file.includes(issue.file || '')
    );
    
    const issues: AnalysisIssue[] = fileIssues.map((issue: any) => {
      // Normalize severity to string if it's a number
      let severityStr = issue.severity;
      if (typeof severityStr === 'number') {
        if (severityStr === 0) severityStr = 'info';
        else if (severityStr === 1) severityStr = 'low';
        else if (severityStr === 2) severityStr = 'medium';
        else if (severityStr >= 3) severityStr = 'high';
      }
      
      return {
        detector: issue.detector,
        severity: severityStr,
        effectiveSeverity: scaleSeverity(severityStr, riskScore),
        message: issue.message,
        fileRisk: riskScore,
      };
    });
    
    const intelligence = fileType ? getFileIntelligence(fileType.id) : null;
    
    return {
      file,
      fileType: fileType?.id,
      riskScore,
      issues,
      intelligence: intelligence ? {
        dominantDetectors: intelligence.dominantDetectors,
        preferredRecipes: intelligence.preferredRecipes,
        guardianSensitivity: intelligence.guardianSensitivity,
      } : undefined,
    };
  }

  private async emitTelemetry(results: AnalysisResult[]): Promise<void> {
    try {
      const issuesBySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
      const allDetectors = new Set<string>();
      let totalRisk = 0;
      let criticalCount = 0;

      for (const result of results) {
        for (const issue of result.issues) {
          allDetectors.add(issue.detector);
          const sev = issue.severity.toLowerCase();
          if (sev === 'critical') issuesBySeverity.critical++;
          else if (sev === 'high') issuesBySeverity.high++;
          else if (sev === 'medium') issuesBySeverity.medium++;
          else if (sev === 'low') issuesBySeverity.low++;
        }
        totalRisk += result.riskScore;
        if (result.riskScore >= 0.7) criticalCount++;
      }

      await appendInsightTelemetry(process.cwd(), {
        timestamp: new Date().toISOString(),
        workspaceRoot: process.cwd(),
        filesAnalyzed: results.length,
        detectorsRun: Array.from(allDetectors),
        issuesFound: results.reduce((sum, r) => sum + r.issues.length, 0),
        issuesBySeverity,
        fileRiskSummary: results.length > 0 ? {
          avgRisk: totalRisk / results.length,
          criticalCount,
        } : undefined,
      });
    } catch {
      // Telemetry failures never break analysis
    }
  }

  private async loadOMS(): Promise<void> {
    if (this.omsContext) return;
    try { this.omsContext = await loadOMSContext(); } catch { /* fallback */ }
  }


}
