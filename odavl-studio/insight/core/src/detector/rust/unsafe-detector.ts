/**
 * @fileoverview Detects unsafe code usage in Rust
 * Unsafe code bypasses Rust's safety guarantees - must be carefully reviewed
 */

import { RustBaseDetector, type RustDetectorOptions, type RustIssue } from './rust-base-detector';
import type { DetectorResult } from '../../types';

export class UnsafeDetector extends RustBaseDetector {
  constructor(options: RustDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isRustFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'unsafe' };
    }

    const issues: RustIssue[] = [];
    const lines = content.split('\n');

    // Check for unsafe blocks
    this.detectUnsafeBlocks(lines, filePath, issues);

    // Check for unsafe functions
    this.detectUnsafeFunctions(lines, filePath, issues);

    // Check for raw pointer dereferencing
    this.detectRawPointerDeref(lines, filePath, issues);

    // Check for unsafe trait implementations
    this.detectUnsafeTraits(lines, filePath, issues);

    // Check for transmute usage
    this.detectTransmute(lines, filePath, issues);

    // Check for FFI calls
    this.detectFFICalls(lines, filePath, issues);

    return {
      issues,
      duration: 0,
      detectorName: 'unsafe',
    };
  }

  /**
   * Detect unsafe blocks
   */
  private detectUnsafeBlocks(
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (/unsafe\s*\{/.test(line)) {
        // Extract unsafe block content (next 10 lines or until })
        let blockContent = '';
        let braceCount = 1;
        for (let j = i + 1; j < Math.min(i + 20, lines.length) && braceCount > 0; j++) {
          const nextLine = lines[j];
          blockContent += nextLine + '\n';
          braceCount += (nextLine.match(/\{/g) || []).length;
          braceCount -= (nextLine.match(/\}/g) || []).length;
        }

        // Check if unsafe block has documentation
        const hasDocs = i > 0 && /\/\/|\/\*/.test(lines[i - 1]);
        
        if (!hasDocs) {
          issues.push(
            this.createIssue(
              'unsafe',
              'Unsafe block without documentation - explain why unsafe is necessary',
              filePath,
              i + 1,
              line.indexOf('unsafe'), 'high' ,
              'unsafe-detector',
              'Add comment explaining safety invariants'
            )
          );
        }

        // Check for specific unsafe operations
        if (/\*\w+/.test(blockContent)) {
          issues.push(
            this.createIssue(
              'unsafe',
              'Raw pointer dereference in unsafe block - ensure pointer is valid',
              filePath,
              i + 1,
              0, 'critical' ,
              'unsafe-detector',
              'Verify pointer is non-null and properly aligned before dereferencing'
            )
          );
        }
      }
    }
  }

  /**
   * Detect unsafe functions
   */
  private detectUnsafeFunctions(
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const unsafeFnMatch = line.match(/unsafe\s+fn\s+(\w+)/);
      
      if (unsafeFnMatch) {
        const fnName = unsafeFnMatch[1];
        
        // Check for safety documentation
        let hasSafetyDocs = false;
        for (let j = Math.max(0, i - 5); j < i; j++) {
          if (/\/\/\/.*[Ss]afety|#\[doc\].*[Ss]afety/.test(lines[j])) {
            hasSafetyDocs = true;
            break;
          }
        }

        if (!hasSafetyDocs) {
          issues.push(
            this.createIssue(
              'unsafe',
              `Unsafe function '${fnName}' missing /// # Safety documentation`,
              filePath,
              i + 1,
              line.indexOf('unsafe'), 'critical' ,
              'unsafe-detector',
              'Add /// # Safety section explaining preconditions for safe usage'
            )
          );
        }
      }
    }
  }

  /**
   * Detect raw pointer dereferencing
   */
  private detectRawPointerDeref(
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: *raw_ptr or (*ptr).field
      if (/\*\w+|^\s*\(\*\w+\)/.test(line) && !/\/\/|\/\*/.test(line)) {
        // Check if in unsafe block
        let inUnsafeBlock = false;
        for (let j = Math.max(0, i - 10); j < i; j++) {
          if (/unsafe\s*\{/.test(lines[j])) {
            inUnsafeBlock = true;
            break;
          }
        }

        if (!inUnsafeBlock) {
          issues.push(
            this.createIssue(
              'unsafe',
              'Raw pointer dereference outside unsafe block - will not compile',
              filePath,
              i + 1,
              0, 'critical' ,
              'unsafe-detector',
              'Wrap in unsafe {} block and document safety invariants'
            )
          );
        }
      }
    }
  }

  /**
   * Detect unsafe trait implementations
   */
  private detectUnsafeTraits(
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const unsafeImplMatch = line.match(/unsafe\s+impl.*for\s+(\w+)/);
      
      if (unsafeImplMatch) {
        const typeName = unsafeImplMatch[1];
        issues.push(
          this.createIssue(
            'unsafe',
            `Unsafe trait implementation for '${typeName}' - verify all safety requirements are met`,
            filePath,
            i + 1,
            line.indexOf('unsafe'), 'high' ,
            'unsafe-detector',
            'Common unsafe traits: Send, Sync - ensure thread safety'
          )
        );
      }
    }
  }

  /**
   * Detect mem::transmute usage (most dangerous unsafe operation)
   */
  private detectTransmute(
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (/mem::transmute|std::mem::transmute/.test(line)) {
        issues.push(
          this.createIssue(
            'unsafe',
            'mem::transmute is extremely dangerous - consider safer alternatives',
            filePath,
            i + 1,
            line.indexOf('transmute'), 'critical' ,
            'unsafe-detector',
            'Use transmute_copy, from_raw_parts, or cast instead if possible'
          )
        );
      }
    }
  }

  /**
   * Detect FFI (Foreign Function Interface) calls
   */
  private detectFFICalls(
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: extern "C" or extern "system"
      if (/extern\s+"(C|system)"/.test(line)) {
        issues.push(
          this.createIssue(
            'unsafe',
            'FFI declaration - ensure C ABI compatibility and safety invariants',
            filePath,
            i + 1,
            line.indexOf('extern'), 'high' ,
            'unsafe-detector',
            'Verify parameter types match C ABI, add safety documentation'
          )
        );
      }

      // Pattern: calling extern functions
      if (/\w+::\w+\s*\(/.test(line) && i > 0 && /extern/.test(lines[i - 3] || '')) {
        let inUnsafe = false;
        for (let j = Math.max(0, i - 5); j < i; j++) {
          if (/unsafe/.test(lines[j])) {
            inUnsafe = true;
            break;
          }
        }

        if (!inUnsafe) {
          issues.push(
            this.createIssue(
              'unsafe',
              'FFI function call must be in unsafe block',
              filePath,
              i + 1,
              0, 'critical' ,
              'unsafe-detector',
              'Wrap FFI call in unsafe {} and document assumptions'
            )
          );
        }
      }
    }
  }
}
