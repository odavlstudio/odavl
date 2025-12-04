#!/usr/bin/env node
// ODAVL Phase 6 Test: Demonstrates safe plan execution with snapshot and rollback
import { runPlan } from "../core/plan-runner";

async function main() {
    const idx = process.argv.indexOf("--plan");
    if (idx === -1) throw new Error("Usage: odavl apply --plan <path>");
    const planPath = process.argv[idx + 1];
    await runPlan(planPath);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});