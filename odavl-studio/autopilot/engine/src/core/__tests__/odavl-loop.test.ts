import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runOdavlLoop, observe, decide, act, verify, learn } from '../odavl-loop';
import type { PhaseContext } from '../odavl-loop';

// Mock all phase modules
vi.mock('../../phases/observe', () => ({
    observe: vi.fn(),
}));

vi.mock('../../phases/decide', () => ({
    decide: vi.fn(),
}));

vi.mock('../../phases/act', () => ({
    act: vi.fn(),
}));

vi.mock('../../phases/verify', () => ({
    verify: vi.fn(),
}));

vi.mock('../../phases/learn', () => ({
    learn: vi.fn(),
}));

vi.mock('../../utils/metrics', () => ({
    saveMetrics: vi.fn(),
    formatMetrics: vi.fn(() => 'Formatted metrics'),
}));

describe('ODAVL Loop Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('observe phase wrapper', () => {
        it('should call observePhase and store metrics in context', async () => {
            const mockMetrics = {
                timestamp: '2025-01-01T00:00:00.000Z',
                runId: 'test-run',
                targetDir: '/test',
                totalIssues: 10,
                typescript: 5,
                eslint: 3,
                security: 2,
                imports: 0,
                packages: 0,
                runtime: 0,
                build: 0,
                circular: 0,
                network: 0,
                performance: 0,
                complexity: 0,
                isolation: 0,
                details: {},
            };

            const { observe: observeMock } = await import('../../phases/observe');
            vi.mocked(observeMock).mockResolvedValue(mockMetrics);

            const ctx: PhaseContext = {
                runId: 'test-run',
                startedAt: '2025-01-01T00:00:00.000Z',
                planPath: null,
                governance: { maxFiles: 10, maxLocPerFile: 40, protectedGlobs: [] },
                edits: [],
                notes: {},
            };

            const result = await observe(ctx);

            expect(result.metrics).toEqual(mockMetrics);
            expect(result.notes.observe).toMatchObject({
                phase: 'observe',
                status: 'complete',
                totalIssues: 10,
            });
        });

        it('should handle observe phase errors', async () => {
            const { observe: observeMock } = await import('../../phases/observe');
            vi.mocked(observeMock).mockRejectedValue(new Error('Test error'));

            const ctx: PhaseContext = {
                runId: 'test-run',
                startedAt: '2025-01-01T00:00:00.000Z',
                planPath: null,
                governance: { maxFiles: 10, maxLocPerFile: 40, protectedGlobs: [] },
                edits: [],
                notes: {},
            };

            await expect(observe(ctx)).rejects.toThrow('Test error');
        });
    });

    describe('decide phase wrapper', () => {
        it('should call decidePhase and store decision in context', async () => {
            const { decide: decideMock } = await import('../../phases/decide');
            vi.mocked(decideMock).mockResolvedValue('import-cleaner');

            const ctx: PhaseContext = {
                runId: 'test-run',
                startedAt: '2025-01-01T00:00:00.000Z',
                planPath: null,
                governance: { maxFiles: 10, maxLocPerFile: 40, protectedGlobs: [] },
                edits: [],
                notes: {},
                metrics: {
                    timestamp: '2025-01-01T00:00:00.000Z',
                    runId: 'test-run',
                    targetDir: '/test',
                    totalIssues: 10,
                    typescript: 5,
                    eslint: 3,
                    security: 2,
                    imports: 0,
                    packages: 0,
                    runtime: 0,
                    build: 0,
                    circular: 0,
                    network: 0,
                    performance: 0,
                    complexity: 0,
                    isolation: 0,
                    details: {},
                },
            };

            const result = await decide(ctx);

            expect(result.decision).toBe('import-cleaner');
            expect(result.notes.decide).toMatchObject({
                phase: 'decide',
                status: 'complete',
                decision: 'import-cleaner',
            });
        });

        it('should throw if metrics missing', async () => {
            const ctx: PhaseContext = {
                runId: 'test-run',
                startedAt: '2025-01-01T00:00:00.000Z',
                planPath: null,
                governance: { maxFiles: 10, maxLocPerFile: 40, protectedGlobs: [] },
                edits: [],
                notes: {},
            };

            await expect(decide(ctx)).rejects.toThrow('DECIDE phase requires metrics');
        });
    });

    describe('act phase wrapper', () => {
        it('should call actPhase and store results in context', async () => {
            const { act: actMock } = await import('../../phases/act');
            vi.mocked(actMock).mockResolvedValue({
                success: true,
                actionsExecuted: 5,
                errors: [],
            });

            const ctx: PhaseContext = {
                runId: 'test-run',
                startedAt: '2025-01-01T00:00:00.000Z',
                planPath: null,
                governance: { maxFiles: 10, maxLocPerFile: 40, protectedGlobs: [] },
                edits: [],
                notes: {},
                decision: 'import-cleaner',
            };

            const result = await act(ctx);

            expect(result.notes.act).toMatchObject({
                phase: 'act',
                status: 'complete',
                actionsExecuted: 5,
            });
        });

        it('should throw if decision missing', async () => {
            const ctx: PhaseContext = {
                runId: 'test-run',
                startedAt: '2025-01-01T00:00:00.000Z',
                planPath: null,
                governance: { maxFiles: 10, maxLocPerFile: 40, protectedGlobs: [] },
                edits: [],
                notes: {},
            };

            await expect(act(ctx)).rejects.toThrow('ACT phase requires decision');
        });
    });

    describe('verify phase wrapper', () => {
        it('should call verifyPhase and store results in context', async () => {
            const { verify: verifyMock } = await import('../../phases/verify');
            vi.mocked(verifyMock).mockResolvedValue({
                after: {} as any,
                deltas: { eslint: -2, types: -1 },
                gatesPassed: true,
                gates: {},
                attestation: { hash: 'abc123', timestamp: '2025-01-01T00:00:00.000Z' },
            });

            const ctx: PhaseContext = {
                runId: 'test-run',
                startedAt: '2025-01-01T00:00:00.000Z',
                planPath: null,
                governance: { maxFiles: 10, maxLocPerFile: 40, protectedGlobs: [] },
                edits: [],
                notes: {},
                metrics: {} as any,
                decision: 'import-cleaner',
            };

            const result = await verify(ctx);

            expect(result.notes.verify).toMatchObject({
                phase: 'verify',
                status: 'complete',
                gatesPassed: true,
            });
        });
    });

    describe('learn phase wrapper', () => {
        it('should call learnPhase and store results in context', async () => {
            const { learn: learnMock } = await import('../../phases/learn');
            vi.mocked(learnMock).mockResolvedValue({
                trustUpdated: true,
                oldTrust: 0.5,
                newTrust: 0.6,
                totalRuns: 10,
                blacklisted: false,
                message: 'Trust updated',
            });

            const ctx: PhaseContext = {
                runId: 'test-run',
                startedAt: '2025-01-01T00:00:00.000Z',
                planPath: null,
                governance: { maxFiles: 10, maxLocPerFile: 40, protectedGlobs: [] },
                edits: [],
                notes: {
                    verify: {
                        gatesPassed: true,
                        deltas: { eslint: -2, types: -1 },
                        attestation: { hash: 'abc123' },
                    },
                },
                decision: 'import-cleaner',
            };

            const result = await learn(ctx);

            expect(result.notes.learn).toMatchObject({
                phase: 'learn',
                status: 'complete',
                trustUpdated: true,
                oldTrust: 0.5,
                newTrust: 0.6,
            });
        });
    });

    describe('runOdavlLoop', () => {
        it('should execute full O→D→A→V→L cycle successfully', async () => {
            // Mock all phases
            const { observe: observeMock } = await import('../../phases/observe');
            const { decide: decideMock } = await import('../../phases/decide');
            const { act: actMock } = await import('../../phases/act');
            const { verify: verifyMock } = await import('../../phases/verify');
            const { learn: learnMock } = await import('../../phases/learn');

            vi.mocked(observeMock).mockResolvedValue({
                timestamp: '2025-01-01T00:00:00.000Z',
                runId: 'test-run',
                targetDir: '/test',
                totalIssues: 10,
                typescript: 5,
                eslint: 3,
                security: 2,
                imports: 0,
                packages: 0,
                runtime: 0,
                build: 0,
                circular: 0,
                network: 0,
                performance: 0,
                complexity: 0,
                isolation: 0,
                details: {},
            });

            vi.mocked(decideMock).mockResolvedValue('import-cleaner');

            vi.mocked(actMock).mockResolvedValue({
                success: true,
                actionsExecuted: 5,
                errors: [],
            });

            vi.mocked(verifyMock).mockResolvedValue({
                after: {} as any,
                deltas: { eslint: -2, types: -1 },
                gatesPassed: true,
                gates: {},
                attestation: { hash: 'abc123', timestamp: '2025-01-01T00:00:00.000Z' },
            });

            vi.mocked(learnMock).mockResolvedValue({
                trustUpdated: true,
                oldTrust: 0.5,
                newTrust: 0.6,
                totalRuns: 10,
                blacklisted: false,
                message: 'Trust updated',
            });

            const result = await runOdavlLoop();

            expect(result.notes.observe).toBeDefined();
            expect(result.notes.decide).toBeDefined();
            expect(result.notes.act).toBeDefined();
            expect(result.notes.verify).toBeDefined();
            expect(result.notes.learn).toBeDefined();
            expect(result.metrics?.totalIssues).toBe(10);
            expect(result.decision).toBe('import-cleaner');
        }, 30000); // 30s timeout

        it('should handle errors in any phase', async () => {
            const { observe: observeMock } = await import('../../phases/observe');
            vi.mocked(observeMock).mockRejectedValue(new Error('Observe failed'));

            await expect(runOdavlLoop()).rejects.toThrow('Observe failed');
        });
    });
});
