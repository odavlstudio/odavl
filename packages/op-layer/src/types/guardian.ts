/**
 * Guardian Protocol Types
 * Types for website auditing, testing, and quality gate enforcement
 */

/**
 * Type of Guardian audit to perform
 */
export type GuardianAuditKind =
  | 'quick' // Fast smoke test (accessibility + performance basics)
  | 'full' // Complete audit (all checks)
  | 'accessibility' // WCAG compliance only
  | 'performance' // Core Web Vitals + Lighthouse
  | 'security' // Security headers, SSL/TLS, OWASP
  | 'seo' // Meta tags, structured data, sitemap
  | 'visual' // Screenshot comparison, visual regression
  | 'e2e'; // End-to-end user flows

/**
 * Severity level for Guardian issues
 */
export type GuardianSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Category of Guardian issue
 */
export type GuardianCategory =
  | 'accessibility'
  | 'performance'
  | 'security'
  | 'seo'
  | 'visual'
  | 'functionality'
  | 'ux'
  | 'compatibility';

/**
 * Request for Guardian audit
 */
export interface GuardianAuditRequest {
  /** Target URL to audit (e.g., https://example.com) */
  url: string;

  /** Kind of audit to perform */
  kind: GuardianAuditKind;

  /** Environment identifier (staging, production, etc.) */
  environment?: string;

  /** Browser/device configurations */
  browsers?: Array<'chromium' | 'firefox' | 'webkit'>;
  devices?: Array<'desktop' | 'mobile' | 'tablet'>;

  /** Viewport dimensions (default: 1920x1080 for desktop, 375x667 for mobile) */
  viewport?: { width: number; height: number };

  /** Accessibility standards to check (default: WCAG 2.1 AA) */
  wcagLevel?: 'A' | 'AA' | 'AAA';

  /** Performance thresholds */
  thresholds?: {
    fcp?: number; // First Contentful Paint (ms)
    lcp?: number; // Largest Contentful Paint (ms)
    cls?: number; // Cumulative Layout Shift (score)
    fid?: number; // First Input Delay (ms)
    tti?: number; // Time to Interactive (ms)
    tbt?: number; // Total Blocking Time (ms)
  };

  /** Authentication credentials if needed */
  auth?: {
    username: string;
    password: string;
  };

  /** Custom headers to send */
  headers?: Record<string, string>;

  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Individual issue found during audit
 */
export interface GuardianIssue {
  /** Unique issue identifier */
  id: string;

  /** Issue category */
  category: GuardianCategory;

  /** Severity level */
  severity: GuardianSeverity;

  /** Human-readable message */
  message: string;

  /** Detailed description */
  description?: string;

  /** Location information */
  location?: {
    /** Page URL where issue was found */
    url: string;

    /** CSS selector if applicable */
    selector?: string;

    /** Screenshot path if available */
    screenshot?: string;
  };

  /** WCAG criterion if accessibility issue (e.g., "1.4.3") */
  wcagCriterion?: string;

  /** Performance metric if applicable */
  metric?: {
    name: string;
    value: number;
    unit: string;
    threshold?: number;
  };

  /** Suggested fix */
  suggestedFix?: string;

  /** Impact assessment */
  impact?: 'critical' | 'serious' | 'moderate' | 'minor';

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Results from Guardian audit
 */
export interface GuardianAuditResult {
  /** All issues found */
  issues: GuardianIssue[];

  /** Overall quality scores */
  scores: {
    /** Overall score (0-100) */
    overall: number;

    /** Accessibility score (0-100) */
    accessibility?: number;

    /** Performance score (0-100, Lighthouse-style) */
    performance?: number;

    /** SEO score (0-100) */
    seo?: number;

    /** Security score (0-100) */
    security?: number;

    /** Best practices score (0-100) */
    bestPractices?: number;
  };

  /** Core Web Vitals */
  webVitals?: {
    fcp: number; // First Contentful Paint (ms)
    lcp: number; // Largest Contentful Paint (ms)
    cls: number; // Cumulative Layout Shift (score)
    fid: number; // First Input Delay (ms)
    tti: number; // Time to Interactive (ms)
    tbt: number; // Total Blocking Time (ms)
  };

  /** WCAG compliance status */
  wcagCompliance?: {
    level: 'A' | 'AA' | 'AAA';
    passed: boolean;
    violations: number;
    warnings: number;
  };

  /** Screenshots captured */
  screenshots?: Array<{
    name: string;
    path: string;
    device: string;
  }>;

  /** Audit metadata */
  metadata: {
    /** Audit request that generated this result */
    request: GuardianAuditRequest;

    /** Duration in milliseconds */
    tookMs: number;

    /** Timestamp */
    timestamp: string;

    /** Browser/device used */
    browser: string;
    device: string;

    /** User agent */
    userAgent?: string;
  };

  /** Quality gate status */
  qualityGate?: {
    passed: boolean;
    failedChecks: string[];
    criticalIssues: number;
    highIssues: number;
  };
}

/**
 * Statistics for Guardian audit run
 */
export interface GuardianAuditStats {
  /** Total issues by severity */
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };

  /** Total issues by category */
  byCategory: {
    accessibility: number;
    performance: number;
    security: number;
    seo: number;
    visual: number;
    functionality: number;
    ux: number;
    compatibility: number;
  };

  /** Total audits run */
  totalAudits: number;

  /** Average scores */
  averageScores: {
    overall: number;
    accessibility: number;
    performance: number;
    seo: number;
    security: number;
  };
}
