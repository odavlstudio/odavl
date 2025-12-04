/**
 * Detector Mocks for ODAVL Testing
 * Mock ODAVL Insight detector responses and behaviors
 */

import { vi } from 'vitest';

// Temporary local type until we align with @odavl/types
export interface DetectorIssue {
  id: string;
  detector: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file?: string;
  filePath?: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  code?: string;
  category?: string;
  fixable?: boolean;
  suggestions?: string[];
  metrics?: Record<string, any>;
}

// ========================================
// Detector Mock Base
// ========================================

/**
 * Base detector interface mock
 */
export const createMockDetector = (name: string) => ({
  name,
  analyze: vi.fn(),
  fix: vi.fn(),
  getMetadata: vi.fn().mockReturnValue({
    name,
    version: '1.0.0',
    description: `Mock ${name} detector`,
  }),
});

// ========================================
// Individual Detector Mocks
// ========================================

/**
 * Mock TypeScript Detector
 */
export const mockTypeScriptDetector = createMockDetector('typescript');

/**
 * Mock ESLint Detector
 */
export const mockESLintDetector = createMockDetector('eslint');

/**
 * Mock Import Detector
 */
export const mockImportDetector = createMockDetector('import');

/**
 * Mock Package Detector
 */
export const mockPackageDetector = createMockDetector('package');

/**
 * Mock Runtime Detector
 */
export const mockRuntimeDetector = createMockDetector('runtime');

/**
 * Mock Build Detector
 */
export const mockBuildDetector = createMockDetector('build');

/**
 * Mock Security Detector
 */
export const mockSecurityDetector = createMockDetector('security');

/**
 * Mock Circular Dependency Detector
 */
export const mockCircularDetector = createMockDetector('circular');

/**
 * Mock Network Detector
 */
export const mockNetworkDetector = createMockDetector('network');

/**
 * Mock Performance Detector
 */
export const mockPerformanceDetector = createMockDetector('performance');

/**
 * Mock Complexity Detector
 */
export const mockComplexityDetector = createMockDetector('complexity');

/**
 * Mock Isolation Detector
 */
export const mockIsolationDetector = createMockDetector('isolation');

// ========================================
// Mock Detector Issues
// ========================================

/**
 * Create mock detector issue
 */
export function createMockIssue(overrides: Partial<DetectorIssue> = {}): DetectorIssue {
  return {
    id: `issue-${Math.random().toString(36).substring(7)}`,
    detector: 'typescript',
    severity: 'high',
    message: 'Type error detected',
    file: '/project/src/index.ts',
    line: 10,
    column: 5,
    endLine: 10,
    endColumn: 20,
    code: 'TS2304',
    category: 'type-error',
    fixable: true,
    suggestions: [],
    ...overrides,
  };
}

/**
 * Mock TypeScript issues
 */
export const mockTypeScriptIssues: DetectorIssue[] = [
  createMockIssue({
    detector: 'typescript',
    severity: 'critical',
    message: "Cannot find name 'unknownVar'",
    code: 'TS2304',
    category: 'type-error',
    fixable: false,
  }),
  createMockIssue({
    detector: 'typescript',
    severity: 'high',
    message: "Property 'x' does not exist on type 'Object'",
    code: 'TS2339',
    category: 'type-error',
    fixable: true,
    suggestions: ['Add property to interface', 'Use type assertion'],
  }),
  createMockIssue({
    detector: 'typescript',
    severity: 'medium',
    message: 'Parameter implicitly has an "any" type',
    code: 'TS7006',
    category: 'implicit-any',
    fixable: true,
  }),
];

/**
 * Mock ESLint issues
 */
export const mockESLintIssues: DetectorIssue[] = [
  createMockIssue({
    detector: 'eslint',
    severity: 'high',
    message: 'Unexpected console statement',
    code: 'no-console',
    category: 'best-practices',
    fixable: false,
  }),
  createMockIssue({
    detector: 'eslint',
    severity: 'medium',
    message: "'unusedVar' is defined but never used",
    code: 'no-unused-vars',
    category: 'unused-code',
    fixable: true,
  }),
  createMockIssue({
    detector: 'eslint',
    severity: 'low',
    message: 'Missing trailing comma',
    code: 'comma-dangle',
    category: 'style',
    fixable: true,
  }),
];

/**
 * Mock Security issues
 */
export const mockSecurityIssues: DetectorIssue[] = [
  createMockIssue({
    detector: 'security',
    severity: 'critical',
    message: 'Hardcoded API key detected',
    code: 'SEC001',
    category: 'secrets',
    fixable: false,
    file: '/project/src/config.ts',
    line: 5,
  }),
  createMockIssue({
    detector: 'security',
    severity: 'high',
    message: 'SQL injection vulnerability',
    code: 'SEC002',
    category: 'injection',
    fixable: true,
    suggestions: ['Use parameterized queries', 'Use ORM'],
  }),
  createMockIssue({
    detector: 'security',
    severity: 'medium',
    message: 'eval() usage detected',
    code: 'SEC003',
    category: 'dangerous-function',
    fixable: false,
  }),
];

/**
 * Mock Circular Dependency issues
 */
export const mockCircularIssues: DetectorIssue[] = [
  createMockIssue({
    detector: 'circular',
    severity: 'high',
    message: 'Circular dependency detected: A -> B -> A',
    code: 'CIRCULAR001',
    category: 'circular-dependency',
    fixable: true,
    file: '/project/src/utils/helper.ts',
  }),
];

/**
 * Mock Performance issues
 */
export const mockPerformanceIssues: DetectorIssue[] = [
  createMockIssue({
    detector: 'performance',
    severity: 'medium',
    message: 'Expensive operation in render loop',
    code: 'PERF001',
    category: 'performance',
    fixable: true,
    suggestions: ['Move to useEffect', 'Memoize result'],
  }),
];

// ========================================
// Setup Helpers
// ========================================

/**
 * Reset all detector mocks
 */
export function resetDetectorMocks(): void {
  [
    mockTypeScriptDetector,
    mockESLintDetector,
    mockImportDetector,
    mockPackageDetector,
    mockRuntimeDetector,
    mockBuildDetector,
    mockSecurityDetector,
    mockCircularDetector,
    mockNetworkDetector,
    mockPerformanceDetector,
    mockComplexityDetector,
    mockIsolationDetector,
  ].forEach((detector) => {
    detector.analyze.mockReset();
    detector.fix.mockReset();
  });
}

/**
 * Setup detector to return specific issues
 */
export function mockDetectorAnalysis(
  detector: ReturnType<typeof createMockDetector>,
  issues: DetectorIssue[] = []
): void {
  detector.analyze.mockResolvedValue({
    issues,
    stats: {
      totalIssues: issues.length,
      critical: issues.filter((i) => i.severity === 'critical').length,
      high: issues.filter((i) => i.severity === 'high').length,
      medium: issues.filter((i) => i.severity === 'medium').length,
      low: issues.filter((i) => i.severity === 'low').length,
      fixable: issues.filter((i) => i.fixable).length,
    },
    duration: 1500,
  });
}

/**
 * Setup detector to fail
 */
export function mockDetectorFailure(
  detector: ReturnType<typeof createMockDetector>,
  error: string = 'Detector failed'
): void {
  detector.analyze.mockRejectedValue(new Error(error));
}

/**
 * Setup successful fix
 */
export function mockDetectorFix(
  detector: ReturnType<typeof createMockDetector>,
  fixedCount = 5
): void {
  detector.fix.mockResolvedValue({
    fixed: fixedCount,
    failed: 0,
    changes: [`Fixed ${fixedCount} issues`],
  });
}

/**
 * Setup all detectors with standard responses
 */
export function setupStandardDetectorMocks(): void {
  mockDetectorAnalysis(mockTypeScriptDetector, mockTypeScriptIssues);
  mockDetectorAnalysis(mockESLintDetector, mockESLintIssues);
  mockDetectorAnalysis(mockSecurityDetector, mockSecurityIssues);
  mockDetectorAnalysis(mockCircularDetector, mockCircularIssues);
  mockDetectorAnalysis(mockPerformanceDetector, mockPerformanceIssues);
  mockDetectorAnalysis(mockImportDetector, []);
  mockDetectorAnalysis(mockPackageDetector, []);
  mockDetectorAnalysis(mockRuntimeDetector, []);
  mockDetectorAnalysis(mockBuildDetector, []);
  mockDetectorAnalysis(mockNetworkDetector, []);
  mockDetectorAnalysis(mockComplexityDetector, []);
  mockDetectorAnalysis(mockIsolationDetector, []);
}

/**
 * Get all detector mocks
 */
export function getAllDetectorMocks() {
  return [
    mockTypeScriptDetector,
    mockESLintDetector,
    mockImportDetector,
    mockPackageDetector,
    mockRuntimeDetector,
    mockBuildDetector,
    mockSecurityDetector,
    mockCircularDetector,
    mockNetworkDetector,
    mockPerformanceDetector,
    mockComplexityDetector,
    mockIsolationDetector,
  ];
}

// ========================================
// Example Usage in Tests
// ========================================

/**
 * Example test setup:
 * 
 * import { 
 *   mockTypeScriptDetector, 
 *   mockDetectorAnalysis, 
 *   mockTypeScriptIssues,
 *   resetDetectorMocks 
 * } from './detector-mocks';
 * 
 * describe('Insight Analysis', () => {
 *   beforeEach(() => {
 *     resetDetectorMocks();
 *   });
 * 
 *   it('should analyze TypeScript files', async () => {
 *     mockDetectorAnalysis(mockTypeScriptDetector, mockTypeScriptIssues);
 *     
 *     const result = await insightService.analyze(['typescript']);
 *     
 *     expect(result.issues).toHaveLength(3);
 *     expect(result.stats.critical).toBe(1);
 *   });
 * });
 */
