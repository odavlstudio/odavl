/**
 * @fileoverview Base detector for PHP-specific analysis
 * PHP: Dynamic, loosely-typed web scripting language
 */

import type { Issue, DetectorResult } from '../../types';

export interface PhpDetectorOptions {
  usePHPStan?: boolean;
  usePsalm?: boolean;
  phpVersion?: '7.4' | '8.0' | '8.1' | '8.2' | '8.3';
  composerJsonPath?: string;
  strictTypes?: boolean;
}

export interface PhpIssue extends Issue {
  category: 
    | 'type-safety'    // Type errors, mixed types
    | 'security'       // SQL injection, XSS, CSRF
    | 'performance'    // N+1 queries, inefficient loops
    | 'correctness'    // Logic errors, undefined behavior
    | 'design'         // Code structure, SOLID violations
    | 'deprecated'     // Deprecated functions/features
    | 'error-handling' // Exception handling issues
    | 'nullable'       // Null safety issues
    | 'strict-types'   // strict_types=1 violations
    | 'psr'            // PSR standard violations
    | 'composer';      // Dependency issues
  phpstanLevel?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // PHPStan strictness level
  psalmIssueType?: string; // Psalm issue type (MixedArgument, etc.)
}

export abstract class PhpBaseDetector {
  protected options: PhpDetectorOptions;

  constructor(options: PhpDetectorOptions = {}) {
    this.options = {
      usePHPStan: true,
      usePsalm: false,
      phpVersion: '8.2',
      strictTypes: true,
      ...options,
    };
  }

  abstract detect(filePath: string, content: string): Promise<DetectorResult>;

  /**
   * Check if file is PHP
   */
  protected isPhpFile(filePath: string): boolean {
    return /\.php$/i.test(filePath);
  }

  /**
   * Check if file is test file
   */
  protected isPhpTestFile(filePath: string): boolean {
    return /Test\.php$|tests?\//.test(filePath);
  }

  /**
   * Parse composer.json for dependencies
   */
  protected async parseComposerJson(workspaceRoot: string): Promise<{
    phpVersion: string;
    dependencies: string[];
    autoload: Record<string, string>;
  } | null> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const composerPath = path.join(workspaceRoot, 'composer.json');
      const content = await fs.readFile(composerPath, 'utf8');
      const composer = JSON.parse(content);

      return {
        phpVersion: composer.require?.php || 'unknown',
        dependencies: Object.keys({
          ...composer.require,
          ...composer['require-dev'],
        }),
        autoload: composer.autoload || {},
      };
    } catch {
      return null;
    }
  }

  /**
   * Extract class/function name from context
   */
  protected extractMemberName(content: string, line: number): string | null {
    const lines = content.split('\n');
    
    // Look back for class/function definition
    for (let i = line - 1; i >= Math.max(0, line - 10); i--) {
      const match = lines[i].match(/(?:class|function|trait|interface)\s+(\w+)/);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * Check if strict_types is declared
   */
  protected hasStrictTypes(content: string): boolean {
    return /declare\s*\(\s*strict_types\s*=\s*1\s*\)/i.test(content);
  }

  /**
   * Create PHP-specific issue
   */
  protected createIssue(
    category: PhpIssue['category'],
    message: string,
    filePath: string,
    line: number,
    column: number,
    severity: Issue['severity'],
    detector: string,
    phpstanLevel?: PhpIssue['phpstanLevel'],
    codeAction?: string
  ): PhpIssue {
    return {
      type: category,
      category,
      message,
      file: filePath,
      line,
      column,
      severity,
      phpstanLevel,
    };
  }
}
