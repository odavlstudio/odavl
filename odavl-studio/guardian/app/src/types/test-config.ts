// Test Configuration Types for Guardian Testing Framework

export interface E2ETestConfig {
    name: string;
    url: string;
    steps: E2ETestStep[];
    options?: E2ETestOptions;
}

export interface E2ETestStep {
    type: 'goto' | 'click' | 'fill' | 'wait' | 'screenshot' | 'assert' | 'hover' | 'select' | 'keyboard' | 'scroll';
    selector?: string;
    value?: string | number;
    key?: string; // For keyboard actions
    timeout?: number;
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
    assertion?: {
        type: 'visible' | 'hidden' | 'text' | 'count' | 'attribute' | 'url';
        expected?: string | number;
        attribute?: string;
    };
    screenshot?: {
        fullPage?: boolean;
        path?: string;
    };
}

export interface E2ETestOptions {
    viewport?: {
        width: number;
        height: number;
    };
    timeout?: number; // Global timeout for the test
    video?: boolean; // Enable video recording
    slowMo?: number; // Slow down execution for debugging
    headless?: boolean;
    retries?: number;
    screenshotOnFailure?: boolean;
}

export interface E2ETestSuite {
    name: string;
    projectId: string;
    tests: E2ETestConfig[];
    globalOptions?: E2ETestOptions;
}

// Visual Regression Types
export interface VisualTestConfig {
    name: string;
    url: string;
    selectors?: string[]; // Specific elements to capture
    fullPage?: boolean;
    threshold?: number; // Pixel difference threshold (0-1)
    ignoreRegions?: {
        selector: string;
    }[];
}

export interface VisualDiffResult {
    testName: string;
    match: boolean;
    pixelDifference: number;
    diffPercentage: number;
    baselinePath: string;
    currentPath: string;
    diffPath?: string;
}

// Accessibility Types
export interface A11yTestConfig {
    name: string;
    url: string;
    rules?: {
        enabled?: string[];
        disabled?: string[];
    };
    wcagLevel?: 'A' | 'AA' | 'AAA';
}

export interface A11yViolation {
    id: string;
    impact: 'minor' | 'moderate' | 'serious' | 'critical';
    description: string;
    help: string;
    helpUrl: string;
    nodes: {
        html: string;
        target: string[];
        failureSummary: string;
    }[];
}

export interface A11yTestResult {
    testName: string;
    url: string;
    violations: A11yViolation[];
    passes: number;
    incomplete: number;
    wcagLevel: string;
    timestamp: Date;
}

// i18n Types
export interface I18nTestConfig {
    name: string;
    baseUrl: string;
    languages: string[]; // ['ar', 'en', 'de', 'es', 'fr', 'it', 'pt', 'zh', 'ja']
    pages: string[]; // Pages to test
    checks: {
        missingTranslations?: boolean;
        brokenLinks?: boolean;
        rtlLayout?: boolean; // For RTL languages like Arabic
        textOverflow?: boolean;
    };
}

export interface I18nTestResult {
    testName: string;
    language: string;
    url: string;
    issues: {
        type: 'missing_translation' | 'broken_link' | 'rtl_issue' | 'text_overflow';
        severity: 'low' | 'medium' | 'high';
        message: string;
        selector?: string;
    }[];
}

// Performance Types
export interface PerformanceTestConfig {
    name: string;
    url: string;
    device?: 'mobile' | 'desktop';
    throttling?: {
        cpu: number; // CPU slowdown multiplier
        network: 'fast3G' | 'slow3G' | '4G' | 'none';
    };
    budgets?: {
        fcp?: number; // First Contentful Paint (ms)
        lcp?: number; // Largest Contentful Paint (ms)
        tti?: number; // Time to Interactive (ms)
        cls?: number; // Cumulative Layout Shift
        tbt?: number; // Total Blocking Time (ms)
    };
}

export interface PerformanceTestResult {
    testName: string;
    url: string;
    device: string;
    metrics: {
        fcp: number;
        lcp: number;
        tti: number;
        cls: number;
        tbt: number;
        speedIndex: number;
    };
    scores: {
        performance: number; // 0-100
        accessibility: number;
        bestPractices: number;
        seo: number;
    };
    budgetViolations: {
        metric: string;
        actual: number;
        budget: number;
        exceeded: number;
    }[];
    timestamp: Date;
}

// Common Test Result Types
export interface TestResult {
    testId: string;
    testName: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number; // milliseconds
    error?: string;
    screenshots?: string[]; // Base64 or file paths
    video?: string; // Video recording path
    metadata?: Record<string, unknown>;
}

export interface TestSuiteResult {
    suiteId: string;
    suiteName: string;
    projectId: string;
    type: 'e2e' | 'visual' | 'a11y' | 'i18n' | 'performance';
    startedAt: Date;
    completedAt: Date;
    duration: number;
    results: TestResult[];
    summary: {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
    };
}
