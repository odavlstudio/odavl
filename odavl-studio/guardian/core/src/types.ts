/**
 * Guardian Core Types
 */

export interface AccessibilityResult {
  url: string;
  timestamp: string;
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  score: number; // 0-100
}

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: number;
}

export interface PerformanceResult {
  url: string;
  timestamp: string;
  scores: {
    performance: number; // 0-100
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  metrics: {
    firstContentfulPaint: number; // ms
    largestContentfulPaint: number;
    totalBlockingTime: number;
    cumulativeLayoutShift: number;
    speedIndex: number;
  };
}

export interface SecurityResult {
  url: string;
  timestamp: string;
  vulnerabilities: SecurityVulnerability[];
  score: number; // 0-100
  recommendations: string[];
}

export interface SecurityVulnerability {
  type: 'XSS' | 'CSRF' | 'SQLi' | 'Misconfiguration' | 'SensitiveData' | 'BrokenAuth';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence?: string;
  fix: string;
}

export interface TestSuite {
  accessibility?: AccessibilityResult;
  performance?: PerformanceResult;
  security?: SecurityResult;
}

export interface GuardianReport {
  url: string;
  timestamp: string;
  duration: number; // ms
  tests: TestSuite;
  overallScore: number; // 0-100 (weighted average)
  passed: boolean; // All critical issues resolved
}
