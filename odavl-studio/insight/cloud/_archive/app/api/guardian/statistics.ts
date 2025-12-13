/**
 * Guardian Statistics Calculator
 */

interface GuardianTest {
  passed: boolean;
  overallScore: number;
  accessibilityScore: number | null;
  performanceScore: number | null;
  securityScore: number | null;
  accessibilityViolations: number;
  securityIssues: number;
}

export interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  avgOverallScore: number;
  avgAccessibility: number;
  avgPerformance: number;
  avgSecurity: number;
  totalViolations: number;
}

export function calculateTestSummary(tests: GuardianTest[]): TestSummary {
  if (tests.length === 0) {
    return {
      totalTests: 0,
      passed: 0,
      failed: 0,
      avgOverallScore: 0,
      avgAccessibility: 0,
      avgPerformance: 0,
      avgSecurity: 0,
      totalViolations: 0
    };
  }

  const summary = tests.reduce(
    (acc, test) => {
      acc.passed += test.passed ? 1 : 0;
      acc.overallScore += test.overallScore;
      acc.accessibility += test.accessibilityScore || 0;
      acc.performance += test.performanceScore || 0;
      acc.security += test.securityScore || 0;
      acc.violations += (test.accessibilityViolations || 0) + (test.securityIssues || 0);
      return acc;
    },
    { passed: 0, overallScore: 0, accessibility: 0, performance: 0, security: 0, violations: 0 }
  );

  return {
    totalTests: tests.length,
    passed: summary.passed,
    failed: tests.length - summary.passed,
    avgOverallScore: summary.overallScore / tests.length,
    avgAccessibility: summary.accessibility / tests.length,
    avgPerformance: summary.performance / tests.length,
    avgSecurity: summary.security / tests.length,
    totalViolations: summary.violations
  };
}
