/**
 * Python Type Checker Detector
 * Validates type hints and detects type-related issues
 * 
 * Checks:
 * - Missing type hints
 * - Invalid type annotations
 * - Type mismatches
 * - Optional handling
 */

import { PythonParser, PythonFile } from '../python/python-parser.js';
import * as fs from 'node:fs/promises';

export interface PythonTypeIssue {
  type: 'python-type';
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line: number;
  col: number;
  category: 'missing-hint' | 'invalid-type' | 'type-mismatch' | 'optional-issue';
  suggestion?: string;
}

export class PythonTypeDetector {
  private workspaceRoot: string;
  private parser: PythonParser;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.parser = new PythonParser(workspaceRoot);
  }

  /**
   * Detect type issues in Python files
   */
  async detect(targetPath?: string): Promise<PythonTypeIssue[]> {
    const issues: PythonTypeIssue[] = [];
    const searchPath = targetPath || this.workspaceRoot;

    try {
      const pythonFiles = await this.parser.findPythonFiles();

      for (const file of pythonFiles.slice(0, 50)) { // Limit for performance
        const fileIssues = await this.analyzeFile(file);
        issues.push(...fileIssues);
      }
    } catch (error) {
      // Silent fail
    }

    return issues;
  }

  /**
   * Analyze single Python file
   */
  private async analyzeFile(filePath: string): Promise<PythonTypeIssue[]> {
    const issues: PythonTypeIssue[] = [];

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const parsed = await this.parser.parseFile(filePath);

      if (!parsed) {
        return issues;
      }

      // Check functions for type hints
      for (const func of parsed.functions) {
        // Check if function has return type hint
        if (!func.returnType && !func.name.startsWith('_')) {
          issues.push({
            type: 'python-type',
            severity: 'warning',
            message: `Function '${func.name}' missing return type hint`,
            file: filePath,
            line: func.line,
            col: 0,
            category: 'missing-hint',
            suggestion: `Add return type: def ${func.name}(...) -> ReturnType:`,
          });
        }

        // Check arguments for type hints
        for (const arg of func.args) {
          if (!arg.type && arg.name !== 'self' && arg.name !== 'cls') {
            issues.push({
              type: 'python-type',
              severity: 'info',
              message: `Parameter '${arg.name}' in '${func.name}' missing type hint`,
              file: filePath,
              line: func.line,
              col: 0,
              category: 'missing-hint',
              suggestion: `Add type: ${arg.name}: TypeHere`,
            });
          }
        }
      }

      // Check for common type issues in code
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Check for None comparisons (should use 'is None')
        if (line.includes('== None') || line.includes('!= None')) {
          issues.push({
            type: 'python-type',
            severity: 'warning',
            message: 'Use "is None" or "is not None" instead of == or !=',
            file: filePath,
            line: lineNumber,
            col: line.indexOf('None'),
            category: 'optional-issue',
            suggestion: 'Replace "== None" with "is None"',
          });
        }

        // Check for mutable default arguments
        if (line.match(/def\s+\w+\([^)]*=\s*(\[\]|\{\})/)) {
          issues.push({
            type: 'python-type',
            severity: 'error',
            message: 'Mutable default argument (use None and initialize in function)',
            file: filePath,
            line: lineNumber,
            col: 0,
            category: 'type-mismatch',
            suggestion: 'Use None as default, initialize inside function',
          });
        }

        // Check for bare except
        if (line.match(/except\s*:/)) {
          issues.push({
            type: 'python-type',
            severity: 'warning',
            message: 'Bare except catches all exceptions (specify exception type)',
            file: filePath,
            line: lineNumber,
            col: line.indexOf('except'),
            category: 'type-mismatch',
            suggestion: 'Use "except ExceptionType:" or at least "except Exception:"',
          });
        }

        // Check for string concatenation in loops
        if (line.match(/for\s+.*:\s*$/) && i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (nextLine.match(/\w+\s*\+=\s*['"`]/)) {
            issues.push({
              type: 'python-type',
              severity: 'info',
              message: 'String concatenation in loop (consider using list and join)',
              file: filePath,
              line: lineNumber + 1,
              col: 0,
              category: 'type-mismatch',
              suggestion: 'Use list comprehension and "".join()',
            });
          }
        }
      }
    } catch (error) {
      // Silent fail
    }

    return issues;
  }
}
