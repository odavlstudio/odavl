/**
 * Wave 11: File-Level Detector Utilities
 * 
 * Provides utilities for detecting file-level execution capabilities
 * and wrapping legacy detectors for compatibility.
 */

export interface InsightIssue {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  detector: string;
  code?: string;
  suggestedFix?: string;
}

/**
 * Check if a detector supports file-level execution
 * @param detector Detector instance
 * @returns True if detector has detectFile method
 */
export function supportsFileLevel(detector: any): boolean {
  return typeof detector.detectFile === 'function';
}

/**
 * Wrapper for legacy detectors that don't support detectFile
 * Executes detect() on workspace and filters results for specific file
 * 
 * @param detector Detector instance
 * @param workspaceRoot Workspace root path
 * @param filePath Target file path
 * @returns Issues for the specified file
 */
export async function runLegacyDetectorForFile(
  detector: any,
  workspaceRoot: string,
  filePath: string
): Promise<InsightIssue[]> {
  // Run workspace-level detection (legacy behavior)
  const allIssues = await detector.detect(workspaceRoot);
  
  // Filter issues for this specific file
  const fileIssues = allIssues.filter((issue: any) => {
    if (!issue.file) return false;
    
    // Normalize paths for comparison
    const normalizedIssueFile = issue.file.replace(/\\/g, '/');
    const normalizedTargetFile = filePath.replace(/\\/g, '/');
    
    // Match exact file or file path contains target
    return normalizedIssueFile === normalizedTargetFile ||
           normalizedIssueFile.endsWith(normalizedTargetFile) ||
           normalizedTargetFile.endsWith(normalizedIssueFile);
  });
  
  // Mark as legacy for debugging
  return fileIssues.map((issue: any) => ({
    ...issue,
    _legacy: true
  }));
}

/**
 * Execute detector on a single file (auto-detects capability)
 * 
 * @param detector Detector instance
 * @param workspaceRoot Workspace root path
 * @param filePath Target file path
 * @returns Issues for the file
 */
export async function executeDetectorOnFile(
  detector: any,
  workspaceRoot: string,
  filePath: string
): Promise<InsightIssue[]> {
  // Prefer detectFile if available
  if (supportsFileLevel(detector)) {
    return detector.detectFile(filePath);
  }
  
  // Fallback to legacy detect with filtering
  return runLegacyDetectorForFile(detector, workspaceRoot, filePath);
}
