/**
 * ODAVL Phase P5 - File-Type Aware Analysis Engine
 * 
 * This module integrates the universal file-type system (Phase P4) into Insight's
 * analysis workflow, enabling intelligent file routing, risk-based prioritization,
 * and automated skipping of irrelevant files.
 * 
 * Key Features:
 * - Detector routing based on file types
 * - Automatic skipping of buildArtifacts/logs/coverage/diagnostics/reports
 * - Risk-based file prioritization (critical → high → medium → low)
 * - File-type metadata in Issue objects
 * - Audit logging for all routing decisions
 * 
 * Integration Points:
 * - Uses detectFileTypeWithIgnores() from @odavl/core
 * - Enhances Issue interface with fileType + risk metadata
 * - Called by incremental-analyzer.ts and detector-worker-pool.ts
 * 
 * @since Phase P5 (December 2025)
 */

import {
  detectFileType,
  getFileTypeMetadata,
  type FileType,
  type FileTypeMetadata,
} from '../../../packages/odavl-core/src/filetypes/file-type-detection.js';

// Re-export for convenience
export type { FileType, FileTypeMetadata };

/**
 * File types that should NEVER be analyzed
 * These are automatically skipped in all analysis workflows
 */
export const SKIP_FILE_TYPES: FileType[] = [
  'buildArtifacts',  // Compiled output (dist/, out/, build/)
  'logs',            // Application logs
  'diagnostics',     // Debug/profiling data
  'coverage',        // Test coverage reports
  'reports',         // Generated reports
];

/**
 * Risk score mapping for priority sorting
 * Higher score = higher priority in analysis queue
 */
export const RISK_SCORES: Record<FileTypeMetadata['risk'], number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
};

/**
 * Detector compatibility matrix
 * Maps file types to compatible detector names
 */
export const FILE_TYPE_DETECTOR_MAP: Record<FileType, string[]> = {
  // Source code → All code analysis detectors
  sourceCode: ['typescript', 'eslint', 'security', 'performance', 'complexity', 'import', 'circular'],
  
  // Configuration → Security + validation
  config: ['security', 'import'],
  
  // Infrastructure → Security + infrastructure-specific
  infrastructure: ['security', 'infrastructure'],
  
  // Tests → Reduced detector set (no complexity/performance checks)
  tests: ['typescript', 'eslint', 'security'],
  
  // Mocks → Minimal analysis
  mocks: ['typescript', 'eslint'],
  
  // Logs → Never analyzed (in SKIP_FILE_TYPES)
  logs: [],
  
  // Diagnostics → Never analyzed (in SKIP_FILE_TYPES)
  diagnostics: [],
  
  // Datasets → Security only
  datasets: ['security'],
  
  // ML Models → Security (check for embedded secrets/keys)
  mlModels: ['security'],
  
  // Migrations → Security + schema validation
  migrations: ['security', 'database'],
  
  // Environment files → Security ONLY (critical)
  env: ['security'],
  
  // Scripts → Full analysis
  scripts: ['typescript', 'eslint', 'security', 'performance', 'complexity'],
  
  // Schema → Security + database + schema validation
  schema: ['security', 'database'],
  
  // Assets → Security (check for embedded secrets)
  assets: ['security'],
  
  // UI Snapshots → Never analyzed (in SKIP_FILE_TYPES)
  uiSnapshots: [],
  
  // Integrations → Full analysis
  integrations: ['typescript', 'eslint', 'security', 'performance', 'import'],
  
  // Build Artifacts → Never analyzed (in SKIP_FILE_TYPES)
  buildArtifacts: [],
  
  // Coverage → Never analyzed (in SKIP_FILE_TYPES)
  coverage: [],
  
  // Reports → Never analyzed (in SKIP_FILE_TYPES)
  reports: [],
  
  // Secret Candidates → Security ONLY (critical)
  secretCandidates: ['security'],
};

/**
 * Analyze file to determine if it should be processed
 * 
 * @param filePath Absolute file path
 * @returns Analysis result with skip flag, file type, risk, and allowed detectors
 */
export interface FileAnalysis {
  filePath: string;
  fileType: FileType;
  risk: FileTypeMetadata['risk'];
  shouldSkip: boolean;
  skipReason?: string;
  allowedDetectors: string[];
  usedByProducts: string[];
  priorityScore: number;
}

/**
 * Analyze file for Insight processing
 * 
 * @param filePath Absolute file path
 * @param requestedDetectors List of detectors user wants to run (empty = all)
 * @returns File analysis result
 */
export function analyzeFileForInsight(
  filePath: string,
  requestedDetectors: string[] = []
): FileAnalysis {
  // Step 1: Detect file type
  const fileType = detectFileType(filePath);
  const metadata = getFileTypeMetadata(fileType);
  
  // Step 2: Check if file should be skipped
  const shouldSkip = SKIP_FILE_TYPES.includes(fileType);
  const skipReason = shouldSkip
    ? `File type '${fileType}' is not analyzed by Insight (build artifacts, logs, or reports)`
    : undefined;
  
  // Step 3: Determine allowed detectors based on file type
  const fileTypeDetectors = FILE_TYPE_DETECTOR_MAP[fileType] || [];
  
  // If user requested specific detectors, filter to intersection
  const allowedDetectors = requestedDetectors.length > 0
    ? fileTypeDetectors.filter(d => requestedDetectors.includes(d))
    : fileTypeDetectors;
  
  // Step 4: Calculate priority score (for sorting)
  const priorityScore = RISK_SCORES[metadata.risk];
  
  return {
    filePath,
    fileType,
    risk: metadata.risk,
    shouldSkip,
    skipReason,
    allowedDetectors,
    usedByProducts: metadata.usedBy,
    priorityScore,
  };
}

/**
 * Analyze multiple files and filter out skipped ones
 * 
 * @param filePaths List of absolute file paths
 * @param requestedDetectors List of detectors to run (empty = all)
 * @returns Array of file analyses (excluding skipped files)
 */
export function analyzeFilesForInsight(
  filePaths: string[],
  requestedDetectors: string[] = []
): FileAnalysis[] {
  const analyses: FileAnalysis[] = [];
  
  for (const filePath of filePaths) {
    const analysis = analyzeFileForInsight(filePath, requestedDetectors);
    
    // Only include files that should be analyzed
    if (!analysis.shouldSkip) {
      analyses.push(analysis);
    } else {
      // Log skipped files
      console.debug(`[Insight] Skipped file: ${filePath} (type: ${analysis.fileType})`);
    }
  }
  
  return analyses;
}

/**
 * Sort files by risk priority (critical first, low last)
 * 
 * @param analyses Array of file analyses
 * @returns Sorted array (descending by priority score)
 */
export function prioritizeFilesByRisk(analyses: FileAnalysis[]): FileAnalysis[] {
  return analyses.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Get statistics about file analysis results
 * 
 * @param analyses Array of file analyses
 * @returns Statistics object
 */
export interface FileAnalysisStats {
  total: number;
  skipped: number;
  analyzed: number;
  byRisk: Record<string, number>;
  byType: Record<string, number>;
  criticalFiles: string[];
  highRiskFiles: string[];
}

/**
 * Generate statistics from file analyses
 * 
 * @param allFiles All file paths (before filtering)
 * @param analyses Analyzed files (after filtering)
 * @returns Statistics object
 */
export function getFileAnalysisStats(
  allFiles: string[],
  analyses: FileAnalysis[]
): FileAnalysisStats {
  const byRisk: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  const byType: Record<string, number> = {};
  const criticalFiles: string[] = [];
  const highRiskFiles: string[] = [];
  
  for (const analysis of analyses) {
    // Count by risk
    byRisk[analysis.risk] = (byRisk[analysis.risk] || 0) + 1;
    
    // Count by type
    byType[analysis.fileType] = (byType[analysis.fileType] || 0) + 1;
    
    // Track critical/high risk files
    if (analysis.risk === 'critical') {
      criticalFiles.push(analysis.filePath);
    } else if (analysis.risk === 'high') {
      highRiskFiles.push(analysis.filePath);
    }
  }
  
  return {
    total: allFiles.length,
    skipped: allFiles.length - analyses.length,
    analyzed: analyses.length,
    byRisk,
    byType,
    criticalFiles,
    highRiskFiles,
  };
}

/**
 * Audit logger for file routing decisions
 * Logs every file analysis decision for compliance and debugging
 */
export class FileAnalysisAuditor {
  private logs: Array<{
    timestamp: string;
    filePath: string;
    fileType: FileType;
    risk: string;
    action: 'analyze' | 'skip';
    detectors: string[];
    reason?: string;
  }> = [];
  
  /**
   * Log a file analysis decision
   */
  log(analysis: FileAnalysis, action: 'analyze' | 'skip'): void {
    const entry = {
      timestamp: new Date().toISOString(),
      filePath: analysis.filePath,
      fileType: analysis.fileType,
      risk: analysis.risk,
      action,
      detectors: analysis.allowedDetectors,
      reason: analysis.skipReason,
    };
    
    this.logs.push(entry);
    
    // Console logging with color coding
    if (action === 'analyze') {
      const riskEmoji = analysis.risk === 'critical' ? '🔴' : analysis.risk === 'high' ? '🟠' : analysis.risk === 'medium' ? '🟡' : '🟢';
      console.log(
        `[Insight] ${riskEmoji} Analyzing file: ${analysis.filePath} ` +
        `(type: ${analysis.fileType}, risk: ${analysis.risk}, detectors: [${analysis.allowedDetectors.join(', ')}])`
      );
    } else {
      console.log(
        `[Insight] ⏭️  Skipped file: ${analysis.filePath} ` +
        `(type: ${analysis.fileType}, reason: ${analysis.skipReason})`
      );
    }
  }
  
  /**
   * Get all audit logs
   */
  getLogs(): typeof this.logs {
    return this.logs;
  }
  
  /**
   * Clear audit logs
   */
  clear(): void {
    this.logs = [];
  }
  
  /**
   * Export logs to JSON
   */
  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

/**
 * Global auditor instance
 */
export const fileAnalysisAuditor = new FileAnalysisAuditor();

// TODO Phase P6: Send fileType + risk metadata to Autopilot's planning phase
// When Insight detects issues, it should include file-type metadata in handoff to Autopilot.
// This allows Autopilot to adjust risk budget and block modifications to critical files.
// 
// Example integration:
// ```typescript
// const issue = {
//   ...detectorIssue,
//   fileType: analysis.fileType,
//   risk: analysis.risk,
//   autopilotHandoff: analysis.risk !== 'critical' // Block autopilot for critical files
// };
// ```

// TODO Phase P7: Send fileType + risk metadata to Guardian baseline engine
// When Insight completes analysis, it should send file-type statistics to Guardian.
// This allows Guardian to route test suites based on which file types changed.
// 
// Example integration:
// ```typescript
// await guardianClient.notifyAnalysisComplete({
//   stats: getFileAnalysisStats(allFiles, analyses),
//   criticalFiles: analyses.filter(a => a.risk === 'critical').map(a => a.filePath),
//   testSuitesToRun: determineTestSuites(analyses)
// });
// ```
