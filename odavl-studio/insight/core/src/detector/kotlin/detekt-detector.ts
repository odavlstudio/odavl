/**
 * @fileoverview Integrates Detekt static analysis tool
 * Detekt: Kotlin code quality and style checker (400+ rules)
 */

import { KotlinBaseDetector, type KotlinDetectorOptions, type KotlinIssue } from './kotlin-base-detector';
import type { DetectorResult } from '../../types';

interface DetektFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  location: {
    file: string;
    position: {
      line: number;
      column: number;
    };
  };
  debt?: string;
  references?: string[];
}

export class DetektDetector extends KotlinBaseDetector {
  constructor(options: KotlinDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isKotlinFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'detekt' };
    }

    const issues: KotlinIssue[] = [];

    // Run Detekt if enabled
    if (this.options.useDetekt) {
      const detektIssues = await this.runDetekt(filePath);
      issues.push(...detektIssues);
    }

    return {
      issues,
      duration: 0,
      detectorName: 'detekt',
    };
  }

  /**
   * Execute Detekt analysis
   */
  private async runDetekt(filePath: string): Promise<KotlinIssue[]> {
    try {
      const { execSync } = await import('child_process');
      
      // Detekt command with JSON output
      const configFlag = this.options.detektConfigPath 
        ? `--config ${this.options.detektConfigPath}` 
        : '';
      const cmd = `detekt --input ${filePath} --report json ${configFlag}`;
      
      const output = execSync(cmd, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const findings: DetektFinding[] = JSON.parse(output);
      const issues: KotlinIssue[] = [];

      for (const finding of findings) {
        const issue = this.convertDetektFinding(finding);
        if (issue) {
          issues.push(issue);
        }
      }

      return issues;
    } catch (error: unknown) {
      const execError = error as { stdout?: Buffer; stderr?: Buffer };
      
      if (execError.stdout) {
        try {
          const findings: DetektFinding[] = JSON.parse(execError.stdout.toString());
          return findings.map(f => this.convertDetektFinding(f)).filter(Boolean) as KotlinIssue[];
        } catch {
          // JSON parse failed
        }
      }

      return [];
    }
  }

  /**
   * Convert Detekt finding to ODAVL issue
   */
  private convertDetektFinding(finding: DetektFinding): KotlinIssue | null {
    const category = this.categorizeDetektRule(finding.id);
    
    return this.createIssue(
      category,
      finding.description,
      finding.location.file,
      finding.location.position.line,
      finding.location.position.column,
      finding.severity,
      'detekt-detector',
      finding.id,
      'Run: detekt --auto-correct to fix',
      this.options.isAndroidProject
    );
  }

  /**
   * Categorize Detekt rule by rule set
   */
  private categorizeDetektRule(ruleId: string): KotlinIssue['category'] {
    // Complexity rules
    if (/complexity|cognitive|cyclomatic|nested|long/i.test(ruleId)) {
      return 'complexity';
    }

    // Coroutines rules
    if (/coroutine|suspend|flow|dispatcher/i.test(ruleId)) {
      return 'coroutines';
    }

    // Empty blocks
    if (/empty/i.test(ruleId)) {
      return 'empty-blocks';
    }

    // Exception handling
    if (/exception|throw|catch|try/i.test(ruleId)) {
      return 'exceptions';
    }

    // Naming conventions
    if (/naming|name|identifier/i.test(ruleId)) {
      return 'naming';
    }

    // Performance
    if (/performance|efficient|spread|array/i.test(ruleId)) {
      return 'performance';
    }

    // Potential bugs
    if (/bug|equals|hash|null|cast|unsafe/i.test(ruleId)) {
      return 'potential-bugs';
    }

    // Nullability
    if (/null|!!|safe/.test(ruleId)) {
      return 'nullability';
    }

    // Formatting
    if (/format|indent|spacing|line|comma/.test(ruleId)) {
      return 'formatting';
    }

    return 'style';
  }
}
