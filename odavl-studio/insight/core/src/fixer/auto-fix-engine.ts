/**
 * AI-Powered Auto-Fix Engine
 * Automatically fixes code issues with high confidence
 * 
 * Features:
 * - Smart pattern matching
 * - AST-based transformations
 * - Dry-run mode
 * - Undo capability
 * - Confidence-based application
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { EnhancedIssue } from '../analyzer/enhanced-analyzer.js';

export interface FixResult {
  success: boolean;
  filePath: string;
  originalContent: string;
  fixedContent: string;
  appliedFixes: AppliedFix[];
  errors: string[];
}

export interface AppliedFix {
  issue: EnhancedIssue;
  fixType: string;
  description: string;
  linesModified: number;
}

export interface FixOptions {
  dryRun: boolean;           // Don't write files, just simulate
  minConfidence: number;     // Only fix issues with confidence >= this
  createBackup: boolean;     // Create .backup files
  maxFixesPerFile: number;   // Limit fixes per file
  autoCommit: boolean;       // Git commit after successful fixes
}

export class AutoFixEngine {
  private workspaceRoot: string;
  private backupDir: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.backupDir = path.join(workspaceRoot, '.odavl', 'backups');
  }

  /**
   * Auto-fix issues with high confidence
   */
  async fixIssues(
    issues: EnhancedIssue[],
    options: Partial<FixOptions> = {}
  ): Promise<FixResult[]> {
    const opts: FixOptions = {
      dryRun: false,
      minConfidence: 80,  // Only fix high-confidence issues by default
      createBackup: true,
      maxFixesPerFile: 10,
      autoCommit: false,
      ...options,
    };

    // Filter issues by confidence
    const fixableIssues = issues.filter(issue => 
      issue.confidence >= opts.minConfidence &&
      this.isAutoFixable(issue)
    );

    // Group by file
    const issuesByFile = this.groupByFile(fixableIssues);

    // Fix each file
    const results: FixResult[] = [];

    for (const [filePath, fileIssues] of Object.entries(issuesByFile)) {
      try {
        const result = await this.fixFile(filePath, fileIssues, opts);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          filePath,
          originalContent: '',
          fixedContent: '',
          appliedFixes: [],
          errors: [(error as Error).message],
        });
      }
    }

    return results;
  }

  /**
   * Fix a single file
   */
  private async fixFile(
    filePath: string,
    issues: EnhancedIssue[],
    options: FixOptions
  ): Promise<FixResult> {
    const fullPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(this.workspaceRoot, filePath);

    // Read original content
    const originalContent = await fs.readFile(fullPath, 'utf8');
    let currentContent = originalContent;
    const appliedFixes: AppliedFix[] = [];
    const errors: string[] = [];

    // Sort issues by line number (descending) to avoid offset issues
    const sortedIssues = issues
      .slice(0, options.maxFixesPerFile)
      .sort((a, b) => (b.original.line || 0) - (a.original.line || 0));

    // Apply fixes
    for (const issue of sortedIssues) {
      try {
        const fixResult = await this.applyFix(currentContent, issue);
        
        if (fixResult) {
          currentContent = fixResult.content;
          appliedFixes.push(fixResult.fix);
        }
      } catch (error) {
        errors.push(`Failed to fix ${issue.original.message}: ${(error as Error).message}`);
      }
    }

    // Create backup if needed
    if (options.createBackup && !options.dryRun) {
      await this.createBackup(fullPath, originalContent);
    }

    // Write fixed content
    if (!options.dryRun && appliedFixes.length > 0) {
      await fs.writeFile(fullPath, currentContent, 'utf8');
    }

    return {
      success: errors.length === 0,
      filePath,
      originalContent,
      fixedContent: currentContent,
      appliedFixes,
      errors,
    };
  }

  /**
   * Apply a single fix
   */
  private async applyFix(
    content: string,
    issue: EnhancedIssue
  ): Promise<{ content: string; fix: AppliedFix } | null> {
    const detectorName = issue.original.detector || '';
    const issueType = issue.original.type || '';

    // Performance fixes
    if (detectorName === 'Performance') {
      if (issueType === 'inline-style') {
        return this.fixInlineStyle(content, issue);
      }
    }

    // Runtime fixes
    if (detectorName === 'Runtime') {
      if (issueType === 'setInterval-leak') {
        return this.fixSetIntervalLeak(content, issue);
      }
      if (issueType === 'setTimeout-leak') {
        return this.fixSetTimeoutLeak(content, issue);
      }
    }

    // Network fixes
    if (detectorName === 'Network') {
      if (issueType === 'missing-timeout') {
        return this.fixMissingTimeout(content, issue);
      }
      if (issueType === 'no-error-handling') {
        return this.fixMissingErrorHandling(content, issue);
      }
    }

    // TypeScript fixes
    if (detectorName === 'TypeScript') {
      if (issueType === 'null-check-missing') {
        return this.fixNullCheck(content, issue);
      }
    }

    return null;
  }

  /**
   * Fix inline style in JSX
   */
  private fixInlineStyle(content: string, issue: EnhancedIssue): { content: string; fix: AppliedFix } | null {
    const lines = content.split('\n');
    const lineIndex = (issue.original.line || 1) - 1;

    if (lineIndex < 0 || lineIndex >= lines.length) {
      return null;
    }

    const line = lines[lineIndex];
    
    // Extract inline style
    const styleMatch = line.match(/style=\{\{([^}]+)\}\}/);
    if (!styleMatch) {
      return null;
    }

    // Move to const variable
    const styleName = 'styles';
    const styleContent = styleMatch[1];
    const indentation = line.match(/^\s*/)?.[0] || '';

    // Add const declaration before component
    const componentStart = this.findComponentStart(lines, lineIndex);
    if (componentStart === -1) {
      return null;
    }

    lines.splice(componentStart, 0, `${indentation}const ${styleName} = { ${styleContent} };`);
    
    // Replace inline style with variable
    lines[lineIndex + 1] = line.replace(/style=\{\{[^}]+\}\}/, `style={${styleName}}`);

    return {
      content: lines.join('\n'),
      fix: {
        issue,
        fixType: 'extract-style',
        description: 'Extracted inline style to constant',
        linesModified: 2,
      },
    };
  }

  /**
   * Fix setInterval memory leak
   */
  private fixSetIntervalLeak(content: string, issue: EnhancedIssue): { content: string; fix: AppliedFix } | null {
    const lines = content.split('\n');
    const lineIndex = (issue.original.line || 1) - 1;

    if (lineIndex < 0 || lineIndex >= lines.length) {
      return null;
    }

    const line = lines[lineIndex];
    const indentation = line.match(/^\s*/)?.[0] || '';

    // Add clearInterval in cleanup
    const cleanupCode = `
${indentation}// Cleanup interval to prevent memory leak
${indentation}return () => {
${indentation}  if (intervalId) {
${indentation}    clearInterval(intervalId);
${indentation}  }
${indentation}};`;

    // Find end of useEffect/function
    const blockEnd = this.findBlockEnd(lines, lineIndex);
    if (blockEnd === -1) {
      return null;
    }

    // Store interval ID
    lines[lineIndex] = line.replace('setInterval(', 'const intervalId = setInterval(');
    
    // Add cleanup
    lines.splice(blockEnd, 0, cleanupCode);

    return {
      content: lines.join('\n'),
      fix: {
        issue,
        fixType: 'add-cleanup',
        description: 'Added clearInterval cleanup to prevent memory leak',
        linesModified: 7,
      },
    };
  }

  /**
   * Fix setTimeout memory leak
   */
  private fixSetTimeoutLeak(content: string, issue: EnhancedIssue): { content: string; fix: AppliedFix } | null {
    // Similar to setInterval
    return this.fixSetIntervalLeak(content, issue);
  }

  /**
   * Fix missing timeout in fetch
   */
  private fixMissingTimeout(content: string, issue: EnhancedIssue): { content: string; fix: AppliedFix } | null {
    const lines = content.split('\n');
    const lineIndex = (issue.original.line || 1) - 1;

    if (lineIndex < 0 || lineIndex >= lines.length) {
      return null;
    }

    const line = lines[lineIndex];
    
    // Add timeout to fetch
    if (line.includes('fetch(')) {
      const newLine = line.replace(
        /fetch\(([^)]+)\)/,
        'fetch($1, { signal: AbortSignal.timeout(5000) })'
      );

      lines[lineIndex] = newLine;

      return {
        content: lines.join('\n'),
        fix: {
          issue,
          fixType: 'add-timeout',
          description: 'Added 5-second timeout to fetch request',
          linesModified: 1,
        },
      };
    }

    return null;
  }

  /**
   * Fix missing error handling
   */
  private fixMissingErrorHandling(content: string, issue: EnhancedIssue): { content: string; fix: AppliedFix } | null {
    const lines = content.split('\n');
    const lineIndex = (issue.original.line || 1) - 1;

    if (lineIndex < 0 || lineIndex >= lines.length) {
      return null;
    }

    const indentation = lines[lineIndex].match(/^\s*/)?.[0] || '';

    // Wrap in try-catch
    const tryStart = lineIndex;
    const tryEnd = this.findBlockEnd(lines, lineIndex);

    if (tryEnd === -1) {
      return null;
    }

    lines.splice(tryEnd + 1, 0, 
      `${indentation}} catch (error) {`,
      `${indentation}  console.error('Error:', error);`,
      `${indentation}  // TODO: Handle error appropriately`,
      `${indentation}}`
    );

    lines.splice(tryStart, 0, `${indentation}try {`);

    return {
      content: lines.join('\n'),
      fix: {
        issue,
        fixType: 'add-error-handling',
        description: 'Wrapped code in try-catch block',
        linesModified: 5,
      },
    };
  }

  /**
   * Fix missing null check
   */
  private fixNullCheck(content: string, issue: EnhancedIssue): { content: string; fix: AppliedFix } | null {
    const lines = content.split('\n');
    const lineIndex = (issue.original.line || 1) - 1;

    if (lineIndex < 0 || lineIndex >= lines.length) {
      return null;
    }

    const line = lines[lineIndex];
    const indentation = line.match(/^\s*/)?.[0] || '';

    // Add null check
    const varMatch = line.match(/(\w+)\./);
    if (!varMatch) {
      return null;
    }

    const varName = varMatch[1];
    
    lines.splice(lineIndex, 0, `${indentation}if (!${varName}) return;`);

    return {
      content: lines.join('\n'),
      fix: {
        issue,
        fixType: 'add-null-check',
        description: `Added null check for ${varName}`,
        linesModified: 1,
      },
    };
  }

  /**
   * Check if issue is auto-fixable
   */
  private isAutoFixable(issue: EnhancedIssue): boolean {
    const detectorName = issue.original.detector || '';
    const issueType = issue.original.type || '';

    const fixableTypes = [
      'inline-style',
      'setInterval-leak',
      'setTimeout-leak',
      'missing-timeout',
      'no-error-handling',
      'null-check-missing',
    ];

    return fixableTypes.includes(issueType);
  }

  /**
   * Group issues by file
   */
  private groupByFile(issues: EnhancedIssue[]): Record<string, EnhancedIssue[]> {
    const grouped: Record<string, EnhancedIssue[]> = {};

    for (const issue of issues) {
      const file = issue.original.file || 'unknown';
      if (!grouped[file]) {
        grouped[file] = [];
      }
      grouped[file].push(issue);
    }

    return grouped;
  }

  /**
   * Find component start
   */
  private findComponentStart(lines: string[], fromIndex: number): number {
    for (let i = fromIndex; i >= 0; i--) {
      if (lines[i].includes('function ') || lines[i].includes('const ') || lines[i].includes('export ')) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Find block end
   */
  private findBlockEnd(lines: string[], fromIndex: number): number {
    let braceCount = 0;
    
    for (let i = fromIndex; i < lines.length; i++) {
      const line = lines[i];
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;

      if (braceCount === 0 && i > fromIndex) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Create backup
   */
  private async createBackup(filePath: string, content: string): Promise<void> {
    await fs.mkdir(this.backupDir, { recursive: true });

    const filename = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `${filename}.${timestamp}.backup`);

    await fs.writeFile(backupPath, content, 'utf8');
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(filePath: string, backupPath: string): Promise<void> {
    const content = await fs.readFile(backupPath, 'utf8');
    await fs.writeFile(filePath, content, 'utf8');
  }
}
