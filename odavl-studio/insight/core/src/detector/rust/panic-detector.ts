/**
 * @fileoverview Detects panic-prone code patterns in Rust
 * Panics crash the program - production code should use Result<T, E> instead
 */

import { RustBaseDetector, type RustDetectorOptions, type RustIssue } from './rust-base-detector';
import type { DetectorResult } from '../../types';

export class PanicDetector extends RustBaseDetector {
  constructor(options: RustDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isRustFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'panic' };
    }

    // Skip test files - panics are OK in tests
    if (this.isRustTestFile(filePath) || content.includes('#[cfg(test)]')) {
      return { issues: [], duration: 0, detectorName: 'panic' };
    }

    const issues: RustIssue[] = [];
    const lines = content.split('\n');

    // Check for .unwrap()
    this.detectUnwrap(lines, filePath, issues);

    // Check for .expect()
    this.detectExpect(lines, filePath, issues);

    // Check for panic!, unreachable!, unimplemented!
    this.detectPanicMacros(lines, filePath, issues);

    // Check for index operations that can panic
    this.detectPanickyIndexing(lines, filePath, issues);

    // Check for integer overflow operations
    this.detectIntegerOverflow(lines, filePath, issues);

    return {
      issues,
      duration: 0,
      detectorName: 'panic',
    };
  }

  /**
   * Detect .unwrap() usage (panics on None/Err)
   */
  private detectUnwrap(
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const unwrapMatches = line.matchAll(/\.unwrap\(\)/g);
      
      for (const match of unwrapMatches) {
        issues.push(
          this.createIssue(
            'panic',
            '.unwrap() can panic - use .unwrap_or(), .unwrap_or_else(), or ? operator',
            filePath,
            i + 1,
            match.index || 0, 'high' ,
            'panic-detector',
            'Replace with .unwrap_or_default() or propagate error with ?'
          )
        );
      }
    }
  }

  /**
   * Detect .expect() usage (panics with custom message)
   */
  private detectExpect(
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const expectMatches = line.matchAll(/\.expect\([^)]+\)/g);
      
      for (const match of expectMatches) {
        // .expect() is slightly better than .unwrap() because it has a message
        // But still panics - downgrade to info severity
        issues.push(
          this.createIssue(
            'panic',
            '.expect() can panic - consider returning Result<T, E> instead',
            filePath,
            i + 1,
            match.index || 0,
            'info',
            'panic-detector',
            'Use ? operator to propagate errors up the call stack'
          )
        );
      }
    }
  }

  /**
   * Detect panic macros
   */
  private detectPanicMacros(
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    const panicMacros = [
      { macro: 'panic!', severity: 'critical' as const, message: 'Explicit panic - will crash program' },
      { macro: 'unreachable!', severity: 'high' as const, message: 'unreachable! will panic if reached' },
      { macro: 'unimplemented!', severity: 'info' as const, message: 'unimplemented! should be replaced before production' },
      { macro: 'todo!', severity: 'info' as const, message: 'todo! should be replaced before production' },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const { macro, severity, message } of panicMacros) {
        if (new RegExp(`\\b${macro.replace('!', '\\!')}`).test(line)) {
          issues.push(
            this.createIssue(
              'panic',
              message,
              filePath,
              i + 1,
              line.indexOf(macro),
              severity,
              'panic-detector',
              'Return Result<T, Error> or use defensive programming'
            )
          );
        }
      }
    }
  }

  /**
   * Detect array/slice indexing that can panic
   */
  private detectPanickyIndexing(
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: arr[index] without bounds check
      const indexMatch = line.match(/(\w+)\[(\w+|\d+)\]/);
      if (indexMatch && !/\/\/|\/\*/.test(line)) {
        const [fullMatch, arrayName, index] = indexMatch;
        
        // Check if there's a bounds check nearby
        let hasBoundsCheck = false;
        for (let j = Math.max(0, i - 3); j < i; j++) {
          if (new RegExp(`${arrayName}\\.len\\(\\)|${index}\\s*<`).test(lines[j])) {
            hasBoundsCheck = true;
            break;
          }
        }

        if (!hasBoundsCheck) {
          issues.push(
            this.createIssue(
              'panic',
              `Array indexing ${fullMatch} can panic if out of bounds`,
              filePath,
              i + 1,
              line.indexOf(fullMatch), 'high' ,
              'panic-detector',
              `Use .get(${index}) which returns Option<&T> instead`
            )
          );
        }
      }
    }
  }

  /**
   * Detect integer operations that can overflow in debug mode
   */
  private detectIntegerOverflow(
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    const overflowOps = ['+', '-', '*', '/'];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for arithmetic in hot paths (loops)
      let inLoop = false;
      for (let j = Math.max(0, i - 3); j < i; j++) {
        if (/\b(for|while|loop)\b/.test(lines[j])) {
          inLoop = true;
          break;
        }
      }

      if (inLoop) {
        for (const op of overflowOps) {
          const opRegex = new RegExp(`\\w+\\s*${op.replace(/[+*]/g, '\\$&')}\\s*\\w+`, 'g');
          if (opRegex.test(line) && !/checked_|saturating_|wrapping_/.test(line)) {
            issues.push(
              this.createIssue(
                'panic',
                `Integer arithmetic in loop can overflow - use checked_${op === '+' ? 'add' : op === '-' ? 'sub' : op === '*' ? 'mul' : 'div'}()`,
                filePath,
                i + 1,
                0,
                'info',
                'panic-detector',
                'Use checked_*, saturating_*, or wrapping_* methods for safe arithmetic'
              )
            );
            break; // One warning per line
          }
        }
      }
    }
  }
}
