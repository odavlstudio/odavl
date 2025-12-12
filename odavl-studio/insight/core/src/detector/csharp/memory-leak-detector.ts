/**
 * @fileoverview Detects memory leaks and management issues in C#
 * C# has GC but can still leak memory through events, static references, etc.
 */

import { CSharpBaseDetector, type CSharpDetectorOptions, type CSharpIssue } from './csharp-base-detector';
import type { DetectorResult } from '../../types';

export class MemoryLeakDetector extends CSharpBaseDetector {
  constructor(options: CSharpDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isCSharpFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'memory-leak' };
    }

    const issues: CSharpIssue[] = [];
    const lines = content.split('\n');

    // Check for event handler leaks
    this.detectEventHandlerLeaks(lines, filePath, issues);

    // Check for missing Dispose
    this.detectMissingDispose(lines, filePath, content, issues);

    // Check for static event handlers
    this.detectStaticEvents(lines, filePath, issues);

    // Check for captured variables in closures
    this.detectClosureCaptures(lines, filePath, issues);

    // Check for large object allocation
    this.detectLargeObjectAllocation(lines, filePath, issues);

    return {
      issues,
      duration: 0,
      detectorName: 'memory-leak',
    };
  }

  /**
   * Detect event handler subscriptions without unsubscription
   */
  private detectEventHandlerLeaks(
    lines: string[],
    filePath: string,
    issues: CSharpIssue[]
  ): void {
    const subscriptions = new Map<string, number>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: obj.Event += Handler;
      const subscribeMatch = line.match(/(\w+)\.(\w+)\s*\+=\s*(\w+)/);
      if (subscribeMatch) {
        const [, obj, event, handler] = subscribeMatch;
        const key = `${obj}.${event}`;
        subscriptions.set(key, (subscriptions.get(key) || 0) + 1);
      }

      // Pattern: obj.Event -= Handler;
      const unsubscribeMatch = line.match(/(\w+)\.(\w+)\s*-=\s*(\w+)/);
      if (unsubscribeMatch) {
        const [, obj, event] = unsubscribeMatch;
        const key = `${obj}.${event}`;
        const count = subscriptions.get(key) || 0;
        subscriptions.set(key, Math.max(0, count - 1));
      }
    }

    // Check for unbalanced subscriptions
    for (const [event, count] of subscriptions.entries()) {
      if (count > 0) {
        issues.push(
          this.createIssue(
            'memory',
            `Event '${event}' subscribed but never unsubscribed - potential memory leak`,
            filePath,
            1,
            0,
            'high',
            'memory-leak-detector',
            'CA1001',
            `Add unsubscribe in Dispose: ${event} -= handler;`
          )
        );
      }
    }
  }

  /**
   * Detect missing Dispose for IDisposable types
   */
  private detectMissingDispose(
    lines: string[],
    filePath: string,
    content: string,
    issues: CSharpIssue[]
  ): void {
    const disposableTypes = [
      'Stream', 'StreamReader', 'StreamWriter', 'FileStream',
      'HttpClient', 'HttpResponseMessage',
      'SqlConnection', 'SqlCommand', 'SqlDataReader',
      'Timer', 'CancellationTokenSource',
      'Bitmap', 'Graphics', 'Font', 'Brush', 'Pen',
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const type of disposableTypes) {
        // Pattern: var x = new DisposableType() without using
        if (new RegExp(`\\bnew\\s+${type}\\b`).test(line) && 
            !/\busing\b/.test(line) &&
            !/await using/.test(line)) {
          
          // Check if Dispose is called later
          const varMatch = line.match(/(\w+)\s*=\s*new/);
          if (varMatch) {
            const varName = varMatch[1];
            let hasDispose = false;

            for (let j = i + 1; j < Math.min(i + 30, lines.length); j++) {
              if (new RegExp(`${varName}\\.Dispose\\(\\)|${varName}\\?\.Dispose\\(\\)`).test(lines[j])) {
                hasDispose = true;
                break;
              }
            }

            if (!hasDispose) {
              issues.push(
                this.createIssue(
                  'memory',
                  `${type} instance not disposed - use 'using' statement`,
                  filePath,
                  i + 1,
                  line.indexOf('new'),
                  'high',
                  'memory-leak-detector',
                  'CA2000',
                  `Wrap in using: using var ${varName} = new ${type}();`
                )
              );
            }
          }
        }
      }
    }
  }

  /**
   * Detect static event handlers (never garbage collected)
   */
  private detectStaticEvents(
    lines: string[],
    filePath: string,
    issues: CSharpIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: static event EventHandler
      if (/static.*event\s+\w+/.test(line)) {
        const eventMatch = line.match(/event\s+\w+\s+(\w+)/);
        if (eventMatch) {
          issues.push(
            this.createIssue(
              'memory',
              `Static event '${eventMatch[1]}' - subscribers will never be garbage collected`,
              filePath,
              i + 1,
              line.indexOf('static'),
              'high',
              'memory-leak-detector',
              undefined,
              'Consider using WeakEventManager or make event non-static'
            )
          );
        }
      }
    }
  }

  /**
   * Detect closure captures that prevent GC
   */
  private detectClosureCaptures(
    lines: string[],
    filePath: string,
    issues: CSharpIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: lambda capturing 'this' in long-lived callback
      if (/=>\s*{/.test(line) && /\bthis\b/.test(line)) {
        // Check if it's being assigned to a field or event
        let isLongLived = false;
        for (let j = Math.max(0, i - 2); j <= i; j++) {
          if (/\+=|=\s*new/.test(lines[j])) {
            isLongLived = true;
            break;
          }
        }

        if (isLongLived) {
          issues.push(
            this.createIssue(
              'memory',
              'Lambda captures "this" in long-lived callback - may prevent garbage collection',
              filePath,
              i + 1,
              line.indexOf('=>'),
              'info',
              'memory-leak-detector',
              undefined,
              'Use weak references or ensure callback is unregistered'
            )
          );
        }
      }
    }
  }

  /**
   * Detect large object allocations (>85KB goes to LOH)
   */
  private detectLargeObjectAllocation(
    lines: string[],
    filePath: string,
    issues: CSharpIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: new byte[size] or new Type[size]
      const arrayMatch = line.match(/new\s+\w+\[(\d+)\]/);
      if (arrayMatch) {
        const size = parseInt(arrayMatch[1], 10);
        
        // 85,000 bytes is LOH threshold
        if (size > 85_000) {
          issues.push(
            this.createIssue(
              'memory',
              `Large array allocation (${size} elements) - will be allocated on Large Object Heap`,
              filePath,
              i + 1,
              line.indexOf('new'),
              'info',
              'memory-leak-detector',
              undefined,
              'Consider using ArrayPool<T> or Memory<T> for better memory management'
            )
          );
        }
      }
    }
  }
}
