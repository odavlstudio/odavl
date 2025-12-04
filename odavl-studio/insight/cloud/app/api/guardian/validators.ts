/**
 * Guardian API Validators
 */

export interface GuardianTestBody {
  url: string;
  duration?: number;
  overallScore: number;
  passed?: boolean;
  tests?: {
    accessibility?: {
      score?: number;
      violations?: any[];
      passes?: number;
    };
    performance?: {
      scores?: {
        performance?: number;
        accessibility?: number;
        bestPractices?: number;
        seo?: number;
      };
      metrics?: {
        firstContentfulPaint?: number;
        largestContentfulPaint?: number;
        totalBlockingTime?: number;
        cumulativeLayoutShift?: number;
        speedIndex?: number;
      };
    };
    security?: {
      score?: number;
      vulnerabilities?: any[];
    };
  };
}

export function validateGuardianTestBody(body: any): { valid: boolean; error?: string } {
  if (!body.url || typeof body.url !== 'string') {
    return { valid: false, error: 'Missing or invalid field: url (string required)' };
  }
  
  if (typeof body.overallScore !== 'number') {
    return { valid: false, error: 'Missing or invalid field: overallScore (number required)' };
  }
  
  return { valid: true };
}

export function extractTestData(body: GuardianTestBody) {
  const accessibility = body.tests?.accessibility || {};
  const performance = body.tests?.performance || {};
  const security = body.tests?.security || {};
  
  return {
    url: body.url,
    duration: body.duration || 0,
    overallScore: body.overallScore,
    passed: body.passed || false,
    
    // Accessibility
    accessibilityScore: accessibility.score,
    accessibilityViolations: accessibility.violations?.length || 0,
    accessibilityPasses: accessibility.passes,
    
    // Performance - Scores
    performanceScore: performance.scores?.performance,
    performanceAccessibility: performance.scores?.accessibility,
    performanceBestPractices: performance.scores?.bestPractices,
    performanceSeo: performance.scores?.seo,
    
    // Performance - Metrics
    performanceFcp: performance.metrics?.firstContentfulPaint,
    performanceLcp: performance.metrics?.largestContentfulPaint,
    performanceTbt: performance.metrics?.totalBlockingTime,
    performanceCls: performance.metrics?.cumulativeLayoutShift,
    performanceSi: performance.metrics?.speedIndex,
    
    // Security
    securityScore: security.score,
    securityIssues: security.vulnerabilities?.length || 0,
  };
}
