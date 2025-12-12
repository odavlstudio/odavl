/**
 * @fileoverview Base detector for Swift-specific analysis
 * Swift: Modern, safe, fast language for iOS/macOS development
 */

import type { Issue, DetectorResult } from '../../types';

export interface SwiftDetectorOptions {
  useSwiftLint?: boolean;
  swiftVersion?: '5.7' | '5.8' | '5.9' | '5.10';
  platform?: 'iOS' | 'macOS' | 'watchOS' | 'tvOS';
  useStrictConcurrency?: boolean;
}

export interface SwiftIssue extends Issue {
  category: 
    | 'memory'         // ARC, retain cycles, leaks
    | 'optionals'      // Force unwrap, implicitly unwrapped
    | 'concurrency'    // async/await, actors, data races
    | 'performance'    // Performance issues
    | 'style'          // Code style violations
    | 'correctness'    // Logic errors
    | 'deprecated'     // Deprecated APIs
    | 'naming'         // Naming conventions
    | 'complexity'     // Cognitive complexity
    | 'swiftui'        // SwiftUI-specific issues
    | 'combine';       // Combine framework issues
  swiftlintRule?: string; // SwiftLint rule name
}

export abstract class SwiftBaseDetector {
  protected options: SwiftDetectorOptions;

  constructor(options: SwiftDetectorOptions = {}) {
    this.options = {
      useSwiftLint: true,
      swiftVersion: '5.9',
      platform: 'iOS',
      useStrictConcurrency: true,
      ...options,
    };
  }

  abstract detect(filePath: string, content: string): Promise<DetectorResult>;

  /**
   * Check if file is Swift
   */
  protected isSwiftFile(filePath: string): boolean {
    return /\.swift$/i.test(filePath);
  }

  /**
   * Check if file is test file
   */
  protected isSwiftTestFile(filePath: string): boolean {
    return /Tests?\.swift$|Tests?\//.test(filePath);
  }

  /**
   * Extract class/struct/actor name from context
   */
  protected extractTypeName(content: string, line: number): string | null {
    const lines = content.split('\n');
    
    // Look back for type definition
    for (let i = line - 1; i >= Math.max(0, line - 10); i--) {
      const match = lines[i].match(/(?:class|struct|actor|enum|protocol)\s+(\w+)/);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * Check if code uses @MainActor
   */
  protected hasMainActor(content: string, line: number): boolean {
    const lines = content.split('\n');
    
    for (let i = Math.max(0, line - 5); i <= Math.min(line, lines.length - 1); i++) {
      if (/@MainActor/.test(lines[i])) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Create Swift-specific issue
   */
  protected createIssue(
    category: SwiftIssue['category'],
    message: string,
    filePath: string,
    line: number,
    column: number,
    severity: Issue['severity'],
    detector: string,
    swiftlintRule?: string,
    codeAction?: string
  ): SwiftIssue {
    return {
      type: category,
      category,
      message,
      file: filePath,
      line,
      column,
      severity,
      swiftlintRule,
    };
  }
}