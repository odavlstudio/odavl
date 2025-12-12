/**
 * @fileoverview Base detector for Ruby-specific analysis
 * Ruby: Dynamic, elegant, object-oriented language (Rails, Sinatra)
 */

import type { Issue, DetectorResult } from '../../types';

export interface RubyDetectorOptions {
  useRuboCop?: boolean;
  rubyVersion?: '2.7' | '3.0' | '3.1' | '3.2' | '3.3';
  gemfilePath?: string;
  railsVersion?: string;
  isRailsProject?: boolean;
}

export interface RubyIssue extends Issue {
  category: 
    | 'style'          // Coding style violations
    | 'performance'    // Performance issues
    | 'security'       // Security vulnerabilities
    | 'correctness'    // Logic errors
    | 'rails'          // Rails-specific issues
    | 'naming'         // Naming conventions
    | 'complexity'     // Cognitive complexity
    | 'lint'           // Code smells
    | 'metrics'        // Method/class size
    | 'deprecation'    // Deprecated features
    | 'bundler';       // Gem dependencies
  rubocopCop?: string; // RuboCop cop name (Style/StringLiterals)
}

export abstract class RubyBaseDetector {
  protected options: RubyDetectorOptions;

  constructor(options: RubyDetectorOptions = {}) {
    this.options = {
      useRuboCop: true,
      rubyVersion: '3.2',
      isRailsProject: false,
      ...options,
    };
  }

  abstract detect(filePath: string, content: string): Promise<DetectorResult>;

  /**
   * Check if file is Ruby
   */
  protected isRubyFile(filePath: string): boolean {
    return /\.rb$/i.test(filePath) || /Rakefile|Gemfile/i.test(filePath);
  }

  /**
   * Check if file is test/spec file
   */
  protected isRubyTestFile(filePath: string): boolean {
    return /_spec\.rb$|_test\.rb$|spec\/|test\//.test(filePath);
  }

  /**
   * Parse Gemfile for dependencies
   */
  protected async parseGemfile(workspaceRoot: string): Promise<{
    gems: string[];
    rubyVersion: string | null;
    isRails: boolean;
  } | null> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const gemfilePath = path.join(workspaceRoot, 'Gemfile');
      const content = await fs.readFile(gemfilePath, 'utf8');

      const gems: string[] = [];
      const lines = content.split('\n');
      
      for (const line of lines) {
        const gemMatch = line.match(/gem\s+['"]([^'"]+)['"]/);
        if (gemMatch) {
          gems.push(gemMatch[1]);
        }
      }

      const rubyVersionMatch = content.match(/ruby\s+['"]([^'"]+)['"]/);
      const isRails = gems.includes('rails');

      return {
        gems,
        rubyVersion: rubyVersionMatch?.[1] || null,
        isRails,
      };
    } catch {
      return null;
    }
  }

  /**
   * Extract method/class name from context
   */
  protected extractMemberName(content: string, line: number): string | null {
    const lines = content.split('\n');
    
    // Look back for def/class/module definition
    for (let i = line - 1; i >= Math.max(0, line - 10); i--) {
      const match = lines[i].match(/(?:def|class|module)\s+(\w+)/);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * Check if Rails project
   */
  protected async isRails(workspaceRoot: string): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Check for config/application.rb
      const appPath = path.join(workspaceRoot, 'config', 'application.rb');
      await fs.access(appPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create Ruby-specific issue
   */
  protected createIssue(
    category: RubyIssue['category'],
    message: string,
    filePath: string,
    line: number,
    column: number,
    severity: Issue['severity'],
    detector: string,
    rubocopCop?: string,
    codeAction?: string
  ): RubyIssue {
    return {
      type: category,
      category,
      message,
      file: filePath,
      line,
      column,
      severity,
      rubocopCop,
    };
  }
}
