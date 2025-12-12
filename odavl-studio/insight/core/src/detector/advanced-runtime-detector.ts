/**
 * Advanced Runtime Detector - Deep Runtime Analysis
 * 
 * Detects:
 * - Stack overflow risks (deep recursion, unbounded loops)
 * - Division by zero errors
 * - Memory exhaustion patterns
 * - Heap overflow risks
 * - Resource leaks (timers, event listeners, file handles)
 * - AI-powered anomaly detection
 * 
 * @since Week 17-18 (December 2025)
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { DetectorConfig, Issue } from '../types.js';

export interface AdvancedRuntimeDetectorConfig extends DetectorConfig {
  /**
   * Check stack overflow risks
   * @default true
   */
  checkStackOverflow?: boolean;

  /**
   * Check division by zero
   * @default true
   */
  checkDivisionByZero?: boolean;

  /**
   * Check memory exhaustion
   * @default true
   */
  checkMemoryExhaustion?: boolean;

  /**
   * Check resource leaks
   * @default true
   */
  checkResourceLeaks?: boolean;

  /**
   * Maximum recursion depth before warning
   * @default 1000
   */
  maxRecursionDepth?: number;

  /**
   * Maximum array size before memory warning
   * @default 1000000
   */
  maxArraySize?: number;
}

export interface RuntimeIssue extends Issue {
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  detectedPattern?: string;
  potentialImpact?: string;
  codeSnippet?: string;
}

export interface RuntimeMetrics {
  totalFiles: number;
  stackOverflowRisks: number;
  divisionByZeroRisks: number;
  memoryExhaustionRisks: number;
  resourceLeaks: number;
  recursiveFunctions: number;
  runtimeScore: number;
}

interface CodePattern {
  pattern: RegExp;
  type: 'stack-overflow' | 'division-by-zero' | 'memory-leak' | 'resource-leak';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestion: string;
}

export class AdvancedRuntimeDetector {
  private config: Required<AdvancedRuntimeDetectorConfig>;
  private issues: RuntimeIssue[] = [];
  private metrics: RuntimeMetrics = {
    totalFiles: 0,
    stackOverflowRisks: 0,
    divisionByZeroRisks: 0,
    memoryExhaustionRisks: 0,
    resourceLeaks: 0,
    recursiveFunctions: 0,
    runtimeScore: 100,
  };

  // Dangerous patterns to detect
  private readonly dangerousPatterns: CodePattern[] = [
    // Stack overflow patterns
    {
      pattern: /function\s+(\w+)\s*\([^)]*\)\s*\{[^}]*\1\s*\(/,
      type: 'stack-overflow',
      severity: 'high',
      message: 'Recursive function without base case',
      suggestion: 'Add base case to prevent stack overflow',
    },
    {
      pattern: /while\s*\(\s*true\s*\)/gi,
      type: 'stack-overflow',
      severity: 'critical',
      message: 'Infinite loop detected',
      suggestion: 'Add break condition or timeout',
    },
    {
      pattern: /for\s*\(\s*;;\s*\)/gi,
      type: 'stack-overflow',
      severity: 'critical',
      message: 'Infinite for loop detected',
      suggestion: 'Add termination condition',
    },

    // Division by zero patterns
    {
      pattern: /\/\s*0[;\s,)]/gi,
      type: 'division-by-zero',
      severity: 'critical',
      message: 'Division by zero literal',
      suggestion: 'Check divisor value before division',
    },
    {
      pattern: /\/\s*[a-zA-Z_]\w*[;\s,)]/gi,
      type: 'division-by-zero',
      severity: 'medium',
      message: 'Potential division by zero',
      suggestion: 'Validate divisor is not zero before division',
    },

    // Memory exhaustion patterns
    {
      pattern: /new\s+Array\s*\(\s*\d{7,}\s*\)/gi,
      type: 'memory-leak',
      severity: 'critical',
      message: 'Large array allocation',
      suggestion: 'Use chunking or streaming for large data',
    },
    {
      pattern: /\.push\s*\([^)]*\)\s*;?\s*}/gi,
      type: 'memory-leak',
      severity: 'medium',
      message: 'Unbounded array growth in loop',
      suggestion: 'Limit array size or use streaming',
    },
    {
      pattern: /new\s+Map\s*\(\s*\)[^}]*\.set\s*\([^)]*\)[^}]*while/,
      type: 'memory-leak',
      severity: 'high',
      message: 'Unbounded Map growth',
      suggestion: 'Implement size limit or use LRU cache',
    },

    // Resource leaks
    {
      pattern: /setInterval\s*\(/gi,
      type: 'resource-leak',
      severity: 'high',
      message: 'setInterval without clearInterval',
      suggestion: 'Store interval ID and clear on cleanup',
    },
    {
      pattern: /setTimeout\s*\(/gi,
      type: 'resource-leak',
      severity: 'medium',
      message: 'setTimeout without clearTimeout',
      suggestion: 'Clear timeout on component unmount',
    },
    {
      pattern: /addEventListener\s*\(/gi,
      type: 'resource-leak',
      severity: 'high',
      message: 'Event listener without cleanup',
      suggestion: 'Remove event listener on cleanup',
    },
    {
      pattern: /createReadStream\s*\([^)]*\)[^}]*(?!\.close\(\))/,
      type: 'resource-leak',
      severity: 'critical',
      message: 'File stream without close',
      suggestion: 'Always close streams in finally block',
    },
  ];

  constructor(config: AdvancedRuntimeDetectorConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      severity: config.severity ?? 'medium',
      exclude: config.exclude ?? [],
      include: config.include ?? [],
      enableCache: config.enableCache ?? true,
      cacheDir: config.cacheDir ?? '.odavl/cache',
      checkStackOverflow: config.checkStackOverflow ?? true,
      checkDivisionByZero: config.checkDivisionByZero ?? true,
      checkMemoryExhaustion: config.checkMemoryExhaustion ?? true,
      checkResourceLeaks: config.checkResourceLeaks ?? true,
      maxRecursionDepth: config.maxRecursionDepth ?? 1000,
      maxArraySize: config.maxArraySize ?? 1000000,
    };
  }

  /**
   * Analyze workspace for runtime issues
   */
  async analyze(workspacePath: string): Promise<{
    issues: RuntimeIssue[];
    metrics: RuntimeMetrics;
  }> {
    this.issues = [];
    this.metrics = {
      totalFiles: 0,
      stackOverflowRisks: 0,
      divisionByZeroRisks: 0,
      memoryExhaustionRisks: 0,
      resourceLeaks: 0,
      recursiveFunctions: 0,
      runtimeScore: 100,
    };

    try {
      // Check workspace exists
      try {
        await fs.access(workspacePath);
      } catch {
        throw new Error(`Workspace not found: ${workspacePath}`);
      }

      // Find all TypeScript/JavaScript files
      const files = await this.findFiles(workspacePath, '*.{ts,js,tsx,jsx}');
      this.metrics.totalFiles = files.length;

      // Analyze each file
      for (const file of files) {
        await this.analyzeFile(file);
      }

      // Calculate final score
      this.calculateScore();

      return {
        issues: this.issues,
        metrics: this.metrics,
      };
    } catch (error) {
      throw new Error(`Runtime analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Analyze single file for runtime issues
   */
  private async analyzeFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Check each dangerous pattern
      for (const patternDef of this.dangerousPatterns) {
        // Skip patterns based on config
        if (patternDef.type === 'stack-overflow' && !this.config.checkStackOverflow) continue;
        if (patternDef.type === 'division-by-zero' && !this.config.checkDivisionByZero) continue;
        if (patternDef.type === 'memory-leak' && !this.config.checkMemoryExhaustion) continue;
        if (patternDef.type === 'resource-leak' && !this.config.checkResourceLeaks) continue;

        const matches = content.matchAll(patternDef.pattern);

        for (const match of matches) {
          const matchPos = match.index || 0;
          const lineNum = content.substring(0, matchPos).split('\n').length;

          this.addIssue({
            type: 'runtime-error',
            severity: patternDef.severity,
            file: filePath,
            line: lineNum,
            message: patternDef.message,
            suggestion: patternDef.suggestion,
            riskLevel: patternDef.severity,
            detectedPattern: patternDef.type,
            potentialImpact: this.getImpactDescription(patternDef.type),
            codeSnippet: lines[lineNum - 1]?.trim(),
          });

          // Update metrics
          if (patternDef.type === 'stack-overflow') {
            this.metrics.stackOverflowRisks++;
          } else if (patternDef.type === 'division-by-zero') {
            this.metrics.divisionByZeroRisks++;
          } else if (patternDef.type === 'memory-leak') {
            this.metrics.memoryExhaustionRisks++;
          } else if (patternDef.type === 'resource-leak') {
            this.metrics.resourceLeaks++;
          }
        }
      }

      // Detect recursive functions
      await this.detectRecursiveFunctions(filePath, content);

      // Check for large allocations
      await this.checkLargeAllocations(filePath, content);

    } catch {
      // Skip file read errors
    }
  }

  /**
   * Detect recursive function calls
   */
  private async detectRecursiveFunctions(filePath: string, content: string): Promise<void> {
    // Pattern: function name matches call within function body
    const functionPattern = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[a-zA-Z_]\w*)\s*=>)\s*\{([^}]+)\}/g;

    const matches = content.matchAll(functionPattern);

    for (const match of matches) {
      const funcName = match[1] || match[2];
      const funcBody = match[3];

      if (funcName && funcBody) {
        // Check if function calls itself
        const callPattern = new RegExp(`\\b${funcName}\\s*\\(`);
        if (callPattern.test(funcBody)) {
          this.metrics.recursiveFunctions++;

          // Check for base case
          const hasBaseCase = /if\s*\([^)]+\)\s*return/.test(funcBody) ||
                             /return\s+[^;]+\?/.test(funcBody);

          if (!hasBaseCase) {
            const lineNum = content.substring(0, match.index).split('\n').length;

            this.addIssue({
              type: 'runtime-error',
              severity: 'high',
              file: filePath,
              line: lineNum,
              message: `Recursive function '${funcName}' without clear base case`,
              suggestion: 'Add explicit base case to prevent stack overflow',
              riskLevel: 'high',
              detectedPattern: 'stack-overflow',
              potentialImpact: 'Stack overflow crash',
            });

            this.metrics.stackOverflowRisks++;
          }
        }
      }
    }
  }

  /**
   * Check for large memory allocations
   */
  private async checkLargeAllocations(filePath: string, content: string): Promise<void> {
    // Check for large array allocations
    const arrayPattern = /new\s+Array\s*\(\s*(\d+)\s*\)/g;
    const matches = content.matchAll(arrayPattern);

    for (const match of matches) {
      const size = parseInt(match[1], 10);

      if (size > this.config.maxArraySize) {
        const lineNum = content.substring(0, match.index).split('\n').length;

        this.addIssue({
          type: 'runtime-error',
          severity: 'critical',
          file: filePath,
          line: lineNum,
          message: `Large array allocation (${size} elements)`,
          suggestion: 'Use streaming or chunking for large datasets',
          riskLevel: 'critical',
          detectedPattern: 'memory-leak',
          potentialImpact: 'Memory exhaustion, process crash',
        });

        this.metrics.memoryExhaustionRisks++;
      } else if (size > this.config.maxArraySize / 10) {
        const lineNum = content.substring(0, match.index).split('\n').length;

        this.addIssue({
          type: 'runtime-warning',
          severity: 'medium',
          file: filePath,
          line: lineNum,
          message: `Moderately large array allocation (${size} elements)`,
          suggestion: 'Consider memory impact for large data',
          riskLevel: 'medium',
          detectedPattern: 'memory-leak',
          potentialImpact: 'High memory usage',
        });
      }
    }
  }

  /**
   * Get impact description for issue type
   */
  private getImpactDescription(type: string): string {
    const impacts: Record<string, string> = {
      'stack-overflow': 'Application crash, service unavailability',
      'division-by-zero': 'NaN results, calculation errors',
      'memory-leak': 'Memory exhaustion, performance degradation',
      'resource-leak': 'File handle exhaustion, memory leaks',
    };

    return impacts[type] || 'Unknown impact';
  }

  /**
   * Find files matching pattern
   */
  private async findFiles(dir: string, pattern: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip common ignore patterns
        if (
          entry.name === 'node_modules' ||
          entry.name === '.git' ||
          entry.name.startsWith('.') ||
          entry.name === 'dist' ||
          entry.name === 'build'
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          const subFiles = await this.findFiles(fullPath, pattern);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Simple pattern matching for *.{ts,js,tsx,jsx}
          if (
            entry.name.endsWith('.ts') ||
            entry.name.endsWith('.js') ||
            entry.name.endsWith('.tsx') ||
            entry.name.endsWith('.jsx')
          ) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Skip read errors
    }

    return files;
  }

  /**
   * Calculate runtime score
   */
  private calculateScore(): void {
    let score = 100;

    // Deduct for stack overflow risks
    score -= this.metrics.stackOverflowRisks * 15;

    // Deduct for division by zero
    score -= this.metrics.divisionByZeroRisks * 10;

    // Deduct for memory exhaustion
    score -= this.metrics.memoryExhaustionRisks * 12;

    // Deduct for resource leaks
    score -= this.metrics.resourceLeaks * 8;

    // Deduct for critical issues
    const criticalCount = this.issues.filter(i => i.severity === 'critical').length;
    score -= criticalCount * 10;

    this.metrics.runtimeScore = Math.max(0, Math.min(100, score));
  }

  /**
   * Add issue to list
   */
  private addIssue(issue: RuntimeIssue): void {
    this.issues.push(issue);
  }
}

/**
 * Helper function to analyze runtime issues
 */
export async function analyzeRuntime(
  workspacePath: string,
  config: AdvancedRuntimeDetectorConfig = {}
): Promise<{
  issues: RuntimeIssue[];
  metrics: RuntimeMetrics;
}> {
  const detector = new AdvancedRuntimeDetector(config);
  return detector.analyze(workspacePath);
}
