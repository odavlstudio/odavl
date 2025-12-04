/**
 * External Service Mocks for ODAVL Testing
 * Mock external APIs and services (NVD, Lighthouse, Playwright, etc.)
 */

import { vi } from 'vitest';

// ========================================
// External Service Mocks
// ========================================

/**
 * Mock NVD (National Vulnerability Database) API Client
 */
export const mockNVDClient = {
  searchCVE: vi.fn(),
  getCVEById: vi.fn(),
  getCPEMatches: vi.fn(),
};

/**
 * Mock Lighthouse Client
 */
export const mockLighthouse = vi.fn();

/**
 * Mock Playwright Browser
 */
export const mockPlaywright = {
  chromium: {
    launch: vi.fn(),
    connect: vi.fn(),
  },
  firefox: {
    launch: vi.fn(),
    connect: vi.fn(),
  },
  webkit: {
    launch: vi.fn(),
    connect: vi.fn(),
  },
};

/**
 * Mock Axe Accessibility Testing
 */
export const mockAxeBuilder = vi.fn();

/**
 * Mock Sentry Client
 */
export const mockSentry = {
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
};

/**
 * Mock Email Service (SendGrid, etc.)
 */
export const mockEmailService = {
  send: vi.fn(),
  sendMultiple: vi.fn(),
  sendTemplate: vi.fn(),
};

/**
 * Mock Analytics Service
 */
export const mockAnalytics = {
  track: vi.fn(),
  identify: vi.fn(),
  page: vi.fn(),
  group: vi.fn(),
};

// ========================================
// Mock Response Data
// ========================================

/**
 * Mock CVE (Common Vulnerabilities and Exposures) data
 */
export const mockCVEData = {
  id: 'CVE-2024-12345',
  sourceIdentifier: 'security@example.com',
  published: '2024-11-01T10:00:00.000',
  lastModified: '2024-11-15T10:00:00.000',
  vulnStatus: 'Analyzed',
  descriptions: [
    {
      lang: 'en',
      value: 'Critical security vulnerability allowing remote code execution',
    },
  ],
  metrics: {
    cvssMetricV31: [
      {
        source: 'nvd@nist.gov',
        type: 'Primary',
        cvssData: {
          version: '3.1',
          vectorString: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
          baseScore: 9.8,
          baseSeverity: 'CRITICAL',
          attackVector: 'NETWORK',
          attackComplexity: 'LOW',
          privilegesRequired: 'NONE',
          userInteraction: 'NONE',
          scope: 'UNCHANGED',
          confidentialityImpact: 'HIGH',
          integrityImpact: 'HIGH',
          availabilityImpact: 'HIGH',
        },
        exploitabilityScore: 3.9,
        impactScore: 5.9,
      },
    ],
  },
  weaknesses: [
    {
      source: 'nvd@nist.gov',
      type: 'Primary',
      description: [
        {
          lang: 'en',
          value: 'CWE-79', // Cross-site Scripting
        },
      ],
    },
  ],
  references: [
    {
      url: 'https://example.com/security-advisory',
      source: 'security@example.com',
      tags: ['Vendor Advisory'],
    },
  ],
};

/**
 * Mock Lighthouse full report
 */
export const mockLighthouseFullReport = {
  lighthouseVersion: '11.0.0',
  requestedUrl: 'http://localhost:3000',
  finalUrl: 'http://localhost:3000',
  fetchTime: '2025-11-26T10:00:00.000Z',
  userAgent: 'Mozilla/5.0 (Lighthouse)',
  categories: {
    performance: {
      id: 'performance',
      title: 'Performance',
      score: 0.95,
      auditRefs: [
        { id: 'first-contentful-paint', weight: 10 },
        { id: 'largest-contentful-paint', weight: 25 },
        { id: 'cumulative-layout-shift', weight: 15 },
      ],
    },
    accessibility: {
      id: 'accessibility',
      title: 'Accessibility',
      score: 0.92,
    },
    'best-practices': {
      id: 'best-practices',
      title: 'Best Practices',
      score: 0.88,
    },
    seo: {
      id: 'seo',
      title: 'SEO',
      score: 0.90,
    },
  },
  audits: {
    'first-contentful-paint': {
      id: 'first-contentful-paint',
      title: 'First Contentful Paint',
      description: 'Marks the time at which the first text or image is painted.',
      score: 0.95,
      scoreDisplayMode: 'numeric',
      displayValue: '1.2 s',
      numericValue: 1200,
      numericUnit: 'millisecond',
    },
    'largest-contentful-paint': {
      id: 'largest-contentful-paint',
      title: 'Largest Contentful Paint',
      description: 'Marks the time at which the largest text or image is painted.',
      score: 0.92,
      displayValue: '2.1 s',
      numericValue: 2100,
    },
    'cumulative-layout-shift': {
      id: 'cumulative-layout-shift',
      title: 'Cumulative Layout Shift',
      description: 'Measures visual stability.',
      score: 0.98,
      displayValue: '0.05',
      numericValue: 0.05,
    },
    'speed-index': {
      id: 'speed-index',
      title: 'Speed Index',
      score: 0.94,
      displayValue: '2.5 s',
      numericValue: 2500,
    },
  },
  timing: {
    total: 15000,
  },
};

/**
 * Mock Axe accessibility results
 */
export const mockAxeResults = {
  toolOptions: {},
  testEngine: { name: 'axe-core', version: '4.8.0' },
  testRunner: { name: 'axe' },
  testEnvironment: {},
  url: 'http://localhost:3000',
  timestamp: '2025-11-26T10:00:00.000Z',
  passes: [],
  violations: [
    {
      id: 'color-contrast',
      impact: 'serious',
      tags: ['wcag2aa', 'wcag143'],
      description: 'Ensures the contrast between foreground and background colors meets WCAG 2 AA',
      help: 'Elements must have sufficient color contrast',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/color-contrast',
      nodes: [
        {
          any: [],
          all: [],
          none: [],
          impact: 'serious',
          html: '<button class="low-contrast">Click me</button>',
          target: ['button.low-contrast'],
          failureSummary: 'Fix the following: Element has insufficient color contrast',
        },
      ],
    },
    {
      id: 'image-alt',
      impact: 'critical',
      tags: ['wcag2a', 'wcag111'],
      description: 'Ensures <img> elements have alternate text',
      help: 'Images must have alternate text',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/image-alt',
      nodes: [
        {
          any: [],
          all: [],
          none: [],
          impact: 'critical',
          html: '<img src="logo.png">',
          target: ['img[src="logo.png"]'],
          failureSummary: 'Fix the following: Element does not have an alt attribute',
        },
      ],
    },
  ],
  incomplete: [],
  inapplicable: [],
};

// ========================================
// Setup Helpers
// ========================================

/**
 * Reset all external service mocks
 */
export function resetExternalMocks(): void {
  mockNVDClient.searchCVE.mockReset();
  mockNVDClient.getCVEById.mockReset();
  mockLighthouse.mockReset();
  mockPlaywright.chromium.launch.mockReset();
  mockAxeBuilder.mockReset();
  mockSentry.captureException.mockReset();
  mockEmailService.send.mockReset();
  mockAnalytics.track.mockReset();
}

/**
 * Setup NVD API mock
 */
export function mockNVDApi(cveData = mockCVEData): void {
  mockNVDClient.searchCVE.mockResolvedValue({
    resultsPerPage: 1,
    totalResults: 1,
    vulnerabilities: [{ cve: cveData }],
  });
  mockNVDClient.getCVEById.mockResolvedValue({ cve: cveData });
}

/**
 * Setup Lighthouse mock
 */
export function mockLighthouseTest(report = mockLighthouseFullReport): void {
  mockLighthouse.mockResolvedValue({ lhr: report });
}

/**
 * Setup Playwright browser mock
 */
export function mockPlaywrightBrowser(): void {
  const mockBrowser = {
    newPage: vi.fn().mockResolvedValue({
      goto: vi.fn(),
      screenshot: vi.fn().mockResolvedValue(Buffer.from('fake-screenshot')),
      content: vi.fn().mockResolvedValue('<html><body>Test</body></html>'),
      title: vi.fn().mockResolvedValue('Test Page'),
      url: vi.fn().mockReturnValue('http://localhost:3000'),
      close: vi.fn(),
    }),
    close: vi.fn(),
  };

  mockPlaywright.chromium.launch.mockResolvedValue(mockBrowser);
}

/**
 * Setup Axe accessibility testing mock
 */
export function mockAxeTest(results = mockAxeResults): void {
  const mockAxe = {
    analyze: vi.fn().mockResolvedValue(results),
    include: vi.fn().mockReturnThis(),
    exclude: vi.fn().mockReturnThis(),
    withTags: vi.fn().mockReturnThis(),
  };
  mockAxeBuilder.mockReturnValue(mockAxe);
}

/**
 * Setup Sentry error tracking mock
 */
export function mockSentryTracking(): void {
  mockSentry.init.mockReturnValue(undefined);
  mockSentry.captureException.mockReturnValue('event-id-123');
  mockSentry.captureMessage.mockReturnValue('event-id-456');
}

/**
 * Setup email service mock
 */
export function mockEmailSending(): void {
  mockEmailService.send.mockResolvedValue({
    messageId: 'msg-123',
    accepted: ['user@example.com'],
    rejected: [],
  });
}

/**
 * Setup analytics tracking mock
 */
export function mockAnalyticsTracking(): void {
  mockAnalytics.track.mockReturnValue(undefined);
  mockAnalytics.identify.mockReturnValue(undefined);
  mockAnalytics.page.mockReturnValue(undefined);
}

/**
 * Mock NVD API error
 */
export function mockNVDApiError(statusCode = 500): void {
  const error = new Error('NVD API request failed') as any;
  error.response = { status: statusCode };
  mockNVDClient.searchCVE.mockRejectedValue(error);
}

/**
 * Mock Lighthouse failure
 */
export function mockLighthouseFailure(): void {
  mockLighthouse.mockRejectedValue(new Error('Lighthouse test failed'));
}

// ========================================
// Example Usage in Tests
// ========================================

/**
 * Example test setup:
 * 
 * import { mockNVDClient, mockNVDApi, resetExternalMocks } from './external-mocks';
 * 
 * describe('CVE Scanner', () => {
 *   beforeEach(() => {
 *     resetExternalMocks();
 *   });
 * 
 *   it('should fetch CVE data from NVD', async () => {
 *     mockNVDApi();
 *     const result = await cveScanner.scan('CVE-2024-12345');
 *     expect(result.severity).toBe('CRITICAL');
 *   });
 * 
 *   it('should handle NVD API errors', async () => {
 *     mockNVDApiError(503);
 *     await expect(cveScanner.scan('CVE-2024-12345')).rejects.toThrow();
 *   });
 * });
 */
