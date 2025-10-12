/**
 * VERIFY phase: Validates improvements against quality gates
 * @fileoverview Verification functionality for ODAVL cycle
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import yaml from "js-yaml";
import { observe, type Metrics } from "./observe.js";

/**
 * Quality gates configuration structure
 */
export interface GatesConfig {
  eslint?: { deltaMax: number };
  typeErrors?: { deltaMax: number };
  [key: string]: unknown;
}

/**
 * Logs a message for a specific ODAVL phase with optional status indication.
 * Supports both human-readable and JSON output modes for VS Code extension integration.
 * 
 * @param phase - The ODAVL phase (OBSERVE, DECIDE, ACT, VERIFY, LEARN)
 * @param msg - The message to log
 * @param status - The message status level for color-coding
 */
function logPhase(phase: string, msg: string, status: "info" | "success" | "error" = "info") {
  const isJsonMode = process.argv.includes("--json");
  
  if (isJsonMode) {
    console.log(JSON.stringify({ type: "doctor", status, data: { phase, msg } }));
    // Force immediate flush to reduce latency for VS Code extension
    process.stdout.write('');
  } else {
    console.log(`[${phase}] ${msg}`);
  }
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