/**
 * @fileoverview Detects Kotlin nullability issues
 * Null safety, !! operator, platform types
 */

import { KotlinBaseDetector, type KotlinDetectorOptions, type KotlinIssue } from './kotlin-base-detector';
import type { DetectorResult } from '../../types';

export class NullabilityDetector extends KotlinBaseDetector {
  constructor(options: KotlinDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isKotlinFile(filePath)) {
      return { issues: [], metadata: { detector: 'nullability', skipped: true } };
    }

    const issues: KotlinIssue[] = [];
    const lines = content.split('\n');

    // !! operator abuse
    this.detectBangBangOperator(lines, filePath, issues);

    // Platform types
    this.detectPlatformTypes(lines, filePath, issues);

    // Unnecessary null checks
    this.detectUnnecessaryNullChecks(lines, filePath, issues);

    return {
      issues,
      metadata: {
        detector: 'nullability',
        issuesFound: issues.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Detect !! operator (force unwrap)
   */
  private detectBangBangOperator(
    lines: string[],
    filePath: string,
    issues: KotlinIssue[]
  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Pattern: variable!!\n      if (/\\w+!!/.test(line)) {\n        issues.push(\n          this.createIssue(\n            'nullability',\n            'Force Unwrap: !! throws NPE - use safe call ?. or let',\n            filePath,\n            i + 1,\n            line.indexOf('!!'),\n            'warning',\n            'nullability-detector',\n            'force_unwrap',\n            'Use: value?.let { ... } or value ?: defaultValue'\n          )\n        );\n      }\n\n      // Pattern: as!!\n      if (/\\bas!!/.test(line)) {\n        issues.push(\n          this.createIssue(\n            'nullability',\n            'Force Cast: as!! throws exception - use safe cast as?',\n            filePath,\n            i + 1,\n            line.indexOf('as!!'),\n            'warning',\n            'nullability-detector',\n            'force_cast',\n            'Use: (value as? Type)?.let { ... }'\n          )\n        );\n      }\n    }\n  }\n\n  /**\n   * Detect platform types (Java interop)\n   */\n  private detectPlatformTypes(\n    lines: string[],\n    filePath: string,\n    issues: KotlinIssue[]\n  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Pattern: Java method call without null handling\n      if (/\\.java\\w*\\(/.test(line) || /JavaClass/.test(line)) {\n        const futureLines = lines.slice(i, Math.min(i + 5, lines.length)).join('\\n');\n        if (!/\\?\\.|\\.let\\(|\\?:/.test(futureLines)) {\n          issues.push(\n            this.createIssue(\n              'nullability',\n              'Platform Type: Java interop returns nullable - add null check',\n              filePath,\n              i + 1,\n              0,\n              'warning',\n              'nullability-detector',\n              'platform_type',\n              'Add safe call operator ?. or explicit null check'\n            )\n          );\n        }\n      }\n    }\n  }\n\n  /**\n   * Detect unnecessary null checks\n   */\n  private detectUnnecessaryNullChecks(\n    lines: string[],\n    filePath: string,\n    issues: KotlinIssue[]\n  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Pattern: Non-null type with null check\n      const nullCheckMatch = line.match(/(\\w+)\\s*!=\\s*null/);\n      if (nullCheckMatch) {\n        const varName = nullCheckMatch[1];\n        \n        // Look for declaration\n        for (let j = Math.max(0, i - 20); j < i; j++) {\n          const declMatch = lines[j].match(new RegExp(`(?:val|var)\\\\s+${varName}\\\\s*:\\\\s*(\\\\w+)\\\\s*=`));\n          if (declMatch && !/\\?/.test(declMatch[1])) {\n            issues.push(\n              this.createIssue(\n                'nullability',\n                `Unnecessary Null Check: ${varName} is non-nullable`,\n                filePath,\n                i + 1,\n                line.indexOf('!='),\n                'info',\n                'nullability-detector',\n                'unnecessary_null_check',\n                'Remove null check or make type nullable'\n              )\n            );\n            break;\n          }\n        }\n      }\n    }\n  }\n}
