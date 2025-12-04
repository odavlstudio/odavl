/**
 * Python Complexity Detector
 * Analyzes code complexity metrics
 * 
 * Metrics:
 * - Cyclomatic complexity (McCabe)
 * - Cognitive complexity
 * - Lines of code
 * - Function length
 * - Class complexity
 */

import { PythonParser, PythonFile } from '../python/python-parser.js';
import * as fs from 'node:fs/promises';

export interface PythonComplexityIssue {
  type: 'python-complexity';
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line: number;
  category: 'cyclomatic' | 'cognitive' | 'length' | 'nesting';
  complexity: number;
  threshold: number;
  suggestion: string;
}

export class PythonComplexityDetector {
  private workspaceRoot: string;
  private parser: PythonParser;

  // Complexity thresholds
  private readonly thresholds = {
    cyclomaticComplexity: 10,
    cognitiveComplexity: 15,
    functionLength: 50,
    classLength: 300,
    nestingLevel: 4,
  };

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.parser = new PythonParser(workspaceRoot);
  }

  /**
   * Detect complexity issues
   */
  async detect(targetPath?: string): Promise<PythonComplexityIssue[]> {
    const issues: PythonComplexityIssue[] = [];

    try {
      const pythonFiles = await this.parser.findPythonFiles();

      for (const file of pythonFiles.slice(0, 50)) {
        const fileIssues = await this.analyzeFile(file);
        issues.push(...fileIssues);
      }
    } catch (error) {
      // Silent fail
    }

    return issues;
  }

  /**
   * Analyze single file
   */
  private async analyzeFile(filePath: string): Promise<PythonComplexityIssue[]> {
    const issues: PythonComplexityIssue[] = [];

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const parsed = await this.parser.parseFile(filePath);

      if (!parsed) {
        return issues;
      }

      // Analyze functions
      for (const func of parsed.functions) {
        const funcContent = this.extractFunctionContent(content, func.line, func.endLine);
        
        // Cyclomatic complexity
        const cyclomaticComplexity = this.calculateCyclomaticComplexity(funcContent);
        if (cyclomaticComplexity > this.thresholds.cyclomaticComplexity) {
          issues.push({
            type: 'python-complexity',
            severity: cyclomaticComplexity > 20 ? 'error' : 'warning',
            message: `Function '${func.name}' has high cyclomatic complexity (${cyclomaticComplexity})`,
            file: filePath,
            line: func.line,
            category: 'cyclomatic',
            complexity: cyclomaticComplexity,
            threshold: this.thresholds.cyclomaticComplexity,
            suggestion: 'Refactor into smaller functions, reduce branching logic',
          });
        }

        // Cognitive complexity
        const cognitiveComplexity = this.calculateCognitiveComplexity(funcContent);
        if (cognitiveComplexity > this.thresholds.cognitiveComplexity) {
          issues.push({
            type: 'python-complexity',
            severity: 'warning',
            message: `Function '${func.name}' has high cognitive complexity (${cognitiveComplexity})`,
            file: filePath,
            line: func.line,
            category: 'cognitive',
            complexity: cognitiveComplexity,
            threshold: this.thresholds.cognitiveComplexity,
            suggestion: 'Simplify logic, extract complex conditions into helper functions',
          });
        }

        // Function length
        const funcLength = func.endLine - func.line;
        if (funcLength > this.thresholds.functionLength) {
          issues.push({
            type: 'python-complexity',
            severity: 'info',
            message: `Function '${func.name}' is too long (${funcLength} lines)`,
            file: filePath,
            line: func.line,
            category: 'length',
            complexity: funcLength,
            threshold: this.thresholds.functionLength,
            suggestion: 'Break down into smaller, focused functions',
          });
        }

        // Nesting level
        const maxNesting = this.calculateMaxNesting(funcContent);
        if (maxNesting > this.thresholds.nestingLevel) {
          issues.push({
            type: 'python-complexity',
            severity: 'warning',
            message: `Function '${func.name}' has deep nesting (${maxNesting} levels)`,
            file: filePath,
            line: func.line,
            category: 'nesting',
            complexity: maxNesting,
            threshold: this.thresholds.nestingLevel,
            suggestion: 'Use early returns, extract nested logic into functions',
          });
        }
      }

      // Analyze classes
      for (const cls of parsed.classes) {
        const classLength = cls.endLine - cls.line;
        
        if (classLength > this.thresholds.classLength) {
          issues.push({
            type: 'python-complexity',
            severity: 'info',
            message: `Class '${cls.name}' is too long (${classLength} lines)`,
            file: filePath,
            line: cls.line,
            category: 'length',
            complexity: classLength,
            threshold: this.thresholds.classLength,
            suggestion: 'Consider splitting into multiple classes (Single Responsibility Principle)',
          });
        }
      }
    } catch (error) {
      // Silent fail
    }

    return issues;
  }

  /**
   * Calculate cyclomatic complexity
   */
  private calculateCyclomaticComplexity(code: string): number {
    let complexity = 1;

    // Decision points
    complexity += (code.match(/\bif\b/g) || []).length;
    complexity += (code.match(/\belif\b/g) || []).length;
    complexity += (code.match(/\bfor\b/g) || []).length;
    complexity += (code.match(/\bwhile\b/g) || []).length;
    complexity += (code.match(/\band\b/g) || []).length;
    complexity += (code.match(/\bor\b/g) || []).length;
    complexity += (code.match(/\bexcept\b/g) || []).length;
    complexity += (code.match(/\bwith\b/g) || []).length;

    // List comprehensions add complexity
    complexity += (code.match(/\[.*\bfor\b.*\]/g) || []).length;

    return complexity;
  }

  /**
   * Calculate cognitive complexity
   */
  private calculateCognitiveComplexity(code: string): number {
    let complexity = 0;
    let nestingLevel = 0;

    const lines = code.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Ignore comments and empty lines
      if (trimmed.startsWith('#') || trimmed === '') {
        continue;
      }

      // Nesting increases cognitive load
      if (trimmed.startsWith('if ') || trimmed.startsWith('elif ')) {
        complexity += 1 + nestingLevel;
        nestingLevel++;
      } else if (trimmed.startsWith('for ') || trimmed.startsWith('while ')) {
        complexity += 1 + nestingLevel;
        nestingLevel++;
      } else if (trimmed.startsWith('try:')) {
        complexity += 1 + nestingLevel;
        nestingLevel++;
      } else if (trimmed.startsWith('except ')) {
        complexity += 1 + nestingLevel;
      } else if (trimmed.startsWith('with ')) {
        complexity += 1 + nestingLevel;
        nestingLevel++;
      }

      // Boolean operators add cognitive load
      if (trimmed.includes(' and ') || trimmed.includes(' or ')) {
        complexity += 1;
      }

      // Decrease nesting on dedent (simplified)
      if (line.match(/^\s{0,3}\S/) && nestingLevel > 0) {
        nestingLevel = Math.max(0, nestingLevel - 1);
      }
    }

    return complexity;
  }

  /**
   * Calculate maximum nesting level
   */
  private calculateMaxNesting(code: string): number {
    let maxNesting = 0;
    let currentNesting = 0;

    const lines = code.split('\n');
    let prevIndent = 0;

    for (const line of lines) {
      if (line.trim() === '' || line.trim().startsWith('#')) {
        continue;
      }

      // Calculate indentation
      const indent = line.match(/^\s*/)?.[0].length || 0;

      // Check for block-starting keywords
      const trimmed = line.trim();
      if (trimmed.endsWith(':') && 
          (trimmed.startsWith('if ') || 
           trimmed.startsWith('elif ') ||
           trimmed.startsWith('else:') ||
           trimmed.startsWith('for ') ||
           trimmed.startsWith('while ') ||
           trimmed.startsWith('try:') ||
           trimmed.startsWith('except ') ||
           trimmed.startsWith('with '))) {
        
        if (indent > prevIndent) {
          currentNesting++;
          maxNesting = Math.max(maxNesting, currentNesting);
        }
      } else if (indent < prevIndent) {
        currentNesting = Math.max(0, currentNesting - 1);
      }

      prevIndent = indent;
    }

    return maxNesting;
  }

  /**
   * Extract function content
   */
  private extractFunctionContent(code: string, startLine: number, endLine: number): string {
    const lines = code.split('\n');
    return lines.slice(startLine - 1, endLine).join('\n');
  }
}
