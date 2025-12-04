import micromatch from "micromatch";
import { getGovernanceConfig } from "./policies";

export type Edit = { path: string; diffLoc: number };

export const RiskBudgetGuard = {
    async validate(edits: Edit[]) {
        const cfg = await getGovernanceConfig();
        if (edits.length > cfg.maxFiles) {
            throw new Error(`Max files exceeded: ${edits.length}/${cfg.maxFiles}`);
        }
        for (const e of edits) {
            if (micromatch.isMatch(e.path, cfg.protectedGlobs)) {
                throw new Error(`Protected path: ${e.path}`);
            }
            if (e.diffLoc > cfg.maxLocPerFile) {
                throw new Error(`LOC exceeded for ${e.path}: ${e.diffLoc}/${cfg.maxLocPerFile}`);
            }
        }
        return cfg;
    },
    async applyEdits(edits: Edit[]) {
        const cfg = await this.validate(edits);
        // Phase 1: NO real writes. Just simulate acceptance. Next phases will add file ops.
        return { accepted: edits.length, cfg };
    },
};
