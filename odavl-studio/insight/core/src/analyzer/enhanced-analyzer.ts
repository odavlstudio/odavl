/**
 * Enhanced Analyzer - AI-Powered Issue Analysis
 * Adds confidence scores, priority ranking, and smart fix suggestions
 */

export interface EnhancedIssue {
  // Original issue data
  original: any;
  
  // Enhanced metadata
  confidence: number;        // 0-100: How confident we are this is a real issue
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact: {
    security: number;        // 0-10: Security impact
    performance: number;     // 0-10: Performance impact
    maintainability: number; // 0-10: Code quality impact
  };
  
  // AI-powered insights
  rootCause?: string;        // Why this happened
  smartFix?: string;         // How to fix (better than generic)
  preventionTip?: string;    // How to prevent in future
  relatedIssues?: string[];  // Links to similar issues
  
  // Context
  fileContext?: {
    framework?: string;      // React, Next.js, Express, etc.
    pattern?: string;        // MVC, hooks, middleware, etc.
    dependencies?: string[]; // Related packages
  };
}

export class EnhancedAnalyzer {
  /**
   * Analyze and enhance a single issue
   */
  enhanceIssue(issue: any, detectorName: string): EnhancedIssue {
    const enhanced: EnhancedIssue = {
      original: issue,
      confidence: this.calculateConfidence(issue, detectorName),
      priority: this.calculatePriority(issue, detectorName),
      impact: this.calculateImpact(issue, detectorName),
    };

    // Add smart insights
    enhanced.rootCause = this.analyzeRootCause(issue, detectorName);
    enhanced.smartFix = this.generateSmartFix(issue, detectorName);
    enhanced.preventionTip = this.generatePreventionTip(issue, detectorName);
    enhanced.fileContext = this.analyzeFileContext(issue);

    return enhanced;
  }

  /**
   * Calculate confidence score (0-100)
   */
  private calculateConfidence(issue: any, detectorName: string): number {
    let confidence = 100;

    // TypeScript & ESLint are always 100% confident
    if (detectorName === 'TypeScript' || detectorName === 'ESLint') {
      return 100;
    }

    // Security: Check if it's a known pattern
    if (detectorName === 'Security') {
      if (issue.type?.includes('CVE')) confidence = 100;
      if (issue.type?.includes('HARDCODED')) confidence = 95;
      if (issue.type?.includes('INJECTION')) confidence = 90;
    }

    // Performance: Some patterns are more certain
    if (detectorName === 'Performance') {
      if (issue.message?.includes('Long function')) confidence = 100;
      if (issue.message?.includes('complexity')) confidence = 95;
      if (issue.message?.includes('Inline style')) confidence = 60; // Lower - might be intentional
      if (issue.message?.includes('fetch call inside loop')) confidence = 90;
    }

    // Complexity: Duplicate code detection can have false positives
    if (detectorName === 'Complexity') {
      if (issue.message?.includes('Duplicate code')) confidence = 70;
    }

    // Runtime: Connection cleanup detection can be tricky
    if (detectorName === 'Runtime') {
      if (issue.message?.includes('Prisma connection')) confidence = 60; // Lower - often singleton
      if (issue.message?.includes('setInterval')) confidence = 95;
      if (issue.message?.includes('addEventListener')) confidence = 95;
    }

    // Network: Timeout and error handling checks
    if (detectorName === 'Network') {
      if (issue.message?.includes('without timeout')) confidence = 85;
      if (issue.message?.includes('without error handling')) confidence = 75;
      if (issue.message?.includes('Hardcoded URL')) confidence = 50; // Often configuration
    }

    return confidence;
  }

  /**
   * Calculate priority based on severity and confidence
   */
  private calculatePriority(issue: any, detectorName: string): 'critical' | 'high' | 'medium' | 'low' {
    const confidence = this.calculateConfidence(issue, detectorName);
    const severity = issue.severity || 'medium';

    // High confidence + high severity = critical
    if (confidence >= 90 && (severity === 'critical' || severity === 'high')) {
      return 'critical';
    }

    // High confidence + medium severity = high
    if (confidence >= 80 && severity === 'high') {
      return 'high';
    }

    // Medium confidence or medium severity = medium
    if (confidence >= 60 || severity === 'medium') {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Calculate impact scores
   */
  private calculateImpact(issue: any, detectorName: string): EnhancedIssue['impact'] {
    const impact = { security: 0, performance: 0, maintainability: 0 };

    // Security detector
    if (detectorName === 'Security') {
      impact.security = issue.severity === 'critical' ? 10 : issue.severity === 'high' ? 8 : 5;
    }

    // Performance detector
    if (detectorName === 'Performance') {
      impact.performance = issue.severity === 'critical' ? 10 : issue.severity === 'high' ? 7 : 4;
      impact.maintainability = 3;
    }

    // Complexity detector
    if (detectorName === 'Complexity') {
      impact.maintainability = 8;
      impact.security = 2; // Complex code can hide bugs
    }

    // Runtime detector
    if (detectorName === 'Runtime') {
      impact.performance = 6;
      impact.security = 3;
      impact.maintainability = 5;
    }

    // TypeScript
    if (detectorName === 'TypeScript') {
      impact.security = 4;
      impact.maintainability = 7;
    }

    return impact;
  }

  /**
   * Analyze root cause
   */
  private analyzeRootCause(issue: any, detectorName: string): string {
    // Performance issues
    if (issue.message?.includes('Long function')) {
      return 'Function exceeds recommended length. This often happens when business logic grows without refactoring.';
    }
    if (issue.message?.includes('complexity')) {
      return 'High cyclomatic complexity indicates too many decision paths. This makes testing and maintenance difficult.';
    }
    if (issue.message?.includes('fetch call inside loop')) {
      return 'N+1 query problem: Making HTTP requests in a loop causes performance bottlenecks. Each iteration waits for network I/O.';
    }

    // Runtime issues
    if (issue.message?.includes('setInterval')) {
      return 'Timer not cleaned up. This causes memory leaks as the interval continues running even after component unmount.';
    }
    if (issue.message?.includes('addEventListener')) {
      return 'Event listener not removed. This causes memory leaks and potential duplicate event handling.';
    }

    // Complexity issues
    if (issue.message?.includes('Duplicate code')) {
      return 'Code duplication detected. This violates DRY principle and makes maintenance harder.';
    }

    // Network issues
    if (issue.message?.includes('without timeout')) {
      return 'Missing timeout configuration. Requests can hang indefinitely, degrading user experience.';
    }

    return 'Issue detected by static analysis.';
  }

  /**
   * Generate smart fix suggestions
   */
  private generateSmartFix(issue: any, detectorName: string): string {
    // Performance fixes
    if (issue.message?.includes('Long function')) {
      return '1. Extract logical blocks into separate functions\n2. Use Single Responsibility Principle\n3. Consider using composition over large functions';
    }
    if (issue.message?.includes('fetch call inside loop')) {
      return '1. Collect all IDs first: const ids = items.map(i => i.id)\n2. Make single batch request: await fetchBatch(ids)\n3. Or use Promise.all() for parallel requests';
    }

    // Runtime fixes
    if (issue.message?.includes('setInterval')) {
      return '1. Store interval ID: const id = setInterval(...)\n2. Clear on cleanup: return () => clearInterval(id)\n3. Or use useEffect cleanup in React';
    }
    if (issue.message?.includes('addEventListener')) {
      return '1. Store listener reference\n2. Add cleanup: element.removeEventListener(event, handler)\n3. Or use useEffect cleanup in React';
    }

    // Network fixes
    if (issue.message?.includes('without timeout')) {
      return '1. Add timeout: fetch(url, { signal: AbortSignal.timeout(5000) })\n2. Or use axios with timeout config\n3. Recommended timeout: 5-30 seconds';
    }
    if (issue.message?.includes('without error handling')) {
      return '1. Wrap in try-catch block\n2. Add .catch() handler\n3. Implement retry logic with exponential backoff';
    }

    // Complexity fixes
    if (issue.message?.includes('Duplicate code')) {
      return '1. Extract common code into shared function\n2. Use utility/helper modules\n3. Consider creating a reusable component';
    }

    return issue.suggestedFix || 'Review and refactor this code section.';
  }

  /**
   * Generate prevention tips
   */
  private generatePreventionTip(issue: any, detectorName: string): string {
    if (issue.message?.includes('Long function')) {
      return '💡 Keep functions under 50 lines. Use ESLint rule: max-lines-per-function';
    }
    if (issue.message?.includes('complexity')) {
      return '💡 Keep complexity under 10. Use ESLint rule: complexity: ["error", 10]';
    }
    if (issue.message?.includes('setInterval') || issue.message?.includes('addEventListener')) {
      return '💡 Use custom hooks or cleanup utilities. Consider libraries like use-interval';
    }
    if (issue.message?.includes('fetch')) {
      return '💡 Use a fetch wrapper utility that enforces timeouts and error handling by default';
    }
    if (issue.message?.includes('Duplicate code')) {
      return '💡 Enable ESLint plugin: eslint-plugin-no-identical-functions';
    }

    return '💡 Enable stricter linting rules to catch this earlier.';
  }

  /**
   * Analyze file context
   */
  private analyzeFileContext(issue: any): EnhancedIssue['fileContext'] | undefined {
    const filePath = issue.file || issue.filePath || '';
    
    const context: EnhancedIssue['fileContext'] = {};

    // Detect framework
    if (filePath.includes('app/') || filePath.includes('pages/')) {
      context.framework = 'Next.js';
    }
    if (filePath.includes('components/')) {
      context.framework = context.framework || 'React';
    }
    if (filePath.includes('middleware/')) {
      context.pattern = 'Middleware';
    }
    if (filePath.includes('/api/')) {
      context.pattern = 'API Route';
    }

    return Object.keys(context).length > 0 ? context : undefined;
  }

  /**
   * Filter low-confidence issues (reduce false positives)
   */
  filterByConfidence(issues: EnhancedIssue[], minConfidence: number = 60): EnhancedIssue[] {
    return issues.filter(issue => issue.confidence >= minConfidence);
  }

  /**
   * Sort by priority
   */
  sortByPriority(issues: EnhancedIssue[]): EnhancedIssue[] {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return issues.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }
}
