/**
 * @fileoverview Detects Swift optionals misuse\n * Force unwrapping, implicitly unwrapped optionals, optional chaining
 */

import { SwiftBaseDetector, type SwiftDetectorOptions, type SwiftIssue } from './swift-base-detector';
import type { DetectorResult } from '../../types';

export class OptionalsDetector extends SwiftBaseDetector {
  constructor(options: SwiftDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isSwiftFile(filePath)) {
      return { issues: [], metadata: { detector: 'optionals', skipped: true } };
    }

    const issues: SwiftIssue[] = [];
    const lines = content.split('\n');

    // Force unwrap detection
    this.detectForceUnwrap(lines, filePath, issues);

    // Implicitly unwrapped optionals
    this.detectImplicitlyUnwrapped(lines, filePath, issues);

    // Nested optionals
    this.detectNestedOptionals(lines, filePath, issues);

    // Force try detection
    this.detectForceTry(lines, filePath, issues);

    return {
      issues,
      metadata: {
        detector: 'optionals',
        issuesFound: issues.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Detect force unwrap (!)
   */
  private detectForceUnwrap(
    lines: string[],
    filePath: string,
    issues: SwiftIssue[]
  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Pattern: variable! or expression!\n      const forceUnwraps = line.match(/\\w+!/g);\n      if (forceUnwraps) {\n        for (const match of forceUnwraps) {\n          // Skip type annotations (Type!)\n          if (!/[A-Z]\\w+!/.test(match)) {\n            issues.push(\n              this.createIssue(\n                'optionals',\n                `Force Unwrap: ${match} - use optional binding or nil coalescing`,\n                filePath,\n                i + 1,\n                line.indexOf(match),\n                'warning',\n                'optionals-detector',\n                'force_unwrapping',\n                'Use: if let value = optional { ... } or optional ?? defaultValue'\n              )\n            );\n          }\n        }\n      }\n\n      // Pattern: as!\n      if (/\\bas!\\b/.test(line)) {\n        issues.push(\n          this.createIssue(\n            'optionals',\n            'Force Cast: as! - use as? with optional binding',\n            filePath,\n            i + 1,\n            line.indexOf('as!'),\n            'warning',\n            'optionals-detector',\n            'force_cast',\n            'Use: if let value = obj as? Type { ... }'\n          )\n        );\n      }\n    }\n  }\n\n  /**\n   * Detect implicitly unwrapped optionals\n   */\n  private detectImplicitlyUnwrapped(\n    lines: string[],\n    filePath: string,\n    issues: SwiftIssue[]\n  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Pattern: var name: Type!\n      if (/(?:var|let)\\s+\\w+:\\s*\\w+!/.test(line)) {\n        // Exceptions: IBOutlets are OK\n        if (!/@IBOutlet/.test(line)) {\n          issues.push(\n            this.createIssue(\n              'optionals',\n              'Implicitly Unwrapped Optional: Use regular optional (Type?) instead',\n              filePath,\n              i + 1,\n              line.search(/:\\s*\\w+!/),\n              'warning',\n              'optionals-detector',\n              'implicitly_unwrapped_optional',\n              'Replace Type! with Type? and handle optionality safely'\n            )\n          );\n        }\n      }\n    }\n  }\n\n  /**\n   * Detect nested optionals (Type??)\n   */\n  private detectNestedOptionals(\n    lines: string[],\n    filePath: string,\n    issues: SwiftIssue[]\n  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Pattern: Type??\n      if (/\\w+\\?\\?/.test(line)) {\n        issues.push(\n          this.createIssue(\n            'optionals',\n            'Nested Optional: Type?? is confusing - flatten the optional',\n            filePath,\n            i + 1,\n            line.search(/\\w+\\?\\?/),\n            'warning',\n            'optionals-detector',\n            'nested_optional',\n            'Use flatMap or restructure to avoid nested optionals'\n          )\n        );\n      }\n    }\n  }\n\n  /**\n   * Detect force try (try!)\n   */\n  private detectForceTry(\n    lines: string[],\n    filePath: string,\n    issues: SwiftIssue[]\n  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Pattern: try!\n      if (/\\btry!\\b/.test(line)) {\n        issues.push(\n          this.createIssue(\n            'optionals',\n            'Force Try: try! crashes on error - use try? or do-catch',\n            filePath,\n            i + 1,\n            line.indexOf('try!'),\n            'error',\n            'optionals-detector',\n            'force_try',\n            'Use: do { try ... } catch { ... } or try?'\n          )\n        );\n      }\n    }\n  }\n}
