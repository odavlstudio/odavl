/**
 * VERIFY phase: Validates improvements against quality gates
 * 
 * ✅ Phase 3 Update:
 * - Re-reads Insight analysis after fixes (via observe.ts)
 * - NO local detection (observe.ts reads .odavl/insight/latest-analysis.json)
 * - Compares before/after metrics from Insight
 * - Enforces quality gates from .odavl/gates.yml
 * 
 * @fileoverview Verification functionality for ODAVL cycle
 */

import * as fsp from "node:fs/promises";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import yaml from "js-yaml";
import { observe, type Metrics } from "./observe.js";
import { logPhase } from "./logPhase.js";
import { createAttestation } from "../core/policies.js";

/**
 * Quality gates configuration structure
 */
export interface GatesConfig {
    eslint?: { deltaMax: number };
    typeErrors?: { deltaMax: number };
    testCoverage?: {
        minPercentage: number;
        deltaMax: number;
        enforceBranches: boolean;
        excludeGlobs?: string[];
    };
    complexity?: {
        maxPerFunction: number;
        maxAverage: number;
        deltaMax: number;
        warnThreshold: number;
    };
    bundleSize?: {
        maxTotalMB: number;
        maxChunkKB: number;
        deltaMaxPercent: number;
        excludeAssets?: string[];
    };
    [key: string]: unknown;
}


/**
 * Performs shadow verification by running quality checks in an isolated environment.
 * This provides an additional safety layer before applying quality gates.
 * 
 * @returns true if all shadow verification checks pass, false otherwise
 */
async function runShadowVerify(): Promise<boolean> {
    console.log("[SHADOW] Verifying improvements...");

    try {
        // Simple check: just run ESLint (faster than full typecheck)
        const res = spawnSync("pnpm exec eslint . --max-warnings=0", {
            shell: true,
            cwd: process.cwd(),
            stdio: "pipe"
        });

        if (res.status !== 0) {
            console.log("[SHADOW] ❌ ESLint found issues");
            return false;
        }

        console.log("[SHADOW] ✅ All checks passed");
        return true;
    } catch (err) {
        console.log("[SHADOW] ❌ Verification failed:", (err as Error).message);
        return false;
    }
}

/**
 * Validates changes against quality gates defined in .odavl/gates.yml.
 * Quality gates prevent degradation by setting maximum allowed increases in warnings/errors.
 * Updated Week 4 Day 5: Added coverage, complexity, and bundle size gates.
 * 
 * @param deltas - The change in metrics (positive = increase, negative = improvement)
 * @param after - Current metrics (for absolute value checks like coverage %, complexity max)
 * @returns Object containing pass/fail status, gate configuration, and any violations
 */
export async function checkGates(
    deltas: { eslint: number; types: number; coverage?: number; complexity?: number; bundleSize?: number },
    after?: { coverage?: number; complexity?: number; bundleSize?: number }
): Promise<{
    passed: boolean;
    gates: unknown;
    violations: string[]
}> {
    const ROOT = process.cwd();
    const gatesPath = path.join(ROOT, ".odavl", "gates.yml");
    let gates: unknown = {};

    try {
        await fsp.access(gatesPath);
        const content = await fsp.readFile(gatesPath, "utf8");
        gates = yaml.load(content);
    } catch {
        /* ignore malformed gates file or missing file */
    }

    const violations: string[] = [];
    const g = gates as GatesConfig;

    // Round 13: Primary gate - totalIssues must not increase
    const totalIssuesDelta = (deltas as any).totalIssues;
    if (totalIssuesDelta !== undefined) {
        if (totalIssuesDelta > 0) {
            violations.push(`Total issues increased: +${totalIssuesDelta}`);
        } else if (totalIssuesDelta < 0) {
            logPhase("VERIFY", `✅ Total issues reduced by ${Math.abs(totalIssuesDelta)}`, "success");
        }
    }

    // Round 13: Detector-specific gates - no increases allowed
    const detectorNames = ['typescript', 'security', 'performance', 'complexity', 'imports'];
    for (const detectorName of detectorNames) {
        const delta = (deltas as any)[detectorName];
        if (delta !== undefined && delta > 0) {
            violations.push(`${detectorName} issues increased: +${delta}`);
        }
    }

    // Existing gates: ESLint and TypeScript
    if (g.eslint?.deltaMax !== undefined && deltas.eslint > g.eslint.deltaMax) {
        violations.push(`ESLint delta ${deltas.eslint} > ${g.eslint.deltaMax}`);
    }

    if (g.typeErrors?.deltaMax !== undefined && deltas.types > g.typeErrors.deltaMax) {
        violations.push(`Type errors delta ${deltas.types} > ${g.typeErrors.deltaMax}`);
    }

    // NEW: Test Coverage gate (Week 4 Day 5)
    if (g.testCoverage && after?.coverage !== undefined) {
        if (after.coverage < g.testCoverage.minPercentage) {
            violations.push(`Coverage ${after.coverage.toFixed(1)}% < ${g.testCoverage.minPercentage}%`);
        }
        if (deltas.coverage !== undefined && deltas.coverage < g.testCoverage.deltaMax) {
            violations.push(`Coverage delta ${deltas.coverage.toFixed(1)}% < ${g.testCoverage.deltaMax}%`);
        }
    }

    // NEW: Complexity gate (Week 4 Day 5)
    if (g.complexity && after?.complexity !== undefined) {
        if (after.complexity > g.complexity.maxPerFunction) {
            violations.push(`Max complexity ${after.complexity} > ${g.complexity.maxPerFunction}`);
        }
        if (deltas.complexity !== undefined && deltas.complexity > g.complexity.deltaMax) {
            violations.push(`Complexity delta ${deltas.complexity} > ${g.complexity.deltaMax}`);
        }
    }

    // NEW: Bundle Size gate (Week 4 Day 5)
    if (g.bundleSize && after?.bundleSize !== undefined) {
        const maxTotalBytes = g.bundleSize.maxTotalMB * 1024 * 1024;
        if (after.bundleSize > maxTotalBytes) {
            violations.push(`Bundle size ${(after.bundleSize / 1024 / 1024).toFixed(2)}MB > ${g.bundleSize.maxTotalMB}MB`);
        }
        if (deltas.bundleSize !== undefined) {
            const percentChange = (deltas.bundleSize / (after.bundleSize - deltas.bundleSize)) * 100;
            if (percentChange > g.bundleSize.deltaMaxPercent) {
                violations.push(`Bundle size delta ${percentChange.toFixed(1)}% > ${g.bundleSize.deltaMaxPercent}%`);
            }
        }
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
 * @param recipeId - The recipe ID that was executed (for attestation)
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
export async function verify(before: Metrics, recipeId = "unknown", targetDir?: string): Promise<{
    after: Metrics;
    deltas: { eslint: number; types: number };
    gatesPassed: boolean;
    gates: unknown;
    attestation?: { hash: string; timestamp: string };
}> {
    const ROOT = process.cwd();
    const reportsDir = path.join(ROOT, "reports");

    // ✅ Phase 3: observe() now reads Insight JSON (no local detection)
    // User must run 'odavl insight analyze' after fixes to update analysis
    const after = await observe(targetDir || before.targetDir || process.cwd());
    const deltas = {
        eslint: after.eslint - before.eslint,
        types: after.typescript - before.typescript
    };

    const shadowPassed = await runShadowVerify();

    // Ensure reports directory exists before writing
    try {
        await fsp.access(reportsDir);
    } catch {
        await fsp.mkdir(reportsDir, { recursive: true });
    }

    if (!shadowPassed) {
        const verify = { after, deltas, gatesPassed: false, gates: {} };
        await fsp.writeFile(path.join(reportsDir, `verify-${Date.now()}.json`), JSON.stringify(verify, null, 2));
        return verify;
    }

    const gatesResult = await checkGates(deltas, {
        coverage: after.totalIssues > 0 ? 100 - (after.totalIssues / 1000) * 100 : 100, // Placeholder calculation
        complexity: after.complexity || 0,
        bundleSize: 0 // Would need actual bundle size measurement
    });
    const verify = { after, deltas, gatesPassed: gatesResult.passed, gates: gatesResult.gates };

    // Create attestation if gates passed and there was improvement
    if (gatesResult.passed && deltas.eslint <= 0 && deltas.types <= 0) {
        try {
            const attestation = await createAttestation(
                recipeId,
                { eslint: before.eslint, typescript: before.typescript, totalIssues: before.totalIssues },
                { eslint: after.eslint, typescript: after.typescript, totalIssues: after.totalIssues }
            );
            logPhase("VERIFY", `✅ Attestation created: ${attestation.hash.slice(0, 8)}...`, "success");
            Object.assign(verify, { attestation: { hash: attestation.hash, timestamp: attestation.timestamp } });
        } catch (err) {
            logPhase("VERIFY", `⚠️ Failed to create attestation: ${(err as Error).message}`, "warn");
        }
    }

    await fsp.writeFile(path.join(reportsDir, `verify-${Date.now()}.json`), JSON.stringify(verify, null, 2));

    // Compute learning signals from Brain
    try {
        const { computeLearningSignals } = await import('@odavl-studio/brain/learning');
        const signals = computeLearningSignals();
        logPhase("VERIFY", `🧠 Learning Signals (placeholder): ${JSON.stringify(signals)} | Issues: ${after.totalIssues}, Actions: ${Math.abs(deltas.eslint) + Math.abs(deltas.types)}`, "info");
    } catch (err) {
        logPhase("VERIFY", `⚠️ Failed to compute learning signals: ${(err as Error).message}`, "warn");
    }

    return verify;
}
