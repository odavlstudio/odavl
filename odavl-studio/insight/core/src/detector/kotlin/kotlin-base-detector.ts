/**
 * @fileoverview Base detector for Kotlin static analysis
 * Detekt: The standard for Kotlin code quality (400+ rules)
 */

import type { Issue, DetectorResult } from '../../types';

export interface KotlinDetectorOptions {
  useDetekt?: boolean;
  kotlinVersion?: '1.8' | '1.9' | '2.0';
  isAndroidProject?: boolean;
  useCoroutines?: boolean;
  detektConfigPath?: string;
}

export interface KotlinIssue extends Issue {
  category: 'complexity' | 'coroutines' | 'empty-blocks' | 'exceptions' | 'naming' 
    | 'performance' | 'potential-bugs' | 'style' | 'nullability' | 'interop' | 'formatting';
  detektRule?: string;
  isAndroid?: boolean;
}

export abstract class KotlinBaseDetector {
  protected options: KotlinDetectorOptions;

  constructor(options: KotlinDetectorOptions = {}) {
    this.options = {
      useDetekt: true,
      kotlinVersion: '2.0',
      isAndroidProject: false,
      useCoroutines: true,
      ...options,
    };
  }

  /**
   * Check if file is Kotlin
   */
  protected isKotlinFile(filePath: string): boolean {
    return /\.kt$/.test(filePath);
  }

  /**
   * Check if file is Kotlin test
   */
  protected isKotlinTestFile(filePath: string): boolean {
    return /Test\.kt$/.test(filePath) || /test\//.test(filePath);
  }

  /**
   * Extract class/function name
   */
  protected extractMemberName(content: string, line: number): string | null {
    const lines = content.split('\n');
    if (line < 0 || line >= lines.length) return null;

    const currentLine = lines[line];
    
    // Class/Interface/Object
    const classMatch = currentLine.match(/(?:class|interface|object|enum)\s+(\w+)/);
    if (classMatch) return classMatch[1];

    // Function
    const funcMatch = currentLine.match(/fun\s+(\w+)/);
    if (funcMatch) return funcMatch[1];

    return null;
  }

  /**
   * Check if suspend function
   */
  protected isSuspendFunction(content: string, line: number): boolean {
    const lines = content.split('\n');
    if (line < 0 || line >= lines.length) return false;
    
    return /\bsuspend\s+fun\b/.test(lines[line]);
  }

  /**
   * Check if Android context
   */
  protected isAndroidContext(content: string): boolean {
    return /import\s+android\./.test(content) || 
           /import\s+androidx\./.test(content) ||
           /Activity|Fragment|Service|BroadcastReceiver/.test(content);
  }

  /**
   * Create Kotlin issue
   */
  protected createIssue(
    category: KotlinIssue['category'],
    message: string,
    filePath: string,
    line: number,
    column: number,
    severity: Issue['severity'],
    source: string,
    ruleId?: string,
    suggestion?: string,
    isAndroid?: boolean
  ): KotlinIssue {
    return {
      type: category,
      category,
      message,
      file: filePath,
      line,
      column,
      severity,
      detektRule: ruleId,
      isAndroid,
      ...(suggestion && { suggestion }),
    };
  }

  abstract detect(filePath: string, content: string): Promise<DetectorResult>;
}
