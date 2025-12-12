/**
 * @fileoverview Detects improper context.Context usage in Go
 * Context is crucial for cancellation and timeouts
 */

import { GoBaseDetector, type GoDetectorOptions, type GoIssue } from './go-base-detector';
import type { DetectorResult } from '../../types';

export class ContextMisuseDetector extends GoBaseDetector {
  constructor(options: GoDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isGoFile(filePath) && !this.isGoTestFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'context-misuse' };
    }

    const issues: GoIssue[] = [];
    const lines = content.split('\n');

    // Check for functions that should have context but don't
    this.detectMissingContext(lines, filePath, issues);

    // Check for context.Background() in non-main functions
    this.detectMisusedBackground(lines, filePath, issues);

    // Check for context.TODO() in production code
    this.detectTodoInProduction(lines, filePath, issues);

    // Check for context stored in struct (anti-pattern)
    this.detectContextInStruct(lines, filePath, issues);

    // Check for context not checked for cancellation
    this.detectUnusedContext(content, lines, filePath, issues);

    return {
      issues,
      duration: 0,
      detectorName: 'context-misuse',
    };
  }

  /**
   * Detect functions that perform I/O without context parameter
   */
  private detectMissingContext(
    lines: string[],
    filePath: string,
    issues: GoIssue[]
  ): void {
    const ioPatterns = [
      /http\.Get|http\.Post|http\.Do/,
      /db\.Query|db\.Exec|sql\.Open/,
      /grpc\./,
      /time\.Sleep/,
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if line is a function definition
      const funcMatch = line.match(/func\s+\(?\w*\)?\s*(\w+)\s*\((.*?)\)/);
      if (funcMatch) {
        const funcParams = funcMatch[2];
        
        // Check if function uses I/O but doesn't have context parameter
        const hasIo = ioPatterns.some(pattern => {
          // Look ahead in function body (next 20 lines)
          for (let j = i; j < Math.min(i + 20, lines.length); j++) {
            if (pattern.test(lines[j])) {
              return true;
            }
          }
          return false;
        });

        const hasContext = /context\.Context/.test(funcParams);

        if (hasIo && !hasContext) {
          issues.push(
            this.createIssue(
              'context',
              `Function '${funcMatch[1]}' performs I/O but lacks context.Context parameter`,
              filePath,
              i + 1,
              0,
              'high',
              'context-misuse-detector'
            )
          );
        }
      }
    }
  }

  /**
   * Detect context.Background() in non-main functions
   */
  private detectMisusedBackground(
    lines: string[],
    filePath: string,
    issues: GoIssue[]
  ): void {
    let inMainFunc = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Track if we're in main function
      if (/func\s+main\s*\(\s*\)/.test(line)) {
        inMainFunc = true;
      } else if (/^func\s+/.test(line)) {
        inMainFunc = false;
      }

      // Check for context.Background() outside main
      if (/context\.Background\(\)/.test(line) && !inMainFunc) {
        issues.push(
          this.createIssue(
            'context',
            'context.Background() should only be used in main, init, and tests - prefer context from caller',
            filePath,
            i + 1,
            0,
            'high',
            'context-misuse-detector'
          )
        );
      }
    }
  }

  /**
   * Detect context.TODO() which should be replaced before production
   */
  private detectTodoInProduction(
    lines: string[],
    filePath: string,
    issues: GoIssue[]
  ): void {
    // Skip test files
    if (this.isGoTestFile(filePath)) {
      return;
    }

    for (let i = 0; i < lines.length; i++) {
      if (/context\.TODO\(\)/.test(lines[i])) {
        issues.push(
          this.createIssue(
            'context',
            'context.TODO() is a placeholder - replace with proper context before production',
            filePath,
            i + 1,
            0,
            'high',
            'context-misuse-detector'
          )
        );
      }
    }
  }

  /**
   * Detect context stored in struct (Go anti-pattern)
   */
  private detectContextInStruct(
    lines: string[],
    filePath: string,
    issues: GoIssue[]
  ): void {
    let inStructDef = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (/type\s+\w+\s+struct\s*\{/.test(line)) {
        inStructDef = true;
      } else if (inStructDef && /^\}/.test(line)) {
        inStructDef = false;
      }

      if (inStructDef && /context\.Context/.test(line)) {
        issues.push(
          this.createIssue(
            'context',
            'Do not store context.Context in struct - pass as first parameter to methods instead',
            filePath,
            i + 1,
            0,
            'critical',
            'context-misuse-detector'
          )
        );
      }
    }
  }

  /**
   * Detect context parameter that's never checked for cancellation
   */
  private detectUnusedContext(
    content: string,
    lines: string[],
    filePath: string,
    issues: GoIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const funcMatch = line.match(/func\s+\(?\w*\)?\s*(\w+)\s*\((.*?context\.Context.*?)\)/);
      
      if (funcMatch) {
        const funcName = funcMatch[1];
        const params = funcMatch[2];
        const ctxMatch = params.match(/(\w+)\s+context\.Context/);
        
        if (ctxMatch) {
          const ctxVarName = ctxMatch[1];
          
          // Look for context usage in function body (next 50 lines or until next func)
          let foundUsage = false;
          for (let j = i + 1; j < Math.min(i + 50, lines.length); j++) {
            const bodyLine = lines[j];
            
            // Stop at next function
            if (/^func\s+/.test(bodyLine)) {
              break;
            }
            
            // Check for context usage patterns
            if (
              new RegExp(`${ctxVarName}\\.Done\\(\\)|${ctxVarName}\\.Err\\(\\)|${ctxVarName}\\.Deadline\\(\\)`).test(bodyLine) ||
              new RegExp(`select.*${ctxVarName}\\.Done`).test(bodyLine)
            ) {
              foundUsage = true;
              break;
            }
          }

          if (!foundUsage) {
            issues.push(
              this.createIssue(
                'context',
                `Function '${funcName}' accepts context '${ctxVarName}' but never checks ctx.Done() for cancellation`,
                filePath,
                i + 1,
                0,
                'high',
                'context-misuse-detector'
              )
            );
          }
        }
      }
    }
  }
}
