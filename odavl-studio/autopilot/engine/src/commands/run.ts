#!/usr/bin/env node
// ODAVL Phase 6 Test: Safe plan application with governance controls
import { runOdavlLoop } from "../core/odavl-loop";
import { writeLedger } from "../core/ledger";

async function main() {
    const planPath = process.argv.includes("--plan")
        ? process.argv[process.argv.indexOf("--plan") + 1]
        : undefined;

    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("  ODAVL - Autonomous Code Quality & Governance Platform");
    console.log("═══════════════════════════════════════════════════════════\n");

    const ctx = await runOdavlLoop(planPath);

    const ledgerPath = await writeLedger(ctx.runId, {
        startedAt: ctx.startedAt,
        planPath: ctx.planPath ?? null,
        notes: ctx.notes,
    });

    console.log(`\n[ODAVL] ✅ Run ${ctx.runId} complete → ledger: ${ledgerPath}`);

    // Exit with success/failure based on verify gates
    const verifyResult = ctx.notes.verify as { gatesPassed?: boolean } | undefined;
    const exitCode = verifyResult?.gatesPassed ? 0 : 1;

    if (exitCode !== 0) {
        console.log("[ODAVL] ⚠️  Quality gates failed - see ledger for details");
    }

    process.exit(exitCode);
}

void main().catch((e) => {
    console.error("\n[ODAVL] ❌ Fatal error:", e);
    process.exit(1);
});