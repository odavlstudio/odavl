/**
 * @fileoverview Detects Swift memory management issues (ARC)
 * ARC: Automatic Reference Counting - retain cycles, leaks, weak/unowned
 */

import { SwiftBaseDetector, type SwiftDetectorOptions, type SwiftIssue } from './swift-base-detector';
import type { DetectorResult } from '../../types';

export class MemoryDetector extends SwiftBaseDetector {
  constructor(options: SwiftDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isSwiftFile(filePath)) {
      return { issues: [], metadata: { detector: 'memory', skipped: true } };
    }

    const issues: SwiftIssue[] = [];
    const lines = content.split('\n');

    // Retain cycle detection
    this.detectRetainCycles(lines, filePath, issues);

    // Missing weak self in closures
    this.detectMissingWeakSelf(lines, filePath, issues);

    // Unowned vs weak usage
    this.detectUnownedUsage(lines, filePath, issues);

    // Closure capture lists
    this.detectMissingCaptureList(lines, filePath, issues);

    return {
      issues,
      metadata: {
        detector: 'memory',
        issuesFound: issues.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Detect potential retain cycles
   */
  private detectRetainCycles(
    lines: string[],
    filePath: string,
    issues: SwiftIssue[]
  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Pattern: Closure accessing self without [weak self] or [unowned self]\n      if (/\\{[^\\[]*\\bself\\b/.test(line) && !/\\[(?:weak|unowned)\\s+self\\]/.test(line)) {\n        // Check if it's a completion handler or delegate\n        let isAsyncContext = false;\n        for (let j = Math.max(0, i - 5); j < i; j++) {\n          if (/completion|handler|@escaping|delegate/.test(lines[j])) {\n            isAsyncContext = true;\n            break;\n          }\n        }\n\n        if (isAsyncContext) {\n          issues.push(\n            this.createIssue(\n              'memory',\n              'Retain Cycle: Closure captures self strongly - use [weak self]',\n              filePath,\n              i + 1,\n              line.indexOf('self'),\n              'warning',\n              'memory-detector',\n              'strong_capture_list',\n              'Add capture list: { [weak self] in guard let self else { return } }'\n            )\n          );\n        }\n      }\n    }\n  }\n\n  /**\n   * Detect missing weak self in closures\n   */\n  private detectMissingWeakSelf(\n    lines: string[],\n    filePath: string,\n    issues: SwiftIssue[]\n  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Pattern: @escaping closure without weak self\n      if (/@escaping/.test(line)) {\n        // Look for closure definition in next lines\n        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {\n          if (/\\{/.test(lines[j]) && !/\\[weak self\\]/.test(lines[j])) {\n            if (/\\bself\\b/.test(lines.slice(j, Math.min(j + 20, lines.length)).join('\\n'))) {\n              issues.push(\n                this.createIssue(\n                  'memory',\n                  '@escaping closure without [weak self] - memory leak risk',\n                  filePath,\n                  j + 1,\n                  0,\n                  'warning',\n                  'memory-detector',\n                  'weak_self',\n                  'Add [weak self] capture list'\n                )\n              );\n              break;\n            }\n          }\n        }\n      }\n    }\n  }\n\n  /**\n   * Detect risky unowned usage\n   */\n  private detectUnownedUsage(\n    lines: string[],\n    filePath: string,\n    issues: SwiftIssue[]\n  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Pattern: [unowned self]\n      if (/\\[unowned self\\]/.test(line)) {\n        issues.push(\n          this.createIssue(\n            'memory',\n            'Risky: [unowned self] can crash if self is deallocated',\n            filePath,\n            i + 1,\n            line.indexOf('unowned'),\n            'warning',\n            'memory-detector',\n            'unowned_self',\n            'Use [weak self] unless 100% certain self outlives closure'\n          )\n        );\n      }\n\n      // Pattern: unowned property\n      if (/\\bunowned\\s+(?:let|var)/.test(line)) {\n        issues.push(\n          this.createIssue(\n            'memory',\n            'Unowned Property: Crashes if referenced object deallocates',\n            filePath,\n            i + 1,\n            line.indexOf('unowned'),\n            'warning',\n            'memory-detector',\n            'unowned_property',\n            'Consider weak var and handle optionality safely'\n          )\n        );\n      }\n    }\n  }\n\n  /**\n   * Detect missing capture lists in complex closures\n   */\n  private detectMissingCaptureList(\n    lines: string[],\n    filePath: string,\n    issues: SwiftIssue[]\n  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Pattern: Closure with properties but no capture list\n      if (/\\{\\s*\\n/.test(line)) {\n        const closureStart = i;\n        let braceCount = 1;\n        let hasSelf = false;\n        let hasCaptureList = /\\[/.test(line);\n\n        // Scan closure body\n        for (let j = closureStart + 1; j < Math.min(closureStart + 30, lines.length); j++) {\n          braceCount += (lines[j].match(/\\{/g) || []).length;\n          braceCount -= (lines[j].match(/\\}/g) || []).length;\n\n          if (braceCount === 0) break;\n          if (/\\bself\\./.test(lines[j])) hasSelf = true;\n        }\n\n        if (hasSelf && !hasCaptureList) {\n          issues.push(\n            this.createIssue(\n              'memory',\n              'Missing Capture List: Closure accesses self without explicit capture',\n              filePath,\n              closureStart + 1,\n              0,\n              'info',\n              'memory-detector',\n              'capture_list',\n              'Add capture list to make memory semantics explicit'\n            )\n          );\n        }\n      }\n    }\n  }\n}
