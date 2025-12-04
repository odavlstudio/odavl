/**
 * Mock Detectors for Integration Testing
 * 
 * Provides predictable detector results for testing scenarios
 */

// Use local DetectionResult interface instead of @odavl/types
interface DetectionResult {
    file: string;
    line: number;
    column: number;
    message: string;
    severity: 'critical' | 'error' | 'warning' | 'info';
    rule: string;
    confidence: number;
}

export class MockTSDetector {
    async detect(_targetDir: string): Promise<DetectionResult[]> {
        // Return predictable TypeScript errors
        return [
            {
                file: 'src/index.ts',
                line: 7,
                column: 25,
                message: "Parameter 'a' implicitly has an 'any' type.",
                severity: 'error',
                rule: 'implicit-any',
                confidence: 1
            },
            {
                file: 'src/index.ts',
                line: 7,
                column: 28,
                message: "Parameter 'b' implicitly has an 'any' type.",
                severity: 'error',
                rule: 'implicit-any',
                confidence: 1
            }
        ];
    }
}

export class MockESLintDetector {
    async detect(_targetDir: string): Promise<DetectionResult[]> {
        // Return predictable ESLint warnings
        return [
            {
                file: 'src/index.ts',
                line: 4,
                column: 1,
                message: "'unusedImport' is defined but never used.",
                severity: 'error',
                rule: 'no-unused-vars',
                confidence: 1
            },
            {
                file: 'src/index.ts',
                line: 12,
                column: 1,
                message: 'Unexpected console statement.',
                severity: 'warning',
                rule: 'no-console',
                confidence: 0.9
            }
        ];
    }
}

export class MockSecurityDetector {
    async detect(_targetDir: string): Promise<DetectionResult[]> {
        // Return predictable security issues
        return [
            {
                file: 'src/index.ts',
                line: 15,
                column: 13,
                message: 'Hardcoded API key detected',
                severity: 'critical',
                rule: 'hardcoded-secrets',
                confidence: 1
            }
        ];
    }
}

export class MockPerformanceDetector {
    async detect(_targetDir: string): Promise<DetectionResult[]> {
        // Return predictable performance issues
        return [
            {
                file: 'src/index.ts',
                line: 18,
                column: 1,
                message: 'Nested loop detected - O(n²) complexity',
                severity: 'warning',
                rule: 'nested-loops',
                confidence: 0.9
            }
        ];
    }
}

export class MockComplexityDetector {
    async detect(_targetDir: string): Promise<DetectionResult[]> {
        // Return predictable complexity issues
        return [
            {
                file: 'src/utils.ts',
                line: 11,
                column: 1,
                message: 'Function has cyclomatic complexity of 18 (threshold: 15)',
                severity: 'warning',
                rule: 'complexity',
                confidence: 1
            }
        ];
    }
}

// Factory function to get all mock detectors
export function getMockDetectors() {
    return {
        typescript: new MockTSDetector(),
        eslint: new MockESLintDetector(),
        security: new MockSecurityDetector(),
        performance: new MockPerformanceDetector(),
        complexity: new MockComplexityDetector()
    };
}

// Helper to create metrics from mock detector results
export async function getMockMetrics(targetDir: string) {
    const detectors = getMockDetectors();

    const [tsIssues, eslintIssues, securityIssues, perfIssues, complexityIssues] = await Promise.all([
        detectors.typescript.detect(targetDir),
        detectors.eslint.detect(targetDir),
        detectors.security.detect(targetDir),
        detectors.performance.detect(targetDir),
        detectors.complexity.detect(targetDir)
    ]);

    return {
        typescript: tsIssues.length,
        eslint: eslintIssues.length,
        security: securityIssues.length,
        performance: perfIssues.length,
        imports: 0,
        packages: 0,
        runtime: 0,
        build: 0,
        circular: 0,
        network: 0,
        complexity: complexityIssues.length,
        isolation: 0,
        totalIssues: tsIssues.length + eslintIssues.length + securityIssues.length + perfIssues.length + complexityIssues.length
    };
}
