/**
 * ODAVL Performance Analyzer Plugin
 * Detects performance bottlenecks and optimization opportunities
 */

import { DetectorPlugin, PluginHelpers, type Issue, type PluginContext } from '@odavl-studio/sdk/plugin';

export class PerformanceAnalyzerPlugin extends DetectorPlugin {
  async onInit(context: PluginContext): Promise<void> {
    this.logger = context.logger;
    this.logger.info('Performance Analyzer Plugin initialized');
  }

  async detect(code: string, filePath: string): Promise<Issue[]> {
    const issues: Issue[] = [];

    issues.push(...this.detectNPlusOne(code));
    issues.push(...this.detectLargeLoops(code));
    issues.push(...this.detectMemoryLeaks(code));
    issues.push(...this.detectBlockingOperations(code));
    issues.push(...this.detectIneffientRegex(code));

    return issues;
  }

  private detectNPlusOne(code: string): Issue[] {
    const issues: Issue[] = [];
    const pattern = /for\s*\([^)]+\)\s*\{[^}]*(?:await\s+)?(?:fetch|query|findOne|findById)\(/g;
    const matches = PluginHelpers.matchPattern(code, pattern);

    for (const match of matches) {
      issues.push(PluginHelpers.createIssue({
        type: 'performance',
        severity: 'high',
        message: 'N+1 query detected: Database query inside loop',
        line: match.line,
        column: match.column,
        suggestion: 'Use batch query or JOIN to fetch all data at once',
        documentation: 'https://stackoverflow.com/questions/97197/what-is-the-n1-selects-problem',
        tags: ['n+1', 'database', 'performance'],
      }));
    }

    return issues;
  }

  private detectLargeLoops(code: string): Issue[] {
    const issues: Issue[] = [];
    const pattern = /for\s*\([^)]+\)\s*\{[^}]*for\s*\([^)]+\)\s*\{/g;
    const matches = PluginHelpers.matchPattern(code, pattern);

    for (const match of matches) {
      const complexity = PluginHelpers.calculateComplexity(match.text);
      if (complexity > 10) {
        issues.push(PluginHelpers.createIssue({
          type: 'performance',
          severity: 'medium',
          message: 'Nested loops with high complexity (O(n²) or worse)',
          line: match.line,
          column: match.column,
          suggestion: 'Consider using Map/Set for O(1) lookup or optimize algorithm',
          tags: ['complexity', 'nested-loops'],
        }));
      }
    }

    return issues;
  }

  private detectMemoryLeaks(code: string): Issue[] {
    const issues: Issue[] = [];
    
    // Missing cleanup in useEffect
    const effectPattern = /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*(?:setInterval|setTimeout|addEventListener)[^}]*\}\s*,/g;
    const effectMatches = PluginHelpers.matchPattern(code, effectPattern);

    for (const match of effectMatches) {
      if (!match.text.includes('return')) {
        issues.push(PluginHelpers.createIssue({
          type: 'performance',
          severity: 'high',
          message: 'Memory leak: useEffect missing cleanup function',
          line: match.line,
          suggestion: 'Return cleanup function to clear interval/timeout/listener',
          tags: ['memory-leak', 'react', 'cleanup'],
        }));
      }
    }

    return issues;
  }

  private detectBlockingOperations(code: string): Issue[] {
    const issues: Issue[] = [];
    const patterns = [
      /JSON\.parse\([^)]{100,}\)/g,
      /JSON\.stringify\([^)]{100,}\)/g,
      /readFileSync\(/g,
    ];

    for (const pattern of patterns) {
      const matches = PluginHelpers.matchPattern(code, pattern);
      for (const match of matches) {
        issues.push(PluginHelpers.createIssue({
          type: 'performance',
          severity: 'medium',
          message: 'Blocking operation detected',
          line: match.line,
          suggestion: 'Use async alternative or move to worker thread',
          tags: ['blocking', 'async'],
        }));
      }
    }

    return issues;
  }

  private detectIneffientRegex(code: string): Issue[] {
    const issues: Issue[] = [];
    const pattern = /\/[^\/]*\(\.\*\)\+[^\/]*\//g;
    const matches = PluginHelpers.matchPattern(code, pattern);

    for (const match of matches) {
      issues.push(PluginHelpers.createIssue({
        type: 'performance',
        severity: 'low',
        message: 'Inefficient regex: Catastrophic backtracking risk',
        line: match.line,
        suggestion: 'Simplify regex or use specific patterns',
        tags: ['regex', 'backtracking'],
      }));
    }

    return issues;
  }

  supports(language: string): boolean {
    return ['typescript', 'javascript'].includes(language);
  }

  shouldSkip(filePath: string): boolean {
    return filePath.includes('.test.') || filePath.includes('.spec.');
  }

  async onDestroy(): Promise<void> {
    this.logger?.info('Performance Analyzer Plugin destroyed');
  }

  validate(): boolean {
    return true;
  }
}

export default PerformanceAnalyzerPlugin;
