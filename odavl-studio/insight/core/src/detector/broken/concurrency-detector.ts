/**
 * @fileoverview Detects Swift concurrency issues\n * async/await, actors, @MainActor, Sendable, data races
 */

import { SwiftBaseDetector, type SwiftDetectorOptions, type SwiftIssue } from './swift-base-detector';
import type { DetectorResult } from '../../types';

export class ConcurrencyDetector extends SwiftBaseDetector {
  constructor(options: SwiftDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isSwiftFile(filePath)) {
      return { issues: [], metadata: { detector: 'concurrency', skipped: true } };
    }

    const issues: SwiftIssue[] = [];
    const lines = content.split('\n');

    // Missing await detection
    this.detectMissingAwait(lines, filePath, issues);

    // Main actor violations
    this.detectMainActorViolations(lines, filePath, issues);

    // Sendable violations
    this.detectSendableViolations(lines, filePath, issues);

    // Data race detection
    this.detectDataRaces(lines, filePath, issues);

    return {
      issues,
      metadata: {
        detector: 'concurrency',
        issuesFound: issues.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**\n   * Detect missing await on async calls\n   */\n  private detectMissingAwait(\n    lines: string[],\n    filePath: string,\n    issues: SwiftIssue[]\n  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Pattern: async function call without await\n      if (/\\basync\\s+func/.test(lines.slice(Math.max(0, i - 10), i).join('\\n'))) {\n        if (/\\w+\\s*\\(/.test(line) && !/\\bawait\\b/.test(line) && !/\\/\\//.test(line)) {\n          // Check if function is async\n          const funcName = line.match(/(\\w+)\\s*\\(/)?.[1];\n          if (funcName) {\n            issues.push(\n              this.createIssue(\n                'concurrency',\n                `Missing await: ${funcName}() might be async`,\n                filePath,\n                i + 1,\n                line.indexOf(funcName),\n                'warning',\n                'concurrency-detector',\n                'missing_await',\n                'Add await if function is async'\n              )\n            );\n          }\n        }\n      }\n    }\n  }\n\n  /**\n   * Detect @MainActor violations\n   */\n  private detectMainActorViolations(\n    lines: string[],\n    filePath: string,\n    issues: SwiftIssue[]\n  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Pattern: UI updates without @MainActor\n      const uiPatterns = [\n        /\\bUIView\\b/,\n        /\\bUIViewController\\b/,\n        /\\.view\\./,\n        /\\.navigationController/,\n        /present\\(/,\n        /dismiss\\(/,\n      ];\n\n      if (uiPatterns.some(p => p.test(line))) {\n        if (!this.hasMainActor(content, i)) {\n          issues.push(\n            this.createIssue(\n              'concurrency',\n              'Main Actor: UI updates must be on @MainActor',\n              filePath,\n              i + 1,\n              0,\n              'error',\n              'concurrency-detector',\n              'main_actor_violation',\n              'Add @MainActor to function/class or wrap in: await MainActor.run { ... }'\n            )\n          );\n        }\n      }\n    }\n  }\n\n  /**\n   * Detect Sendable violations\n   */\n  private detectSendableViolations(\n    lines: string[],\n    filePath: string,\n    issues: SwiftIssue[]\n  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Pattern: Class passed to async context without Sendable\n      if (/\\bclass\\s+(\\w+)/.test(line)) {\n        const className = line.match(/\\bclass\\s+(\\w+)/)?.[1];\n        \n        // Check if Sendable conformance\n        if (className && !/:\\s*.*Sendable/.test(line)) {\n          // Check if used in async context later\n          const futureLines = lines.slice(i, Math.min(i + 50, lines.length)).join('\\n');\n          if (new RegExp(`Task.*${className}|async.*${className}`).test(futureLines)) {\n            issues.push(\n              this.createIssue(\n                'concurrency',\n                `Non-Sendable Type: ${className} used in concurrent context`,\n                filePath,\n                i + 1,\n                line.indexOf('class'),\n                'error',\n                'concurrency-detector',\n                'non_sendable',\n                `Make ${className} conform to Sendable or use actor instead`\n              )\n            );\n          }\n        }\n      }\n    }\n  }\n\n  /**\n   * Detect potential data races\n   */\n  private detectDataRaces(\n    lines: string[],\n    filePath: string,\n    issues: SwiftIssue[]\n  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Pattern: Mutable shared state without protection\n      if (/\\bvar\\s+(\\w+)/.test(line) && !/\\bprivate\\b/.test(line)) {\n        const varName = line.match(/\\bvar\\s+(\\w+)/)?.[1];\n        \n        // Check if accessed in async context\n        const futureLines = lines.slice(i, Math.min(i + 30, lines.length)).join('\\n');\n        if (varName && /Task\\s*\\{|async/.test(futureLines) && new RegExp(`\\\\b${varName}\\\\b`).test(futureLines)) {\n          issues.push(\n            this.createIssue(\n              'concurrency',\n              `Data Race: ${varName} is mutable and accessed in concurrent context`,\n              filePath,\n              i + 1,\n              line.indexOf('var'),\n              'error',\n              'concurrency-detector',\n              'data_race',\n              'Use actor for mutable state or make immutable (let)'\n            )\n          );\n        }\n      }\n    }\n  }\n}
