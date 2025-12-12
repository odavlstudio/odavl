/**
 * @fileoverview Detects Kotlin Coroutines anti-patterns
 * Flow, suspend functions, CoroutineScope, structured concurrency
 */

import { KotlinBaseDetector, type KotlinDetectorOptions, type KotlinIssue } from './kotlin-base-detector';
import type { DetectorResult } from '../../types';

export class CoroutinesDetector extends KotlinBaseDetector {
  constructor(options: KotlinDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isKotlinFile(filePath)) {
      return { issues: [], metadata: { detector: 'coroutines', skipped: true } };
    }

    const issues: KotlinIssue[] = [];
    const lines = content.split('\n');

    // GlobalScope usage (anti-pattern)
    this.detectGlobalScope(lines, filePath, issues);

    // Missing withContext for blocking operations
    this.detectBlockingOperations(lines, filePath, issues);

    // Flow misuse
    this.detectFlowMisuse(lines, filePath, issues);

    // Dispatcher misuse
    this.detectDispatcherMisuse(lines, filePath, issues);

    return {
      issues,
      metadata: {
        detector: 'coroutines',
        issuesFound: issues.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Detect GlobalScope anti-pattern
   */
  private detectGlobalScope(
    lines: string[],
    filePath: string,
    issues: KotlinIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern: GlobalScope.launch
      if (/GlobalScope\.launch|GlobalScope\.async/.test(line)) {
        issues.push(
          this.createIssue(
            'coroutines',
            'GlobalScope Anti-Pattern: Use structured concurrency instead',
            filePath,
            i + 1,
            line.indexOf('GlobalScope'),
            'error',
            'coroutines-detector',
            'global_scope',
            'Use: viewModelScope, lifecycleScope, or CoroutineScope(Dispatchers.IO)'
          )
        );
      }
    }
  }

  /**
   * Detect blocking operations without withContext
   */
  private detectBlockingOperations(
    lines: string[],
    filePath: string,
    issues: KotlinIssue[]
  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Check if in suspend function\n      let inSuspendFunction = false;\n      for (let j = Math.max(0, i - 10); j < i; j++) {\n        if (/suspend\s+fun/.test(lines[j])) {\n          inSuspendFunction = true;\n          break;\n        }\n      }\n\n      if (!inSuspendFunction) continue;\n\n      // Pattern: Blocking I/O in suspend function\n      const blockingOps = [\n        /File\\.read/,\n        /FileInputStream/,\n        /URL\\.openStream/,\n        /Socket\(/,\n        /Thread\\.sleep/,\n        /runBlocking/,\n      ];\n\n      if (blockingOps.some(p => p.test(line)) && !/withContext/.test(line)) {\n        issues.push(\n          this.createIssue(\n            'coroutines',\n            'Blocking Operation: Use withContext(Dispatchers.IO) for I/O',\n            filePath,\n            i + 1,\n            0,\n            'warning',\n            'coroutines-detector',\n            'blocking_io',\n            'Wrap with: withContext(Dispatchers.IO) { ... }'\n          )\n        );\n      }\n    }\n  }\n\n  /**\n   * Detect Flow API misuse\n   */\n  private detectFlowMisuse(\n    lines: string[],\n    filePath: string,\n    issues: KotlinIssue[]\n  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Pattern: Flow collection without lifecycle awareness\n      if (/\\.collect\s*\\{/.test(line) && this.isAndroidContext(lines.join('\\n'))) {\n        // Check if not in lifecycleScope/viewModelScope\n        const context = lines.slice(Math.max(0, i - 5), i).join('\\n');\n        if (!/lifecycleScope|viewModelScope|repeatOnLifecycle/.test(context)) {\n          issues.push(\n            this.createIssue(\n              'coroutines',\n              'Flow Collection: Use lifecycleScope.launchWhenStarted in Android',\n              filePath,\n              i + 1,\n              line.indexOf('.collect'),\n              'warning',\n              'coroutines-detector',\n              'flow_lifecycle',\n              'Use: lifecycleScope.launch { repeatOnLifecycle(Lifecycle.State.STARTED) { flow.collect {} } }'\n            )\n          );\n        }\n      }\n\n      // Pattern: StateFlow without distinctUntilChanged\n      if (/StateFlow|MutableStateFlow/.test(line)) {\n        const futureLines = lines.slice(i, Math.min(i + 20, lines.length)).join('\\n');\n        if (/\\.collect/.test(futureLines) && !/distinctUntilChanged/.test(futureLines)) {\n          issues.push(\n            this.createIssue(\n              'coroutines',\n              'StateFlow: Consider .distinctUntilChanged() to avoid duplicate emissions',\n              filePath,\n              i + 1,\n              0,\n              'info',\n              'coroutines-detector',\n              'stateflow_distinct'\n            )\n          );\n        }\n      }\n    }\n  }\n\n  /**\n   * Detect Dispatcher misuse\n   */\n  private detectDispatcherMisuse(\n    lines: string[],\n    filePath: string,\n    issues: KotlinIssue[]\n  ): void {\n    for (let i = 0; i < lines.length; i++) {\n      const line = lines[i];\n\n      // Pattern: Dispatchers.Main for I/O\n      if (/Dispatchers\\.Main/.test(line)) {\n        const futureLines = lines.slice(i, Math.min(i + 10, lines.length)).join('\\n');\n        if (/File\\.|network|http|database/.test(futureLines)) {\n          issues.push(\n            this.createIssue(\n              'coroutines',\n              'Wrong Dispatcher: Use Dispatchers.IO for I/O operations',\n              filePath,\n              i + 1,\n              line.indexOf('Dispatchers.Main'),\n              'error',\n              'coroutines-detector',\n              'wrong_dispatcher',\n              'Change to: Dispatchers.IO'\n            )\n          );\n        }\n      }\n    }\n  }\n}
