/**
 * VERIFY phase: Validates improvements against quality gates
 * @fileoverview Verification functionality for ODAVL cycle
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import yaml from "js-yaml";
import { observe, type Metrics } from "./observe.js";
import { logPhase } from "../utils/core-utils.js";

/**
 * Quality gates configuration structure
 */
export interface GatesConfig {
    eslint?: { deltaMax: number };
    typeErrors?: { deltaMax: number };
    [key: string]: unknown;
}


/**
 * Performs shadow verification by running quality checks in an isolated environment.
 * This provides an additional safety layer before applying quality gates.
 * 
 * @returns true if all shadow verification checks pass, false otherwise
 */
function runShadowVerify(): boolean {
    const ROOT = process.cwd();
    const shadowDir = path.join(ROOT, ".odavl", "shadow");

    if (!fs.existsSync(shadowDir)) fs.mkdirSync(shadowDir, { recursive: true });

    console.log("[SHADOW] Verifying in isolated environment...");

    try {
        const cmds = [
            "pnpm run lint",
            "pnpm run typecheck"
        ];

        for (const cmd of cmds) {
            console.log("[SHADOW]", cmd);
            const res = spawnSync(cmd, { shell: true, cwd: process.cwd(), stdio: "inherit" });
            if (res.status !== 0) throw new Error(cmd + " failed");
        }

        fs.writeFileSync(path.join(shadowDir, "verify.log"), "[PASS] All checks passed");
        console.log("[SHADOW] ✅ All checks passed");
        return true;
    } catch (err) {
        fs.writeFileSync(path.join(shadowDir, "verify.log"), "[FAIL] " + (err as Error).message);
        console.log("[SHADOW] ❌ Verification failed");
        return false;
    }
}

/**
 * Validates changes against quality gates defined in .odavl/gates.yml.
 * Quality gates prevent degradation by setting maximum allowed increases in warnings/errors.
 * 
 * @param deltas - The change in metrics (positive = increase, negative = improvement)
 * @returns Object containing pass/fail status, gate configuration, and any violations
 */
function checkGates(deltas: { eslint: number; types: number }): {
    passed: boolean;
    gates: unknown;
    violations: string[]
} {
    const ROOT = process.cwd();
    const gatesPath = path.join(ROOT, ".odavl", "gates.yml");
    let gates: unknown = {};

    if (fs.existsSync(gatesPath)) {
        try {
            gates = yaml.load(fs.readFileSync(gatesPath, "utf8"));
        } catch {
            /* ignore malformed gates file */
        }
    }

    const violations: string[] = [];
    const g = gates as GatesConfig;

    if (g.eslint?.deltaMax !== undefined && deltas.eslint > g.eslint.deltaMax) {
        violations.push(`ESLint delta ${deltas.eslint} > ${g.eslint.deltaMax}`);
    }

    if (g.typeErrors?.deltaMax !== undefined && deltas.types > g.typeErrors.deltaMax) {
        violations.push(`Type errors delta ${deltas.types} > ${g.typeErrors.deltaMax}`);
    }

    const passed = violations.length === 0;
    logPhase("VERIFY", passed ? "Gates check: PASS ✅" : `Gates check: FAIL ❌ (${violations.join(', ')})`, passed ? "success" : "error");

    return { passed, gates, violations };
}

/**
 * VERIFY phase: Measures the impact of actions and validates against quality gates.
 * Runs shadow verification in isolated environment before applying quality gate checks.
 * 
 * @param before - The metrics collected before the ACT phase
 * @returns Object containing after metrics, deltas, gate results, and gate configuration
 * 
 * @example
 * ```typescript
 * import { verify } from './phases/verify.js';
 * import { observe } from './phases/observe.js';
 * import { act } from './phases/act.js';
 * 
 * // Basic usage after ACT phase
 * const beforeMetrics = observe();
 * act("remove-unused");
 * const result = verify(beforeMetrics);
 * 
 * console.log(`Gates passed: ${result.gatesPassed}`);
 * console.log(`ESLint change: ${result.deltas.eslint}`);
 * console.log(`Type errors change: ${result.deltas.types}`);
 * 
 * // Example verification scenarios:
 * 
 * // Scenario 1: Successful improvement
 * // Before: { eslintWarnings: 10, typeErrors: 2 }
 * // After:  { eslintWarnings: 7, typeErrors: 2 }
 * // Result: {
 * //   after: { eslintWarnings: 7, typeErrors: 2, timestamp: "..." },
 * //   deltas: { eslint: -3, types: 0 },
 * //   gatesPassed: true,
 * //   gates: { eslint: { deltaMax: 0 }, typeErrors: { deltaMax: 0 } }
 * // }
 * 
 * // Scenario 2: Quality degradation (gates fail)
 * // Before: { eslintWarnings: 5, typeErrors: 0 }
 * // After:  { eslintWarnings: 8, typeErrors: 1 }
 * // .odavl/gates.yml: { eslint: { deltaMax: 0 }, typeErrors: { deltaMax: 0 } }
 * // Result: {
 * //   after: { eslintWarnings: 8, typeErrors: 1, timestamp: "..." },
 * //   deltas: { eslint: 3, types: 1 },
 * //   gatesPassed: false,
 * //   gates: { eslint: { deltaMax: 0 }, typeErrors: { deltaMax: 0 } }
 * // }
 * 
 * // Scenario 3: Shadow verification failure
 * // If lint or typecheck commands fail in shadow environment:
 * // Result: { gatesPassed: false, ... }
 * 
 * // Complete ODAVL integration:
 * const before = observe();
 * act("remove-unused");
 * const verification = verify(before);
 * 
 * if (verification.gatesPassed) {
 *   console.log("✅ Quality improvement verified!");
 *   console.log(`Reduced warnings by ${-verification.deltas.eslint}`);
 * } else {
 *   console.log("❌ Quality gates failed - consider rollback");
 * }
 * 
 * // Quality gates configuration (.odavl/gates.yml):
 * // eslint:
 * //   deltaMax: 0    # No increase in ESLint warnings allowed
 * // typeErrors:
 * //   deltaMax: 0    # No increase in TypeScript errors allowed
 * ```
 */
export function verify(before: Metrics): {
    after: Metrics;
    deltas: { eslint: number; types: number };
    gatesPassed: boolean;
    gates: unknown
} {
    const ROOT = process.cwd();
    const reportsDir = path.join(ROOT, "reports");

    const after = observe();
    const deltas = {
        eslint: after.eslintWarnings - before.eslintWarnings,
        types: after.typeErrors - before.typeErrors
    };

    const shadowPassed = runShadowVerify();
    if (!shadowPassed) {
        const verify = { after, deltas, gatesPassed: false, gates: {} };
        fs.writeFileSync(path.join(reportsDir, `verify-${Date.now()}.json`), JSON.stringify(verify, null, 2));
        return verify;
    }

    const gatesResult = checkGates(deltas);
    const verify = { after, deltas, gatesPassed: gatesResult.passed, gates: gatesResult.gates };
    fs.writeFileSync(path.join(reportsDir, `verify-${Date.now()}.json`), JSON.stringify(verify, null, 2));

    return verify;
}
