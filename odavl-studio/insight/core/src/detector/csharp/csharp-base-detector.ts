/**
 * @fileoverview Base detector for C# language analysis
 * Provides foundation for all C#-specific detectors
 */

import type { DetectorResult, Issue, Severity } from '../../types';

export interface CSharpDetectorOptions {
  /** Use Roslyn analyzers (Microsoft's official .NET analyzer) */
  useRoslyn?: boolean;
  /** .NET version (6, 7, 8, 9) */
  dotnetVersion?: '6' | '7' | '8' | '9';
  /** C# language version (9, 10, 11, 12, 13) */
  languageVersion?: '9' | '10' | '11' | '12' | '13';
  /** Solution or project file path */
  projectPath?: string;
  /** Enable nullable reference types checking */
  nullableEnabled?: boolean;
  /** Custom analyzer configurations */
  analyzerConfig?: Record<string, unknown>;
}

export interface CSharpIssue extends Issue {
  /** C#-specific issue category */
  category: 
    | 'async'
    | 'linq'
    | 'nullable'
    | 'memory'
    | 'thread-safety'
    | 'ef-core'
    | 'performance'
    | 'design'
    | 'naming'
    | 'correctness'
    | 'security';
  /** Source analyzer (Roslyn, custom) */
  analyzer?: string;
  /** Diagnostic ID (e.g., CS1234, CA5001) */
  diagnosticId?: string;
  /** Code fix suggestion */
  codeAction?: string;
}

export abstract class CSharpBaseDetector {
  protected readonly options: CSharpDetectorOptions;

  constructor(options: CSharpDetectorOptions = {}) {
    this.options = {
      useRoslyn: true,
      dotnetVersion: '8',
      languageVersion: '12',
      nullableEnabled: true,
      ...options,
    };
  }

  /**
   * Detect issues in C# source code
   */
  abstract detect(filePath: string, content: string): Promise<DetectorResult>;

  /**
   * Check if file is a C# source file
   */
  protected isCSharpFile(filePath: string): boolean {
    return filePath.endsWith('.cs') && !filePath.includes('\\obj\\') && !filePath.includes('/obj/');
  }

  /**
   * Check if file is a C# test file
   */
  protected isCSharpTestFile(filePath: string): boolean {
    return filePath.endsWith('.cs') && (
      filePath.includes('Tests') || 
      filePath.includes('.Test') ||
      filePath.endsWith('Tests.cs') ||
      filePath.endsWith('Test.cs')
    );
  }

  /**
   * Parse .csproj to get project information
   */
  protected async parseCsProj(workspaceRoot: string): Promise<{
    targetFramework: string;
    nullable: boolean;
    langVersion: string;
  } | null> {
    try {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const files = await fs.readdir(workspaceRoot);
      const csprojFile = files.find(f => f.endsWith('.csproj'));
      
      if (!csprojFile) return null;
      
      const content = await fs.readFile(path.join(workspaceRoot, csprojFile), 'utf8');
      
      const targetFramework = content.match(/<TargetFramework>(.*?)<\/TargetFramework>/)?.[1] || 'net8.0';
      const nullable = /<Nullable>enable<\/Nullable>/.test(content);
      const langVersion = content.match(/<LangVersion>(.*?)<\/LangVersion>/)?.[1] || 'latest';
      
      return { targetFramework, nullable, langVersion };
    } catch {
      return null;
    }
  }

  /**
   * Create a C# issue
   */
  protected createIssue(
    category: CSharpIssue['category'],
    message: string,
    filePath: string,
    line: number,
    column: number,
    severity: Severity,
    analyzer?: string,
    diagnosticId?: string,
    codeAction?: string
  ): CSharpIssue {
    return {
      type: category,
      category,
      message,
      file: filePath,
      line,
      column,
      severity,
      analyzer,
      diagnosticId,
      codeAction,
    };
  }

  /**
   * Map Roslyn severity to ODAVL severity
   */
  protected mapSeverity(roslynSeverity: string): Severity {
    const severityMap: Record<string, Severity> = {
      Error: 'critical',
      Warning: 'high',
      Info: 'info',
      Hidden: 'low',
    };
    return severityMap[roslynSeverity] || 'high';
  }

  /**
   * Extract method or class name from context
   */
  protected extractMemberName(content: string, line: number): string | null {
    const lines = content.split('\n');
    
    // Look backwards for method/class definition
    for (let i = line - 1; i >= Math.max(0, line - 20); i--) {
      const methodMatch = lines[i].match(/\b(?:public|private|protected|internal|static|async|virtual|override)\s+.*\s+(\w+)\s*\(/);
      if (methodMatch) return methodMatch[1];
      
      const classMatch = lines[i].match(/\b(?:public|private|protected|internal|static|abstract|sealed)?\s*class\s+(\w+)/);
      if (classMatch) return classMatch[1];
    }
    
    return null;
  }

  /**
   * Check if method is async
   */
  protected isAsyncMethod(content: string, line: number): boolean {
    const lines = content.split('\n');
    for (let i = Math.max(0, line - 5); i < Math.min(line + 1, lines.length); i++) {
      if (/\basync\b/.test(lines[i])) return true;
    }
    return false;
  }

  /**
   * Extract type from variable declaration
   */
  protected extractType(line: string): string | null {
    const typeMatch = line.match(/(?:var|new)\s+(\w+(?:<[^>]+>)?)/);
    return typeMatch ? typeMatch[1] : null;
  }
}
