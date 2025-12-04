/**
 * API Mocks for ODAVL Testing
 * Mock HTTP clients (axios, fetch) and external API responses
 */

import { vi } from 'vitest';

// ========================================
// HTTP Client Mocks
// ========================================

/**
 * Mock Axios instance
 * Use: mockAxios.get.mockResolvedValue({ data: {...} })
 */
export const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  request: vi.fn(),
  head: vi.fn(),
  options: vi.fn(),
};

/**
 * Mock Fetch API
 * Use: mockFetch.mockResolvedValue({ ok: true, json: async () => ({...}) })
 */
export const mockFetch = vi.fn();

/**
 * Mock Response helper
 */
export function createMockResponse(data: any, status = 200, ok = true): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: '',
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
  } as Response;
}

// ========================================
// External API Response Mocks
// ========================================

/**
 * Mock NVD (National Vulnerability Database) API Response
 */
export const mockNVDResponse = {
  resultsPerPage: 1,
  startIndex: 0,
  totalResults: 1,
  format: 'NVD_CVE',
  version: '2.0',
  timestamp: '2025-11-26T10:00:00.000',
  vulnerabilities: [
    {
      cve: {
        id: 'CVE-2024-12345',
        sourceIdentifier: 'security@example.com',
        published: '2024-11-01T10:00:00.000',
        lastModified: '2024-11-15T10:00:00.000',
        vulnStatus: 'Analyzed',
        descriptions: [
          {
            lang: 'en',
            value: 'Critical security vulnerability in package XYZ',
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
              },
              exploitabilityScore: 3.9,
              impactScore: 5.9,
            },
          ],
        },
        references: [
          {
            url: 'https://example.com/security-advisory',
            source: 'security@example.com',
          },
        ],
      },
    },
  ],
};

/**
 * Mock Lighthouse Performance Report
 */
export const mockLighthouseReport = {
  lighthouseVersion: '11.0.0',
  requestedUrl: 'http://localhost:3000',
  finalUrl: 'http://localhost:3000',
  fetchTime: '2025-11-26T10:00:00.000Z',
  categories: {
    performance: {
      id: 'performance',
      title: 'Performance',
      score: 0.95,
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
      score: 0.95,
      displayValue: '1.2 s',
      numericValue: 1200,
    },
    'largest-contentful-paint': {
      id: 'largest-contentful-paint',
      title: 'Largest Contentful Paint',
      score: 0.92,
      displayValue: '2.1 s',
      numericValue: 2100,
    },
    'cumulative-layout-shift': {
      id: 'cumulative-layout-shift',
      title: 'Cumulative Layout Shift',
      score: 0.98,
      displayValue: '0.05',
      numericValue: 0.05,
    },
  },
};

/**
 * Mock GitHub API Response
 */
export const mockGitHubResponse = {
  repository: {
    id: 123456789,
    name: 'odavl',
    full_name: 'user/odavl',
    private: false,
    owner: {
      login: 'user',
      id: 12345,
      avatar_url: 'https://avatars.githubusercontent.com/u/12345',
    },
    html_url: 'https://github.com/user/odavl',
    description: 'ODAVL Studio - Autonomous Code Quality Platform',
    fork: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2025-11-26T10:00:00Z',
    pushed_at: '2025-11-26T10:00:00Z',
    size: 50000,
    stargazers_count: 1234,
    watchers_count: 1234,
    language: 'TypeScript',
    forks_count: 56,
    open_issues_count: 12,
    default_branch: 'main',
  },
  commits: [
    {
      sha: 'abc123',
      commit: {
        author: {
          name: 'Developer',
          email: 'dev@example.com',
          date: '2025-11-26T10:00:00Z',
        },
        message: 'feat: Add revolutionary AI governance',
      },
    },
  ],
};

/**
 * Mock Playwright Browser Context
 */
export const mockPlaywrightPage = {
  goto: vi.fn().mockResolvedValue(null),
  screenshot: vi.fn().mockResolvedValue(Buffer.from('fake-screenshot')),
  content: vi.fn().mockResolvedValue('<html><body>Test</body></html>'),
  title: vi.fn().mockResolvedValue('Test Page'),
  url: vi.fn().mockReturnValue('http://localhost:3000'),
  evaluate: vi.fn(),
  waitForSelector: vi.fn().mockResolvedValue(null),
  click: vi.fn().mockResolvedValue(null),
  type: vi.fn().mockResolvedValue(null),
  close: vi.fn().mockResolvedValue(null),
};

// ========================================
// Helper Functions
// ========================================

/**
 * Reset all API mocks
 */
export function resetApiMocks(): void {
  mockAxios.get.mockReset();
  mockAxios.post.mockReset();
  mockAxios.put.mockReset();
  mockAxios.patch.mockReset();
  mockAxios.delete.mockReset();
  mockFetch.mockReset();
}

/**
 * Setup axios mock to return specific data
 */
export function mockAxiosGet(url: string, data: any): void {
  mockAxios.get.mockImplementation((requestUrl: string) => {
    if (requestUrl.includes(url)) {
      return Promise.resolve({ data, status: 200, statusText: 'OK' });
    }
    return Promise.reject(new Error('Not found'));
  });
}

/**
 * Setup axios mock to fail
 */
export function mockAxiosError(statusCode = 500, message = 'Internal Server Error'): void {
  const error = new Error(message) as any;
  error.response = {
    status: statusCode,
    statusText: message,
    data: { error: message },
  };
  mockAxios.get.mockRejectedValue(error);
  mockAxios.post.mockRejectedValue(error);
}

/**
 * Setup fetch mock to return specific data
 */
export function mockFetchSuccess(data: any, status = 200): void {
  mockFetch.mockResolvedValue(createMockResponse(data, status, true));
}

/**
 * Setup fetch mock to fail
 */
export function mockFetchError(status = 500, message = 'Internal Server Error'): void {
  mockFetch.mockResolvedValue(
    createMockResponse({ error: message }, status, false)
  );
}

// ========================================
// Example Usage in Tests
// ========================================

/**
 * Example test setup:
 * 
 * import { mockAxios, mockNVDResponse, resetApiMocks } from './api-mocks';
 * 
 * describe('CVE Scanner', () => {
 *   beforeEach(() => {
 *     resetApiMocks();
 *   });
 * 
 *   it('should fetch CVE data', async () => {
 *     mockAxios.get.mockResolvedValue({ data: mockNVDResponse });
 *     const result = await fetchCVEData('CVE-2024-12345');
 *     expect(result).toBeDefined();
 *   });
 * });
 */
