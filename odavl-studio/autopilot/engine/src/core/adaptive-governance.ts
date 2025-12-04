import * as fsp from "node:fs/promises";
import path from "node:path";
import { computeTrustScore } from "./trust-scorer.js";
import type { GovernanceConfig } from "./policies.js";
import { recordPolicyChange } from "./policy-ledger.js";

export async function adaptGovernance(base: GovernanceConfig): Promise<GovernanceConfig> {
    const score = await computeTrustScore();
    const newMaxFiles = Math.round(base.maxFiles * score);
    const newLoc = Math.round(base.maxLocPerFile * score);
    const adjusted = { ...base, maxFiles: newMaxFiles, maxLocPerFile: newLoc };
    const root = process.cwd();
    const out = path.join(root, ".odavl", "governance", `adaptive-${Date.now()}.json`);

    try {
        await fsp.access(path.dirname(out));
    } catch {
        await fsp.mkdir(path.dirname(out), { recursive: true });
    }

    await fsp.writeFile(out, JSON.stringify({ score, adjusted }, null, 2), "utf8");
    await recordPolicyChange({ timestamp: new Date().toISOString(), trustScore: score, maxFiles: newMaxFiles, maxLocPerFile: newLoc });
    console.log(`[ODAVL] Adaptive Governance Applied → trust=${score}, files=${newMaxFiles}, loc=${newLoc}`);
    return adjusted;
}
