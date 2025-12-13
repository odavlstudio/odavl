/**
 * Phase 2.1: Privacy-First Sanitization Layer
 * 
 * CRITICAL: This module ensures NO sensitive data leaks during cloud uploads.
 * Every function is pure and testable.
 */

import * as path from 'node:path';
import type { InsightIssue } from '../commands/insight-v2.js';

/**
 * Sanitized issue ready for cloud upload
 * NO absolute paths, NO variable names, NO code snippets
 */
export interface SanitizedIssue {
  file: string;              // Relative path ONLY (e.g., "src/index.ts")
  line: number;
  column: number;
  message: string;           // Variable names replaced with <VAR>
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  detector: string;
  ruleId?: string;
  // EXCLUDED: suggestedFix (contains code)
  // EXCLUDED: codeSnippet (contains source)
}

/**
 * Sanitize a single issue for cloud upload
 * 
 * @param issue - Raw issue from detector
 * @param workspaceRoot - Absolute workspace root path
 * @returns Sanitized issue with NO sensitive data
 * 
 * @example
 * const issue = {
 *   file: '/home/user/secret-project/src/api-keys.ts',
 *   message: "Hardcoded secret 'AWS_SECRET_KEY'",
 *   suggestedFix: 'const AWS_SECRET_KEY = ...'
 * };
 * const sanitized = sanitizeIssue(issue, '/home/user/secret-project');
 * // Result: { file: 'src/api-keys.ts', message: 'Hardcoded secret <VAR>' }
 */
export function sanitizeIssue(issue: InsightIssue, workspaceRoot: string): SanitizedIssue {
  return {
    // Convert absolute path to relative (CRITICAL: prevents path leakage)
    file: sanitizeFilePath(issue.file, workspaceRoot),
    
    // Keep location data (safe)
    line: issue.line,
    column: issue.column,
    
    // Sanitize message (remove variable names)
    message: sanitizeMessage(issue.message),
    
    // Preserve severity + detector (safe)
    severity: issue.severity,
    detector: issue.detector,
    ruleId: issue.ruleId,
    
    // EXPLICITLY EXCLUDE:
    // - suggestedFix: Contains code snippets
    // - codeSnippet: Contains source code
    // - file (absolute): Converted to relative above
  };
}

/**
 * Convert absolute file path to workspace-relative path
 * 
 * Security: Prevents leaking absolute paths that expose:
 * - User home directory
 * - Organization structure
 * - Internal project names
 * 
 * @param absolutePath - Full path from detector
 * @param workspaceRoot - Workspace root directory
 * @returns Relative path (e.g., "src/index.ts")
 * 
 * @example
 * sanitizeFilePath('/home/user/project/src/index.ts', '/home/user/project')
 * // Returns: 'src/index.ts'
 * 
 * sanitizeFilePath('C:\\Users\\john\\secret\\api.ts', 'C:\\Users\\john\\secret')
 * // Returns: 'api.ts'
 */
export function sanitizeFilePath(absolutePath: string, workspaceRoot: string): string {
  // Normalize paths (handles Windows/Unix differences)
  const normalizedPath = path.normalize(absolutePath);
  const normalizedRoot = path.normalize(workspaceRoot);
  
  // Calculate relative path
  let relativePath = path.relative(normalizedRoot, normalizedPath);
  
  // Convert Windows backslashes to forward slashes (standard format)
  relativePath = relativePath.replace(/\\/g, '/');
  
  // Safety check: If path escapes workspace (e.g., "../../../etc/passwd"),
  // return filename only (last resort privacy protection)
  if (relativePath.startsWith('../') || relativePath.startsWith('..\\')) {
    return path.basename(normalizedPath);
  }
  
  return relativePath;
}

/**
 * Sanitize issue message by removing variable names and sensitive strings
 * 
 * Security: Prevents leaking:
 * - Variable names (may contain secrets like 'apiKey', 'password')
 * - String literals (may contain credentials)
 * - Code identifiers (may expose internal naming conventions)
 * 
 * @param message - Raw message from detector
 * @returns Sanitized message with <VAR> placeholders
 * 
 * @example
 * sanitizeMessage("Unused variable 'AWS_SECRET_KEY'")
 * // Returns: "Unused variable <VAR>"
 * 
 * sanitizeMessage('Hardcoded string "admin@company.com"')
 * // Returns: 'Hardcoded string <VAR>'
 * 
 * sanitizeMessage("Function `getApiKey()` is deprecated")
 * // Returns: "Function <VAR> is deprecated"
 */
export function sanitizeMessage(message: string): string {
  let sanitized = message;
  
  // Remove single-quoted strings: 'variableName' → <VAR>
  sanitized = sanitized.replace(/'([^']+)'/g, '<VAR>');
  
  // Remove double-quoted strings: "stringLiteral" → <VAR>
  sanitized = sanitized.replace(/"([^"]+)"/g, '<VAR>');
  
  // Remove backtick-quoted identifiers: `functionName` → <VAR>
  sanitized = sanitized.replace(/`([^`]+)`/g, '<VAR>');
  
  // Remove code patterns: variableName → <VAR> (for unquoted identifiers)
  // Pattern: word after "variable", "function", "class", "property", etc.
  sanitized = sanitized.replace(/\b(variable|function|class|property|method|parameter)\s+(\w+)/gi, '$1 <VAR>');
  
  // Remove file paths in messages (e.g., "File /home/user/file.ts not found")
  sanitized = sanitized.replace(/\/[\w\-./]+/g, '<PATH>');
  sanitized = sanitized.replace(/[A-Z]:\\[\w\-\\./]+/gi, '<PATH>');
  
  return sanitized;
}

/**
 * Sanitize multiple issues in batch
 * 
 * @param issues - Array of raw issues
 * @param workspaceRoot - Workspace root path
 * @returns Array of sanitized issues
 */
export function sanitizeIssues(issues: InsightIssue[], workspaceRoot: string): SanitizedIssue[] {
  return issues.map(issue => sanitizeIssue(issue, workspaceRoot));
}

/**
 * Validate that an issue is properly sanitized
 * 
 * Security check: Ensures no absolute paths or sensitive data remain
 * 
 * @param issue - Sanitized issue to validate
 * @returns true if safe, false if leaks detected
 * 
 * @example
 * const sanitized = sanitizeIssue(rawIssue, workspaceRoot);
 * if (!validateSanitization(sanitized)) {
 *   throw new Error('SECURITY: Sanitization failed');
 * }
 */
export function validateSanitization(issue: SanitizedIssue): boolean {
  // Check 1: No absolute paths (Unix)
  if (issue.file.startsWith('/')) {
    return false;
  }
  
  // Check 2: No absolute paths (Windows)
  if (/^[A-Z]:\\/i.test(issue.file)) {
    return false;
  }
  
  // Check 3: No path traversal attempts
  if (issue.file.includes('../') || issue.file.includes('..\\')) {
    return false;
  }
  
  // Check 4: No home directory references
  if (issue.file.includes('~') || issue.file.toLowerCase().includes('home/')) {
    return false;
  }
  
  // Check 5: Message should not contain absolute paths
  if (issue.message.match(/\/[\w\-./]+\/[\w\-./]+/)) {
    // Allow single-segment paths like "/api" but not "/home/user/..."
    const pathMatch = issue.message.match(/\/[\w\-./]+\/[\w\-./]+/);
    if (pathMatch) return false;
  }
  
  if (issue.message.match(/[A-Z]:\\[\w\-\\./]+/i)) {
    return false;
  }
  
  return true;
}

/**
 * Generate privacy report for sanitized issues
 * Shows what was sanitized and privacy guarantees
 * 
 * @param original - Original issues
 * @param sanitized - Sanitized issues
 * @returns Privacy report
 */
export function generatePrivacyReport(original: InsightIssue[], sanitized: SanitizedIssue[]): {
  totalIssues: number;
  pathsSanitized: number;
  messagesSanitized: number;
  fixesRemoved: number;
  validationPassed: boolean;
} {
  let pathsSanitized = 0;
  let messagesSanitized = 0;
  let fixesRemoved = 0;
  
  for (let i = 0; i < original.length; i++) {
    const orig = original[i];
    const sani = sanitized[i];
    
    // Count path sanitizations
    if (orig.file !== sani.file) {
      pathsSanitized++;
    }
    
    // Count message sanitizations
    if (orig.message !== sani.message) {
      messagesSanitized++;
    }
    
    // Count removed fixes
    if (orig.suggestedFix) {
      fixesRemoved++;
    }
  }
  
  // Validate all sanitized issues
  const validationPassed = sanitized.every(validateSanitization);
  
  return {
    totalIssues: original.length,
    pathsSanitized,
    messagesSanitized,
    fixesRemoved,
    validationPassed,
  };
}
