/**
 * @fileoverview Detects ownership and borrowing issues in Rust
 * Rust's ownership system is its superpower but can be tricky
 */

import { RustBaseDetector, type RustDetectorOptions, type RustIssue } from './rust-base-detector';
import type { DetectorResult } from '../../types';

export class OwnershipDetector extends RustBaseDetector {
  constructor(options: RustDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isRustFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'ownership' };
    }

    const issues: RustIssue[] = [];
    const lines = content.split('\n');

    // Check for excessive cloning
    this.detectExcessiveCloning(lines, filePath, issues);

    // Check for unnecessary mutable borrows
    this.detectUnnecessaryMutBorrows(lines, filePath, issues);

    // Check for moved value usage
    this.detectMovedValueUsage(content, lines, filePath, issues);

    // Check for multiple mutable borrows
    this.detectMultipleMutBorrows(lines, filePath, issues);

    // Check for borrowing in loops
    this.detectBorrowInLoops(lines, filePath, issues);

    return {
      issues,
      duration: 0,
      detectorName: 'ownership',
    };
  }

  /**
   * Detect excessive use of .clone() which defeats Rust's zero-cost abstractions
   */
  private detectExcessiveCloning(
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    let cloneCount = 0;
    const cloneLines: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const cloneMatches = line.match(/\.clone\(\)/g);
      
      if (cloneMatches) {
        cloneCount += cloneMatches.length;
        cloneLines.push(i + 1);

        // Immediate warning for clone in hot paths
        if (/for\s+.*in|while|loop/.test(lines[Math.max(0, i - 3)])) {
          issues.push(
            this.createIssue(
              'ownership',
              'Cloning inside loop - consider using references or Cow<T>',
              filePath,
              i + 1,
              line.indexOf('.clone()'), 'high' ,
              'ownership-detector',
              'Use &T references or std::borrow::Cow for copy-on-write'
            )
          );
        }
      }
    }

    // Warn if excessive cloning overall (>10 clones in file)
    if (cloneCount > 10) {
      issues.push(
        this.createIssue(
          'ownership',
          `Excessive cloning detected (${cloneCount} occurrences) - review ownership design`,
          filePath,
          cloneLines[0],
          0,
          'info',
          'ownership-detector',
          'Consider restructuring to use references or implementing Copy trait'
        )
      );
    }
  }

  /**
   * Detect unnecessary mutable borrows (&mut) when immutable would work
   */
  private detectUnnecessaryMutBorrows(
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: &mut parameter that's never mutated
      const mutParamMatch = line.match(/&mut\s+(\w+)/g);
      if (mutParamMatch) {
        for (const match of mutParamMatch) {
          const varName = match.replace(/&mut\s+/, '');
          
          // Check if variable is actually mutated in next 20 lines
          let isMutated = false;
          for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
            const nextLine = lines[j];
            if (new RegExp(`${varName}\\s*=|${varName}\\.\\w+\\s*=`).test(nextLine)) {
              isMutated = true;
              break;
            }
            // Stop at function boundary
            if (/^fn\s+|^\s*\}/.test(nextLine)) break;
          }

          if (!isMutated) {
            issues.push(
              this.createIssue(
                'ownership',
                `Unnecessary mutable borrow of '${varName}' - use immutable borrow &${varName}`,
                filePath,
                i + 1,
                line.indexOf(match),
                'info',
                'ownership-detector',
                `Change &mut ${varName} to &${varName}`
              )
            );
          }
        }
      }
    }
  }

  /**
   * Detect usage after move (will cause compile error)
   */
  private detectMovedValueUsage(
    content: string,
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: variable passed to function without & or &mut
      const moveMatch = line.match(/(\w+)\s*=\s*([^&]\w+);/);
      if (moveMatch) {
        const [, newVar, oldVar] = moveMatch;
        
        // Check if old variable is used after move
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          if (new RegExp(`\\b${oldVar}\\b`).test(lines[j]) && 
              !/fn\s+/.test(lines[j])) {
            issues.push(
              this.createIssue(
                'ownership',
                `Value '${oldVar}' used after move to '${newVar}' - will cause compile error`,
                filePath,
                j + 1,
                lines[j].indexOf(oldVar), 'critical' ,
                'ownership-detector',
                `Clone before move: let ${newVar} = ${oldVar}.clone(); or use reference`
              )
            );
            break;
          }
        }
      }
    }
  }

  /**
   * Detect multiple mutable borrows (Rust forbids this)
   */
  private detectMultipleMutBorrows(
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    const mutBorrows = new Map<string, number[]>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matches = line.matchAll(/&mut\s+(\w+)/g);
      
      for (const match of matches) {
        const varName = match[1];
        if (!mutBorrows.has(varName)) {
          mutBorrows.set(varName, []);
        }
        mutBorrows.get(varName)!.push(i + 1);
      }
    }

    // Check for multiple mutable borrows in same scope
    for (const [varName, borrowLines] of mutBorrows.entries()) {
      if (borrowLines.length > 1) {
        // Check if borrows are in same scope (within 5 lines)
        for (let i = 0; i < borrowLines.length - 1; i++) {
          if (borrowLines[i + 1] - borrowLines[i] < 5) {
            issues.push(
              this.createIssue(
                'borrowing',
                `Multiple mutable borrows of '${varName}' (lines ${borrowLines[i]}, ${borrowLines[i + 1]}) - Rust forbids this`,
                filePath,
                borrowLines[i + 1],
                0, 'critical' ,
                'ownership-detector',
                'Use scoped blocks {} to limit borrow lifetime'
              )
            );
          }
        }
      }
    }
  }

  /**
   * Detect problematic borrows in loops
   */
  private detectBorrowInLoops(
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    let inLoop = false;
    let loopStartLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (/\b(for|while|loop)\b/.test(line)) {
        inLoop = true;
        loopStartLine = i + 1;
      } else if (inLoop && /^\s*\}/.test(line)) {
        inLoop = false;
      }

      if (inLoop && /&mut\s+self/.test(line)) {
        issues.push(
          this.createIssue(
            'borrowing',
            'Mutable borrow of self in loop - may cause borrow checker issues',
            filePath,
            i + 1,
            line.indexOf('&mut self'), 'high' ,
            'ownership-detector',
            'Consider restructuring to avoid mutable self borrow in loop'
          )
        );
      }
    }
  }
}
