/**
 * @fileoverview Detects improper error handling in Go
 * Go's explicit error handling is powerful but easy to misuse
 */

import { GoBaseDetector, type GoDetectorOptions, type GoIssue } from './go-base-detector';
import type { DetectorResult } from '../../types';

export class ErrorHandlingDetector extends GoBaseDetector {
  constructor(options: GoDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isGoFile(filePath) && !this.isGoTestFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'error-handling' };
    }

    const issues: GoIssue[] = [];
    const lines = content.split('\n');

    // Check for ignored errors
    this.detectIgnoredErrors(lines, filePath, issues);

    // Check for error shadowing
    this.detectErrorShadowing(lines, filePath, issues);

    // Check for missing error wrapping
    this.detectMissingErrorWrapping(lines, filePath, issues);

    // Check for naked returns in error handling
    this.detectNakedReturns(lines, filePath, issues);

    // Check for errors.New with formatting (should use fmt.Errorf)
    this.detectErrorsNewWithFormatting(lines, filePath, issues);

    return {
      issues,
      duration: 0,
      detectorName: 'error-handling',
    };
  }

  /**
   * Detect ignored errors (assigned to _)
   */
  private detectIgnoredErrors(
    lines: string[],
    filePath: string,
    issues: GoIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: _ = func() or _, _ = func()
      if (/_\s*=/.test(line) && !/_\s*:=/.test(line)) {
        // Check if it's an error being ignored
        const commonErrorReturningFuncs = [
          /\.Write\(/, /\.Read\(/, /\.Close\(/,
          /\.Exec\(/, /\.Query\(/,
          /\.Do\(/, /\.Get\(/, /\.Post\(/,
          /json\./, /xml\./, /yaml\./,
          /os\./, /io\./,
        ];

        const isLikelyError = commonErrorReturningFuncs.some(pattern => pattern.test(line));
        
        if (isLikelyError) {
          issues.push(
            this.createIssue(
              'error',
              'Error return value ignored - should be checked',
              filePath,
              i + 1,
              0,
              'high',
              'error-handling-detector'
            )
          );
        }
      }
    }
  }

  /**
   * Detect error variable shadowing
   */
  private detectErrorShadowing(
    lines: string[],
    filePath: string,
    issues: GoIssue[]
  ): void {
    const errorVars = new Map<string, number>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: err := or err = or , err :=
      const errMatch = line.match(/(\w+)\s*:?=.*error|,\s*(\w+)\s*:=/);
      if (errMatch) {
        const varName = errMatch[1] || errMatch[2];
        if (varName === 'err') {
          if (errorVars.has('err')) {
            // Check if previous error was handled
            const prevLine = errorVars.get('err')!;
            let handledPrevious = false;
            
            for (let j = prevLine; j < i; j++) {
              if (/if\s+err\s*!=\s*nil|err\s*!=\s*nil/.test(lines[j])) {
                handledPrevious = true;
                break;
              }
            }

            if (!handledPrevious) {
              issues.push(
                this.createIssue(
                  'error',
                  `Error variable 'err' shadowed without checking previous error (line ${prevLine + 1})`,
                  filePath,
                  i + 1,
                  0,
                  'high',
                  'error-handling-detector'
                )
              );
            }
          }
          errorVars.set('err', i);
        }
      }
    }
  }

  /**
   * Detect missing error wrapping (Go 1.13+)
   */
  private detectMissingErrorWrapping(
    lines: string[],
    filePath: string,
    issues: GoIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: return err without wrapping in error handling block
      if (/return\s+err\s*$|return\s+err\s*,/.test(line)) {
        // Check if we're in an error handling block
        let inErrorBlock = false;
        for (let j = Math.max(0, i - 3); j < i; j++) {
          if (/if\s+err\s*!=\s*nil/.test(lines[j])) {
            inErrorBlock = true;
            break;
          }
        }

        if (inErrorBlock) {
          // Check if error is wrapped
          const hasWrapping = /fmt\.Errorf.*%w|errors\.Wrap/.test(line);
          if (!hasWrapping) {
            issues.push(
              this.createIssue(
                'error',
                'Consider wrapping error with fmt.Errorf("context: %w", err) for better error context',
                filePath,
                i + 1,
                0,
                'info',
                'error-handling-detector'
              )
            );
          }
        }
      }
    }
  }

  /**
   * Detect naked returns in functions with named error returns
   */
  private detectNakedReturns(
    lines: string[],
    filePath: string,
    issues: GoIssue[]
  ): void {
    let currentFunc: { name: string; hasNamedError: boolean; line: number } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Function definition with named error return
      const funcMatch = line.match(/func\s+\(?\w*\)?\s*(\w+)\s*\(.*?\)\s*\([^)]*\s+(\w+)\s+error\)/);
      if (funcMatch) {
        currentFunc = {
          name: funcMatch[1],
          hasNamedError: true,
          line: i + 1,
        };
      }

      // Naked return in function with named error
      if (currentFunc && /^\s*return\s*$/.test(line)) {
        issues.push(
          this.createIssue(
            'error',
            `Naked return in function '${currentFunc.name}' with named error return - explicit returns are clearer`,
            filePath,
            i + 1,
            0,
            'info',
            'error-handling-detector'
          )
        );
      }

      // Reset on new function
      if (/^func\s+/.test(line) && currentFunc) {
        currentFunc = null;
      }
    }
  }

  /**
   * Detect errors.New() with string formatting (should use fmt.Errorf)
   */
  private detectErrorsNewWithFormatting(
    lines: string[],
    filePath: string,
    issues: GoIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: errors.New with fmt.Sprintf
      if (/errors\.New\s*\(\s*fmt\.Sprintf/.test(line)) {
        issues.push(
          this.createIssue(
            'error',
            'Use fmt.Errorf() instead of errors.New(fmt.Sprintf()) for error formatting',
            filePath,
            i + 1,
            0,
            'info',
            'error-handling-detector'
          )
        );
      }
    }
  }
}
