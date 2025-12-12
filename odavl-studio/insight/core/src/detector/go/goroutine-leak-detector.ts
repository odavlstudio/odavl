/**
 * @fileoverview Detects goroutine leaks - a common Go concurrency bug
 * Goroutine leaks happen when goroutines are created but never terminate
 */

import { GoBaseDetector, type GoDetectorOptions, type GoIssue } from './go-base-detector';
import type { DetectorResult } from '../../types';

interface GoroutinePattern {
  pattern: RegExp;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'goroutine';
}

export class GoroutineLeakDetector extends GoBaseDetector {
  private readonly patterns: GoroutinePattern[] = [
    {
      pattern: /go\s+func\s*\([^)]*\)\s*\{[^}]*for\s+\{/g,
      message: 'Potential goroutine leak: infinite loop without exit condition',
      severity: 'critical',
      category: 'goroutine',
    },
    {
      pattern: /go\s+func\s*\([^)]*\)\s*\{[^}]*(?!select|<-|time\.After|context\.Done)/g,
      message: 'Goroutine may leak: no context cancellation or timeout mechanism',
      severity: 'high',
      category: 'goroutine',
    },
    {
      pattern: /go\s+func\s*\([^)]*\)\s*\{[^}]*<-[^}]*(?!select)/g,
      message: 'Goroutine blocking on channel without select - may cause deadlock',
      severity: 'high',
      category: 'goroutine',
    },
    {
      pattern: /go\s+func\s*\([^)]*\)\s*\{(?![\s\S]*defer)/g,
      message: 'Goroutine without defer - consider adding cleanup logic',
      severity: 'high',
      category: 'goroutine',
    },
  ];

  constructor(options: GoDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isGoFile(filePath) && !this.isGoTestFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'goroutine-leak' };
    }

    const issues: GoIssue[] = [];
    const lines = content.split('\n');

    // Check for goroutine leak patterns
    for (const pattern of this.patterns) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (pattern.pattern.test(line)) {
          issues.push(
            this.createIssue(
              pattern.category,
              pattern.message,
              filePath,
              i + 1,
              0,
              pattern.severity,
              'goroutine-leak-detector'
            )
          );
        }
        // Reset regex lastIndex for global patterns
        pattern.pattern.lastIndex = 0;
      }
    }

    // Check for missing WaitGroup
    this.detectMissingWaitGroup(content, filePath, lines, issues);

    // Check for goroutines in defer
    this.detectDeferredGoroutines(content, filePath, lines, issues);

    return {
      issues,
      duration: 0,
      detectorName: 'goroutine-leak',
    };
  }

  /**
   * Detect goroutines without WaitGroup synchronization
   */
  private detectMissingWaitGroup(
    content: string,
    filePath: string,
    lines: string[],
    issues: GoIssue[]
  ): void {
    const hasGoroutine = /go\s+func|go\s+\w+\(/.test(content);
    const hasWaitGroup = /sync\.WaitGroup|\.Wait\(\)|\.Add\(|\.Done\(\)/.test(content);

    if (hasGoroutine && !hasWaitGroup) {
      for (let i = 0; i < lines.length; i++) {
        if (/go\s+func|go\s+\w+\(/.test(lines[i])) {
          issues.push(
            this.createIssue(
              'goroutine',
              'Goroutine created without WaitGroup - parent may exit before goroutine completes',
              filePath,
              i + 1,
              0,
              'high',
              'goroutine-leak-detector'
            )
          );
        }
      }
    }
  }

  /**
   * Detect goroutines in defer statements (anti-pattern)
   */
  private detectDeferredGoroutines(
    content: string,
    filePath: string,
    lines: string[],
    issues: GoIssue[]
  ): void {
    const deferGoPattern = /defer\s+go\s+/g;

    for (let i = 0; i < lines.length; i++) {
      if (deferGoPattern.test(lines[i])) {
        issues.push(
          this.createIssue(
            'goroutine',
            'Anti-pattern: defer with go keyword - goroutine may not execute',
            filePath,
            i + 1,
            0,
            'critical',
            'goroutine-leak-detector'
          )
        );
      }
      deferGoPattern.lastIndex = 0;
    }
  }
}
