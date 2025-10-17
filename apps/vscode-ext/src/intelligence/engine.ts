import { runCLI } from './cli';

export type ODAVLPhase = 'observe' | 'decide' | 'act' | 'verify' | 'learn';

export interface ODAVLCycleResult {
    phases: Record<ODAVLPhase, any>;
    metrics: Record<string, any>;
    summary: string;
}

export async function runODAVLCycle(
    workspace: string,
    onUpdate?: (phase: ODAVLPhase) => void
): Promise<ODAVLCycleResult> {
    const phases: ODAVLPhase[] = ['observe', 'decide', 'act', 'verify', 'learn'];
    const results: Record<ODAVLPhase, any> = {};
    for (const phase of phases) {
        if (onUpdate) onUpdate(phase);
        results[phase] = await runCLI(phase, workspace);
    }
    // Collect metrics and summary (stub)
    const metrics = { success: true };
    const summary = 'Cycle complete';
    return { phases: results, metrics, summary };
}
