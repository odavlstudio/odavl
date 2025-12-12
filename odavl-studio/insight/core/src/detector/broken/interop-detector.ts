/**
 * @fileoverview Detects Kotlin-Java interop issues
 * @JvmStatic, @JvmField, @JvmOverloads, platform types
 */

import { KotlinBaseDetector, type KotlinDetectorOptions, type KotlinIssue } from './kotlin-base-detector';
import type { DetectorResult } from '../../types';

export class InteropDetector extends KotlinBaseDetector {
  constructor(options: KotlinDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isKotlinFile(filePath)) {
      return { issues: [], metadata: { detector: 'interop', skipped: true } };
    }

    const issues: KotlinIssue[] = [];
    const lines = content.split('\n');

    // Missing @JvmStatic for companion object
    this.detectMissingJvmStatic(lines, filePath, issues);

    // Missing @JvmOverloads for default parameters
    this.detectMissingJvmOverloads(lines, filePath, issues);

    // @JvmField misuse
    this.detectJvmFieldMisuse(lines, filePath, issues);

    return {
      issues,
      metadata: {
        detector: 'interop',
        issuesFound: issues.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Detect missing @JvmStatic
   */
  private detectMissingJvmStatic(
    lines: string[],
    filePath: string,
    issues: KotlinIssue[]
  ): void {\n    let inCompanionObject = false;\n\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Entering companion object\n      if (/companion\\s+object/.test(line)) {\n        inCompanionObject = true;\n        continue;\n      }\n\n      // Exiting companion object\n      if (inCompanionObject && /^\\s*\\}/.test(line)) {\n        inCompanionObject = false;\n        continue;\n      }\n\n      // In companion object - check for functions\n      if (inCompanionObject && /fun\\s+(\\w+)/.test(line)) {\n        const funcName = line.match(/fun\\s+(\\w+)/)?.[1];\n        \n        // Check if @JvmStatic is present\n        const previousLine = i > 0 ? lines[i - 1] : '';\n        if (funcName && !/@JvmStatic/.test(previousLine) && !/private/.test(line)) {\n          issues.push(\n            this.createIssue(\n              'interop',\n              `Missing @JvmStatic: ${funcName} in companion object not accessible from Java`,\n              filePath,\n              i + 1,\n              line.indexOf('fun'),\n              'warning',\n              'interop-detector',\n              'missing_jvmstatic',\n              'Add @JvmStatic annotation for Java interop'\n            )\n          );\n        }\n      }\n    }\n  }\n\n  /**\n   * Detect missing @JvmOverloads\n   */\n  private detectMissingJvmOverloads(\n    lines: string[],\n    filePath: string,\n    issues: KotlinIssue[]\n  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Pattern: Function with default parameters\n      if (/fun\\s+(\\w+).*=/.test(line) && !/private/.test(line)) {\n        const funcName = line.match(/fun\\s+(\\w+)/)?.[1];\n        \n        // Check if @JvmOverloads is present\n        const previousLine = i > 0 ? lines[i - 1] : '';\n        if (funcName && !/@JvmOverloads/.test(previousLine)) {\n          issues.push(\n            this.createIssue(\n              'interop',\n              `Missing @JvmOverloads: ${funcName} with defaults not fully accessible from Java`,\n              filePath,\n              i + 1,\n              line.indexOf('fun'),\n              'info',\n              'interop-detector',\n              'missing_jvmoverloads',\n              'Add @JvmOverloads to generate Java overloads'\n            )\n          );\n        }\n      }\n    }\n  }\n\n  /**\n   * Detect @JvmField misuse\n   */\n  private detectJvmFieldMisuse(\n    lines: string[],\n    filePath: string,\n    issues: KotlinIssue[]\n  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Pattern: @JvmField on var\n      if (/@JvmField/.test(line)) {\n        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';\n        \n        // Check if mutable\n        if (/\\bvar\\b/.test(nextLine)) {\n          issues.push(\n            this.createIssue(\n              'interop',\n              '@JvmField on var: Exposes mutable field to Java - use getter/setter',\n              filePath,\n              i + 2,\n              nextLine.indexOf('var'),\n              'warning',\n              'interop-detector',\n              'jvmfield_var',\n              'Use val or remove @JvmField and use property'\n            )\n          );\n        }\n      }\n    }\n  }\n}
