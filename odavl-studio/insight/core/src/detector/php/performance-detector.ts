/**
 * @fileoverview Detects PHP performance issues
 * Common patterns: N+1 queries, inefficient loops, repeated operations
 */

import { PhpBaseDetector, type PhpDetectorOptions, type PhpIssue } from './php-base-detector';
import type { DetectorResult } from '../../types';

export class PerformanceDetector extends PhpBaseDetector {
  constructor(options: PhpDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isPhpFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'performance' };
    }

    const issues: PhpIssue[] = [];
    const lines = content.split('\n');

    // N+1 query detection
    this.detectNPlusOneQueries(lines, filePath, issues);

    // Inefficient loops
    this.detectInefficientLoops(lines, filePath, issues);

    // Repeated operations
    this.detectRepeatedOperations(lines, filePath, issues);

    // Unnecessary database connections
    this.detectRedundantDbConnections(lines, filePath, issues);

    return {
      issues,
      duration: 0,
      detectorName: 'performance',
    };
  }

  /**
   * Detect N+1 query problems
   */
  private detectNPlusOneQueries(
    lines: string[],
    filePath: string,
    issues: PhpIssue[]
  ): void {
    let inLoop = false;
    let loopStart = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (/\b(?:foreach|for|while)\b/.test(line)) {
        inLoop = true;
        loopStart = i;
      } else if (inLoop && /^\s*\}/.test(line)) {
        inLoop = false;
      }

      // Query inside loop
      if (
        inLoop &&
        /(?:query|execute|prepare|select|insert|update|delete)\s*\(/i.test(line)
      ) {
        issues.push(
          this.createIssue(
            'performance',
            'N+1 Query: Database query inside loop - fetch all data in single query',
            filePath,
            i + 1,
            line.search(/query|execute|select/i), 'high' ,
            'performance-detector',
            undefined,
            'Use JOIN or WHERE IN clause to fetch all data at once'
          )
        );
      }
    }
  }

  /**
   * Detect inefficient loop patterns
   */
  private detectInefficientLoops(
    lines: string[],
    filePath: string,
    issues: PhpIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern: count() in loop condition
      if (/for\s*\([^;]*;\s*[^;]*count\s*\([^)]*\)/.test(line)) {
        issues.push(
          this.createIssue(
            'performance',
            'Inefficient Loop: count() called on every iteration',
            filePath,
            i + 1,
            line.indexOf('count'), 'high' ,
            'performance-detector',
            undefined,
            'Store count in variable: $len = count($arr); for (...; $i < $len; ...)'
          )
        );
      }

      // Pattern: array_push in loop
      if (/\bforeach\b/.test(line)) {
        for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
          if (/array_push\s*\(/.test(lines[j])) {
            issues.push(
              this.createIssue(
                'performance',
                'Inefficient: array_push() in loop - use $arr[] = $val',
                filePath,
                j + 1,
                lines[j].indexOf('array_push'),
                'info',
                'performance-detector',
                undefined,
                'Replace array_push($arr, $val) with $arr[] = $val (faster)'
              )
            );
            break;
          }
          if (/^\s*\}/.test(lines[j])) break;
        }
      }
    }
  }

  /**
   * Detect repeated operations that could be cached
   */
  private detectRepeatedOperations(
    lines: string[],
    filePath: string,
    issues: PhpIssue[]
  ): void {
    const operations = new Map<string, number[]>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Track expensive operations
      const expensiveOps = [
        'file_get_contents',
        'json_decode',
        'unserialize',
        'preg_match',
        'explode',
        'str_replace',
      ];

      for (const op of expensiveOps) {
        const regex = new RegExp(`${op}\\s*\\([^)]+\\)`, 'g');
        const matches = line.match(regex);
        
        if (matches) {
          for (const match of matches) {
            if (!operations.has(match)) {
              operations.set(match, []);
            }
            operations.get(match)!.push(i + 1);
          }
        }
      }
    }

    // Report operations repeated 3+ times
    for (const [op, lineNumbers] of operations.entries()) {
      if (lineNumbers.length >= 3) {
        issues.push(
          this.createIssue(
            'performance',
            `Repeated Operation: ${op.split('(')[0]}() called ${lineNumbers.length} times - cache result`,
            filePath,
            lineNumbers[0],
            0,
            'info',
            'performance-detector',
            undefined,
            'Store result in variable and reuse'
          )
        );
      }
    }
  }

  /**
   * Detect redundant database connections
   */
  private detectRedundantDbConnections(
    lines: string[],
    filePath: string,
    issues: PhpIssue[]
  ): void {
    let connectionCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (
        /new\s+PDO\s*\(|mysqli_connect\s*\(|pg_connect\s*\(/i.test(line)
      ) {
        connectionCount++;
        
        if (connectionCount > 1) {
          issues.push(
            this.createIssue(
              'performance',
              'Multiple Database Connections: Reuse existing connection',
              filePath,
              i + 1,
              line.search(/PDO|mysqli|pg_connect/i), 'high' ,
              'performance-detector',
              undefined,
              'Use singleton pattern or dependency injection for DB connection'
            )
          );
        }
      }
    }
  }
}
