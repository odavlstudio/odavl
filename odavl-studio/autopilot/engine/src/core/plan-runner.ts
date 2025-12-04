import * as fsp from "node:fs/promises";
import yaml from "yaml";
import { RiskBudgetGuard } from "./risk-budget";
import { writeLedger } from "./ledger";
import { createSnapshot } from "./snapshots";
import { safeApplyEdit } from "./file-ops";
import { handleOdavlError } from "./error-handler";

export interface PlanEdit {
    path: string;
    diff: string;
    diffLoc: number;
}

export interface Plan {
    id: string;
    createdAt: string;
    edits: PlanEdit[];
}

export async function runPlan(planPath: string) {
    let snapId: string | null = null;
    try {
        try {
            await fsp.access(planPath);
        } catch {
            throw new Error(`Plan not found: ${planPath}`);
        }

        const raw = await fsp.readFile(planPath, "utf8");
        const plan: Plan =
            planPath.endsWith(".yml") || planPath.endsWith(".yaml")
                ? yaml.parse(raw)
                : JSON.parse(raw);
        await RiskBudgetGuard.validate(plan.edits);
        snapId = await createSnapshot(plan.edits.map((e) => e.path));
        for (const e of plan.edits) await safeApplyEdit(e.path, e.diff);
        const ledgerPath = await writeLedger(plan.id, { edits: plan.edits, snapshot: snapId });
        console.log(`[ODAVL] Plan ${plan.id} applied safely → ${ledgerPath}`);
        return { planId: plan.id, ledgerPath, snapshot: snapId };
    } catch (err) {
        await handleOdavlError(snapId, err as Error);
        throw err;
    }
}
