/**
 * @fileoverview Base detector for Rust language analysis
 * Provides foundation for all Rust-specific detectors
 */

import type { DetectorResult, Issue, Severity } from '../../types';

export interface RustDetectorOptions {
  /** Enable Clippy integration (official Rust linter) */
  useClipy?: boolean;
  /** Rust edition (2015, 2018, 2021, 2024) */
  edition?: '2015' | '2018' | '2021' | '2024';
  /** Cargo.toml path */
  cargoPath?: string;
  /** Custom Clippy configuration */
  clippyConfig?: Record<string, unknown>;
  /** Check unsafe code blocks */
  checkUnsafe?: boolean;
}

export interface RustIssue extends Issue {
  /** Rust-specific issue category */
  category: 
    | 'ownership' 
    | 'borrowing' 
    | 'lifetime' 
    | 'unsafe' 
    | 'panic' 
    | 'performance' 
    | 'memory' 
    | 'concurrency'
    | 'style'
    | 'correctness';
  /** Source linter (clippy, rustc, custom) */
  linter?: string;
  /** Rust crate path */
  cratePath?: string;
  /** Suggestion for fix */
  suggestion?: string;
}

export abstract class RustBaseDetector {
  protected readonly options: RustDetectorOptions;

  constructor(options: RustDetectorOptions = {}) {
    this.options = {
      useClipy: true,
      edition: '2021',
      checkUnsafe: true,
      ...options,
    };
  }

  /**
   * Detect issues in Rust source code
   */
  abstract detect(filePath: string, content: string): Promise<DetectorResult>;

  /**
   * Check if file is a Rust source file
   */
  protected isRustFile(filePath: string): boolean {
    return filePath.endsWith('.rs') && !filePath.includes('/target/');
  }

  /**
   * Check if file is a Rust test file
   */
  protected isRustTestFile(filePath: string): boolean {
    return filePath.endsWith('.rs') && (
      filePath.includes('/tests/') || 
      filePath.includes('_test.rs')
    );
  }

  /**
   * Parse Cargo.toml to get crate information
   */
  protected async parseCargoToml(workspaceRoot: string): Promise<{
    name: string;
    edition: string;
  } | null> {
    try {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const cargoPath = path.join(workspaceRoot, 'Cargo.toml');
      const content = await fs.readFile(cargoPath, 'utf8');
      
      const nameMatch = content.match(/^name\s*=\s*"(.+)"$/m);
      const editionMatch = content.match(/^edition\s*=\s*"(\d+)"$/m);
      
      return {
        name: nameMatch ? nameMatch[1] : 'unknown',
        edition: editionMatch ? editionMatch[1] : '2021',
      };
    } catch {
      return null;
    }
  }

  /**
   * Create a Rust issue
   */
  protected createIssue(
    category: RustIssue['category'],
    message: string,
    filePath: string,
    line: number,
    column: number,
    severity: Severity,
    linter?: string,
    suggestion?: string
  ): RustIssue {
    return {
      type: category,
      category,
      message,
      file: filePath,
      line,
      column,
      severity,
      linter,
      suggestion,
    };
  }

  /**
   * Map Clippy/rustc severity to ODAVL severity
   */
  protected mapSeverity(rustSeverity: string): Severity {
    const severityMap: Record<string, Severity> = {
      error: 'critical',
      warning: 'high',
      note: 'info',
      help: 'info',
    };
    return severityMap[rustSeverity.toLowerCase()] || 'high';
  }

  /**
   * Extract code snippet from content
   */
  protected extractCodeSnippet(content: string, line: number, context: number = 2): string {
    const lines = content.split('\n');
    const start = Math.max(0, line - context - 1);
    const end = Math.min(lines.length, line + context);
    return lines.slice(start, end).join('\n');
  }
}
