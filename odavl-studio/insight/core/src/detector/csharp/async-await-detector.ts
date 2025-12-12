/**
 * @fileoverview Detects async/await misuse patterns in C#
 * async/await is powerful but easy to misuse, causing deadlocks and performance issues
 */

import { CSharpBaseDetector, type CSharpDetectorOptions, type CSharpIssue } from './csharp-base-detector';
import type { DetectorResult } from '../../types';

export class AsyncAwaitDetector extends CSharpBaseDetector {
  constructor(options: CSharpDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isCSharpFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'async-await' };
    }

    const issues: CSharpIssue[] = [];
    const lines = content.split('\n');

    // Check for async void (almost always wrong)
    this.detectAsyncVoid(lines, filePath, issues);

    // Check for .Result or .Wait() (deadlock risk)
    this.detectBlockingCalls(lines, filePath, content, issues);

    // Check for missing ConfigureAwait(false) in libraries
    this.detectMissingConfigureAwait(lines, filePath, content, issues);

    // Check for async over sync (unnecessary async)
    this.detectUnnecessaryAsync(lines, filePath, issues);

    // Check for missing await in async method
    this.detectMissingAwait(lines, filePath, issues);

    // Check for async in finally blocks
    this.detectAsyncInFinally(lines, filePath, issues);

    return {
      issues,
      duration: 0,
      detectorName: 'async-await',
    };
  }

  /**
   * Detect async void methods (fire-and-forget, can't catch exceptions)
   */
  private detectAsyncVoid(
    lines: string[],
    filePath: string,
    issues: CSharpIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: async void MethodName(...)
      if (/async\s+void\s+\w+\s*\(/.test(line)) {
        // Exception: event handlers are OK to be async void
        const isEventHandler = /EventHandler|EventArgs/.test(line);
        
        if (!isEventHandler) {
          issues.push(
            this.createIssue(
              'async',
              'async void method - use async Task instead (exceptions cannot be caught)',
              filePath,
              i + 1,
              line.indexOf('async void'),
              'critical',
              'async-await-detector',
              'CS1998',
              'Change to: async Task MethodName()'
            )
          );
        }
      }
    }
  }

  /**
   * Detect blocking calls on async code (.Result, .Wait(), .GetAwaiter().GetResult())
   */
  private detectBlockingCalls(
    lines: string[],
    filePath: string,
    content: string,
    issues: CSharpIssue[]
  ): void {
    const blockingPatterns = [
      { pattern: /\.Result\b/, method: '.Result', replacement: 'await' },
      { pattern: /\.Wait\(\)/, method: '.Wait()', replacement: 'await' },
      { pattern: /\.GetAwaiter\(\)\.GetResult\(\)/, method: '.GetAwaiter().GetResult()', replacement: 'await' },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const { pattern, method, replacement } of blockingPatterns) {
        if (pattern.test(line)) {
          // Check if we're in an async context
          const inAsyncMethod = this.isAsyncMethod(content, i);
          
          const severity = inAsyncMethod ? 'critical' : 'high';
          const message = inAsyncMethod
            ? `Using ${method} in async method - causes deadlocks, use await instead`
            : `Using ${method} - consider making method async and using await`;

          issues.push(
            this.createIssue(
              'async',
              message,
              filePath,
              i + 1,
              line.search(pattern),
              severity,
              'async-await-detector',
              'CA2007',
              `Replace ${method} with ${replacement}`
            )
          );
        }
      }
    }
  }

  /**
   * Detect missing ConfigureAwait(false) in library code
   */
  private detectMissingConfigureAwait(
    lines: string[],
    filePath: string,
    content: string,
    issues: CSharpIssue[]
  ): void {
    // Skip if this is UI code (ASP.NET, WPF, WinForms)
    if (/using.*(?:Microsoft\.AspNetCore|System\.Windows|System\.Web)/.test(content)) {
      return;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: await something without ConfigureAwait
      if (/await\s+\w+/.test(line) && !/ConfigureAwait/.test(line)) {
        issues.push(
          this.createIssue(
            'async',
            'Missing ConfigureAwait(false) in library code - can cause deadlocks',
            filePath,
            i + 1,
            line.indexOf('await'),
            'high',
            'async-await-detector',
            'CA2007',
            'Add .ConfigureAwait(false) to avoid capturing SynchronizationContext'
          )
        );
      }
    }
  }

  /**
   * Detect unnecessary async (async method that just returns Task)
   */
  private detectUnnecessaryAsync(
    lines: string[],
    filePath: string,
    issues: CSharpIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: async Task<T> method that just returns another Task<T>
      if (/async\s+Task/.test(line)) {
        // Check if method body only contains return statement
        let braceCount = 0;
        let foundAwait = false;
        let onlyReturns = true;
        
        for (let j = i; j < Math.min(i + 20, lines.length); j++) {
          const bodyLine = lines[j];
          braceCount += (bodyLine.match(/\{/g) || []).length;
          braceCount -= (bodyLine.match(/\}/g) || []).length;
          
          if (/await\b/.test(bodyLine)) {
            foundAwait = true;
          }
          
          if (braceCount > 0 && !/return|{|}/.test(bodyLine.trim()) && bodyLine.trim() !== '') {
            onlyReturns = false;
          }
          
          if (braceCount === 0 && j > i) break;
        }

        if (!foundAwait && onlyReturns) {
          issues.push(
            this.createIssue(
              'async',
              'Unnecessary async - method does not await anything',
              filePath,
              i + 1,
              line.indexOf('async'),
              'info',
              'async-await-detector',
              'CS1998',
              'Remove async keyword and return Task directly'
            )
          );
        }
      }
    }
  }

  /**
   * Detect async methods without await (compiler warning CS1998)
   */
  private detectMissingAwait(
    lines: string[],
    filePath: string,
    issues: CSharpIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (/async\s+Task/.test(line)) {
        const methodName = this.extractMemberName('', i) || 'method';
        
        // Check method body for await
        let braceCount = 0;
        let hasAwait = false;
        
        for (let j = i; j < Math.min(i + 30, lines.length); j++) {
          const bodyLine = lines[j];
          braceCount += (bodyLine.match(/\{/g) || []).length;
          braceCount -= (bodyLine.match(/\}/g) || []).length;
          
          if (/await\b/.test(bodyLine)) {
            hasAwait = true;
            break;
          }
          
          if (braceCount === 0 && j > i) break;
        }

        if (!hasAwait) {
          issues.push(
            this.createIssue(
              'async',
              `Async method '${methodName}' has no await expressions`,
              filePath,
              i + 1,
              0,
              'high',
              'async-await-detector',
              'CS1998',
              'Either add await or remove async keyword'
            )
          );
        }
      }
    }
  }

  /**
   * Detect async in finally blocks (not allowed in C# < 6.0)
   */
  private detectAsyncInFinally(
    lines: string[],
    filePath: string,
    issues: CSharpIssue[]
  ): void {
    let inFinally = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (/\bfinally\b/.test(line)) {
        inFinally = true;
      } else if (inFinally && /^\s*\}/.test(line)) {
        inFinally = false;
      }

      if (inFinally && /await\b/.test(line)) {
        issues.push(
          this.createIssue(
            'async',
            'await in finally block - avoid if possible, can cause issues',
            filePath,
            i + 1,
            line.indexOf('await'),
            'high',
            'async-await-detector',
            undefined,
            'Move await outside finally block or ensure proper error handling'
          )
        );
      }
    }
  }
}
