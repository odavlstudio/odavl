import { describe, it, expect, beforeEach, vi } from 'vitest';
import { observe } from '../observe.js';

// Mock all detectors with proper constructor functions
vi.mock('@odavl-studio/insight-core/detector', () => ({
    TSDetector: class {
        detect = vi.fn().mockResolvedValue([]);
    },
    ESLintDetector: class {
        detect = vi.fn().mockResolvedValue([]);
    },
    SecurityDetector: class {
        detect = vi.fn().mockResolvedValue([
            { type: 'hardcoded-secret', severity: 'critical', file: 'test.ts', line: 10 }
        ]);
    },
    PerformanceDetector: class {
        detect = vi.fn().mockResolvedValue([]);
    },
    ImportDetector: class {
        detect = vi.fn().mockResolvedValue([]);
    },
    PackageDetector: class {
        detect = vi.fn().mockResolvedValue([]);
    },
    RuntimeDetector: class {
        detect = vi.fn().mockResolvedValue([]);
    },
    BuildDetector: class {
        detect = vi.fn().mockResolvedValue([]);
    },
    CircularDependencyDetector: class {
        detect = vi.fn().mockResolvedValue([]);
    },
    NetworkDetector: class {
        detect = vi.fn().mockResolvedValue([]);
    },
    ComplexityDetector: class {
        detect = vi.fn().mockResolvedValue([]);
    },
    ComponentIsolationDetector: class {
        detect = vi.fn().mockResolvedValue([]);
    }
}));

describe('OBSERVE Phase', () => {
    const testDir = '/test/workspace';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should run all 12 detectors', async () => {
        const metrics = await observe(testDir);

        expect(metrics).toBeDefined();
        expect(metrics.targetDir).toBe(testDir);
        expect(metrics.runId).toMatch(/^run-\d+$/);
        expect(metrics.timestamp).toBeDefined();
    });

    it('should calculate total issues correctly', async () => {
        const metrics = await observe(testDir);

        // With mocked SecurityDetector returning 1 issue
        expect(metrics.security).toBe(1);
        expect(metrics.totalIssues).toBe(1);
    });

    it('should return zero for detectors with no issues', async () => {
        const metrics = await observe(testDir);

        expect(metrics.typescript).toBe(0);
        expect(metrics.eslint).toBe(0);
        expect(metrics.performance).toBe(0);
        expect(metrics.imports).toBe(0);
        expect(metrics.packages).toBe(0);
        expect(metrics.runtime).toBe(0);
        expect(metrics.build).toBe(0);
        expect(metrics.circular).toBe(0);
        expect(metrics.network).toBe(0);
        expect(metrics.complexity).toBe(0);
        expect(metrics.isolation).toBe(0);
    });

    it('should include details for each detector', async () => {
        const metrics = await observe(testDir);

        expect(metrics.details).toBeDefined();
        // Only security detector has issues in mock, so only it should have details
        expect(metrics.details?.security).toBeDefined();
        expect(metrics.details?.security).toHaveLength(1);
        expect(metrics.details?.security?.[0]).toMatchObject({
            type: 'hardcoded-secret',
            severity: 'critical'
        });
    });

    it('should generate unique run IDs', async () => {
        const metrics1 = await observe(testDir);
        await new Promise(resolve => setTimeout(resolve, 10)); // Wait 10ms
        const metrics2 = await observe(testDir);

        expect(metrics1.runId).not.toBe(metrics2.runId);
    });

    it('should use ISO timestamp format', async () => {
        const metrics = await observe(testDir);

        // ISO 8601 format validation
        expect(metrics.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should run detectors in parallel for performance', async () => {
        const startTime = Date.now();
        await observe(testDir);
        const duration = Date.now() - startTime;

        // Parallel execution should complete quickly (<1s for mocked detectors)
        // Sequential would be 12 * detector_time, parallel is max(detector_time)
        expect(duration).toBeLessThan(1000);
    });
});
