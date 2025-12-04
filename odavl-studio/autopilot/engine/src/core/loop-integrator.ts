import { runPlan } from "./plan-runner";
import { observe, decide, verify, learn, type PhaseContext } from "./odavl-loop";
import { writeLedger } from "./ledger";
import { logMetric } from "./live-metrics";
import { recordLearning } from "./learning-journal";
import { getActiveGovernance } from "./risk-controller";
import * as fsp from "node:fs/promises";
import path from "node:path";

async function writeRecoveryNote(runId: string, reason: string) {
    const dir = path.join(process.cwd(), ".odavl", "attestations", "recovery");

    try {
        await fsp.access(dir);
    } catch {
        await fsp.mkdir(dir, { recursive: true });
    }

    await fsp.writeFile(
        path.join(dir, `recovery-${runId}.md`),
        `# ODAVL Recovery\n- ID: ${runId}\n- Reason: ${reason}\n- At: ${new Date().toISOString()}\n`,
        "utf8"
    );
}

export async function runFullLoop(planPath?: string) {
    const runId = `${Date.now()}`;
    const gov = await getActiveGovernance();
    try {
        await logMetric("loop_start", { runId, planPath });
        let ctx: PhaseContext = { runId, startedAt: new Date().toISOString(), planPath: planPath ?? null, governance: gov, edits: [], notes: {} };
        ctx = await observe(ctx);
        ctx = await decide(ctx);
        const planResult = planPath ? await runPlan(planPath) : null;
        ctx = await verify(ctx);
        ctx = await learn(ctx);
        await writeLedger(runId, { phase: "loop", status: "ok", plan: planResult });
        await recordLearning(runId, "Full loop completed successfully");
        await logMetric("loop_complete", { runId, status: "ok" });
        console.log(`[ODAVL] ✅ Full loop executed successfully`);
        return ctx;
    } catch (err) {
        const msg = (err as Error).message;
        await writeRecoveryNote(runId, msg);
        await logMetric("loop_error", { runId, error: msg });
        throw err;
    }
}
