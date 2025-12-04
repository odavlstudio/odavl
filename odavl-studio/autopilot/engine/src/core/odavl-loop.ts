import { observe as observePhase } from '../phases/observe';
import { decide as decidePhase } from '../phases/decide';
import { act as actPhase } from '../phases/act';
import { verify as verifyPhase } from '../phases/verify';
import { learn as learnPhase } from '../phases/learn';
import { saveMetrics, formatMetrics } from '../utils/metrics';
import type { Metrics } from '../phases/observe';

export type PhaseContext = {
    runId: string;
    startedAt: string;
    planPath?: string | null;
    governance: { maxFiles: number; maxLocPerFile: number; protectedGlobs: string[] };
    edits: Array<{ path: string; diffLoc: number }>;
    notes: Record<string, unknown>;
    metrics?: Metrics; // Store metrics from OBSERVE
    decision?: string; // Store decision from DECIDE
};

export async function observe(ctx: PhaseContext): Promise<PhaseContext> {
    console.log('🔍 Starting OBSERVE phase...');

    try {
        // Run real ODAVL Insight detectors
        const metrics = await observePhase(process.cwd());

        // Save metrics to .odavl/metrics/
        saveMetrics(metrics);

        // Display formatted output
        console.log(formatMetrics(metrics));

        // Store in context
        ctx.metrics = metrics;
        ctx.notes.observe = {
            phase: "observe",
            status: "complete",
            totalIssues: metrics.totalIssues,
            timestamp: metrics.timestamp
        };

        return ctx;
    } catch (error) {
        console.error('❌ OBSERVE phase failed:', error);
        ctx.notes.observe = {
            phase: "observe",
            status: "failed",
            error: error instanceof Error ? error.message : String(error)
        };
        throw error;
    }
}

export async function decide(ctx: PhaseContext): Promise<PhaseContext> {
    console.log('🤔 Starting DECIDE phase...');

    try {
        if (!ctx.metrics) {
            throw new Error('DECIDE phase requires metrics from OBSERVE phase');
        }

        // Run real decision engine
        const decision = await decidePhase(ctx.metrics);

        // Store decision
        ctx.decision = decision;
        ctx.notes.decide = {
            phase: "decide",
            status: "complete",
            decision,
            timestamp: new Date().toISOString()
        };

        console.log(`✅ Decision: ${decision}`);
        return ctx;
    } catch (error) {
        console.error('❌ DECIDE phase failed:', error);
        ctx.notes.decide = {
            phase: "decide",
            status: "failed",
            error: error instanceof Error ? error.message : String(error)
        };
        throw error;
    }
}

export async function act(ctx: PhaseContext): Promise<PhaseContext> {
    console.log('⚡ Starting ACT phase...');

    try {
        if (!ctx.decision) {
            throw new Error('ACT phase requires decision from DECIDE phase');
        }

        // Run real action execution
        const actResult = await actPhase(ctx.decision);

        // Store results
        ctx.notes.act = {
            phase: "act",
            status: actResult.success ? "complete" : "failed",
            actionsExecuted: actResult.actionsExecuted,
            errors: actResult.errors,
            timestamp: new Date().toISOString()
        };

        console.log(`✅ ACT phase: ${actResult.actionsExecuted} actions executed`);
        return ctx;
    } catch (error) {
        console.error('❌ ACT phase failed:', error);
        ctx.notes.act = {
            phase: "act",
            status: "failed",
            error: error instanceof Error ? error.message : String(error)
        };
        throw error;
    }
}

export async function verify(ctx: PhaseContext): Promise<PhaseContext> {
    console.log('✓ Starting VERIFY phase...');

    try {
        if (!ctx.metrics || !ctx.decision) {
            throw new Error('VERIFY phase requires metrics and decision from previous phases');
        }

        // Run real verification
        const verifyResult = await verifyPhase(ctx.metrics, ctx.decision);

        // Store results
        ctx.notes.verify = {
            phase: "verify",
            status: verifyResult.gatesPassed ? "complete" : "failed",
            gatesPassed: verifyResult.gatesPassed,
            deltas: verifyResult.deltas,
            attestation: verifyResult.attestation,
            timestamp: new Date().toISOString()
        };

        if (verifyResult.gatesPassed) {
            console.log('✅ VERIFY phase: Quality gates passed');
        } else {
            console.log('⚠️ VERIFY phase: Quality gates failed');
        }

        return ctx;
    } catch (error) {
        console.error('❌ VERIFY phase failed:', error);
        ctx.notes.verify = {
            phase: "verify",
            status: "failed",
            error: error instanceof Error ? error.message : String(error)
        };
        throw error;
    }
}

export async function learn(ctx: PhaseContext): Promise<PhaseContext> {
    console.log('📚 Starting LEARN phase...');

    try {
        if (!ctx.decision || !ctx.notes.verify) {
            throw new Error('LEARN phase requires decision and verify results from previous phases');
        }

        const verifyResult = ctx.notes.verify as {
            gatesPassed: boolean;
            deltas?: { eslint: number; types: number };
            attestation?: { hash: string };
        };

        // Run real learning with trust scoring
        const learnResult = await learnPhase(
            ctx.decision,
            verifyResult.gatesPassed,
            verifyResult.deltas ? {
                eslint: verifyResult.deltas.eslint,
                typescript: verifyResult.deltas.types,
                total: verifyResult.deltas.eslint + verifyResult.deltas.types
            } : undefined,
            verifyResult.attestation?.hash
        );

        // Store results
        ctx.notes.learn = {
            phase: "learn",
            status: "complete",
            trustUpdated: learnResult.trustUpdated,
            oldTrust: learnResult.oldTrust,
            newTrust: learnResult.newTrust,
            blacklisted: learnResult.blacklisted,
            message: learnResult.message,
            timestamp: new Date().toISOString()
        };

        console.log(`✅ LEARN phase complete: ${learnResult.message}`);
        return ctx;
    } catch (error) {
        console.error('❌ LEARN phase failed:', error);
        ctx.notes.learn = {
            phase: "learn",
            status: "failed",
            error: error instanceof Error ? error.message : String(error)
        };
        throw error;
    }
}

export async function runOdavlLoop(planPath?: string): Promise<PhaseContext> {
    const runId = `${Date.now()}`;
    const startedAt = new Date().toISOString();

    console.log(`\n🚀 ODAVL Loop Started (Run ID: ${runId})\n`);

    const base: PhaseContext = {
        runId,
        startedAt,
        planPath: planPath ?? null,
        governance: { maxFiles: 10, maxLocPerFile: 40, protectedGlobs: [] },
        edits: [],
        notes: {},
    };

    try {
        let ctx = await observe(base);
        ctx = await decide(ctx);
        ctx = await act(ctx);
        ctx = await verify(ctx);
        ctx = await learn(ctx);

        console.log(`\n✅ ODAVL Loop Complete (Run ID: ${runId})\n`);
        return ctx;
    } catch (error) {
        console.error(`\n❌ ODAVL Loop Failed (Run ID: ${runId}):`, error);
        throw error;
    }
}
