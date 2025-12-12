/**
 * @fileoverview Detects lifetime annotation issues in Rust
 * Lifetimes are Rust's way of ensuring references are always valid
 */

import { RustBaseDetector, type RustDetectorOptions, type RustIssue } from './rust-base-detector';
import type { DetectorResult } from '../../types';

export class LifetimeDetector extends RustBaseDetector {
  constructor(options: RustDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isRustFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'lifetime' };
    }

    const issues: RustIssue[] = [];
    const lines = content.split('\n');

    // Check for missing lifetime annotations
    this.detectMissingLifetimes(lines, filePath, issues);

    // Check for 'static lifetime abuse
    this.detectStaticLifetimeAbuse(lines, filePath, issues);

    // Check for complex lifetime situations
    this.detectComplexLifetimes(lines, filePath, issues);

    // Check for self-referential structs (illegal in Rust)
    this.detectSelfReferentialStructs(content, lines, filePath, issues);

    return {
      issues,
      duration: 0,
      detectorName: 'lifetime',
    };
  }

  /**
   * Detect functions returning references without lifetime annotations
   */
  private detectMissingLifetimes(
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: fn that returns &T without lifetime
      const fnMatch = line.match(/fn\s+\w+.*->\s*&(?!')\w+/);
      if (fnMatch && !/<'/.test(line)) {
        issues.push(
          this.createIssue(
            'lifetime',
            'Function returns reference but missing lifetime annotation',
            filePath,
            i + 1,
            line.indexOf('fn'), 'critical' ,
            'lifetime-detector',
            "Add lifetime parameter: fn name<'a>(...) -> &'a Type"
          )
        );
      }

      // Pattern: struct with reference fields without lifetime
      if (/struct\s+\w+/.test(line)) {
        let hasRefField = false;
        let hasLifetime = false;
        
        for (let j = i; j < Math.min(i + 20, lines.length); j++) {
          if (/:\s*&\w+/.test(lines[j])) hasRefField = true;
          if (/<'/.test(lines[j])) hasLifetime = true;
          if (/^\}/.test(lines[j])) break;
        }

        if (hasRefField && !hasLifetime) {
          issues.push(
            this.createIssue(
              'lifetime',
              'Struct contains references but missing lifetime parameter',
              filePath,
              i + 1,
              0, 'critical' ,
              'lifetime-detector',
              "Add lifetime: struct Name<'a> { field: &'a Type }"
            )
          );
        }
      }
    }
  }

  /**
   * Detect 'static lifetime abuse
   */
  private detectStaticLifetimeAbuse(
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: &'static in function signatures (often unnecessary)
      if (/&'static/.test(line) && /fn\s+/.test(line)) {
        // Check if it's actually const data (OK) or parameter (probably wrong)
        if (!/const\s+\w+:\s*&'static|static\s+\w+:/.test(line)) {
          issues.push(
            this.createIssue(
              'lifetime',
              "'static lifetime may be too restrictive - consider using generic lifetime",
              filePath,
              i + 1,
              line.indexOf("'static"), 'high' ,
              'lifetime-detector',
              "Replace &'static with &'a and add lifetime parameter"
            )
          );
        }
      }

      // Pattern: Box::leak (creates 'static references - memory leak)
      if (/Box::leak/.test(line)) {
        issues.push(
          this.createIssue(
            'lifetime',
            "Box::leak creates 'static reference by leaking memory - rarely what you want",
            filePath,
            i + 1,
            line.indexOf('Box::leak'), 'high' ,
            'lifetime-detector',
            'Consider using scoped threads or proper lifetime annotations instead'
          )
        );
      }
    }
  }

  /**
   * Detect overly complex lifetime situations
   */
  private detectComplexLifetimes(
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Count lifetime parameters
      const lifetimeMatches = line.match(/'[a-z]\b/g);
      if (lifetimeMatches && lifetimeMatches.length > 3) {
        issues.push(
          this.createIssue(
            'lifetime',
            `Complex lifetime signature (${lifetimeMatches.length} lifetimes) - consider simplifying design`,
            filePath,
            i + 1,
            0,
            'info',
            'lifetime-detector',
            'Refactor to use owned types (String, Vec) or consolidate lifetimes'
          )
        );
      }

      // Lifetime subtyping (rare, complex)
      if (/'[a-z]:\s*'[a-z]/.test(line)) {
        issues.push(
          this.createIssue(
            'lifetime',
            'Lifetime bound (subtyping) detected - ensure this complexity is necessary',
            filePath,
            i + 1,
            0,
            'info',
            'lifetime-detector',
            'Lifetime bounds are advanced - verify design requires this'
          )
        );
      }
    }
  }

  /**
   * Detect self-referential structs (impossible without unsafe)
   */
  private detectSelfReferentialStructs(
    content: string,
    lines: string[],
    filePath: string,
    issues: RustIssue[]
  ): void {
    // Pattern: struct that tries to store reference to itself
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const structMatch = line.match(/struct\s+(\w+)/);
      
      if (structMatch) {
        const structName = structMatch[1];
        let structBody = '';
        
        // Collect struct body
        for (let j = i + 1; j < Math.min(i + 30, lines.length); j++) {
          structBody += lines[j];
          if (/^\}/.test(lines[j])) break;
        }

        // Check if struct has field referencing itself
        if (new RegExp(`:\\s*&.*${structName}`).test(structBody)) {
          issues.push(
            this.createIssue(
              'lifetime',
              `Self-referential struct '${structName}' is not possible in safe Rust`,
              filePath,
              i + 1,
              0, 'critical' ,
              'lifetime-detector',
              'Use Pin<Box<T>>, rental crate, or restructure to avoid self-reference'
            )
          );
        }
      }
    }
  }
}
