/**
 * Autopilot SDK Unit Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Autopilot } from '../autopilot';

describe('Autopilot SDK', () => {
    let autopilot: Autopilot;

    beforeEach(() => {
        autopilot = new Autopilot({ workspacePath: '/test/workspace' });
    });

    describe('Constructor', () => {
        it('should create instance with config', () => {
            expect(autopilot).toBeDefined();
        });

        it('should accept risk budget config', () => {
            const ap = new Autopilot({
                workspacePath: '/test',
                maxFiles: 5,
                maxLOC: 20
            });
            expect(ap).toBeDefined();
        });
    });

    describe('runCycle()', () => {
        it('should execute full O-D-A-V-L cycle', async () => {
            const result = await autopilot.runCycle();

            expect(result).toBeDefined();
            expect(result.runId).toBeDefined();
            expect(result.phase).toBeDefined();
            expect(result.success).toBe(false); // Stub returns failure
            expect(result.metrics).toBeDefined();
        });
    });

    describe('runPhase()', () => {
        it('should execute single phase', async () => {
            const result = await autopilot.runPhase('observe');

            expect(result).toBeDefined();
            expect(result.phase).toBe('observe');
        });

        it('should support all phases', async () => {
            const phases = ['observe', 'decide', 'act', 'verify', 'learn'] as const;

            for (const phase of phases) {
                const result = await autopilot.runPhase(phase);
                expect(result.phase).toBe(phase);
            }
        });
    });

    describe('undo()', () => {
        it('should restore previous state', async () => {
            await autopilot.undo();
            // Void return, just ensure no throw
        });

        it('should accept snapshot ID', async () => {
            await autopilot.undo('snapshot-123');
            // Void return, just ensure no throw
        });
    });

    describe('getLedger()', () => {
        it('should return run history', async () => {
            const result = await autopilot.getLedger();

            expect(result).toBeInstanceOf(Array);
        });
    });

    describe('getRecipes()', () => {
        it('should return available recipes', async () => {
            const result = await autopilot.getRecipes();

            expect(result).toBeInstanceOf(Array);
        });
    });
});
