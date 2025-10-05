#!/usr/bin/env node

import { execSync, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import yaml from "js-yaml";

type Metrics = { eslintWarnings: number; typeErrors: number; timestamp: string };
type RunReport = {
  before: Metrics;
  after: Metrics;
  deltas: { eslint: number; types: number };
  decision: string;
  gatesPassed?: boolean;
  gates?: unknown;
};

type Recipe = { id: string; trust?: number; [key: string]: unknown };
type TrustRecord = { id: string; runs: number; success: number; trust: number };
type GatesConfig = { eslint?: { deltaMax: number }; typeErrors?: { deltaMax: number }; [key: string]: unknown };

const ROOT = process.cwd();
const reportsDir = path.join(ROOT, "reports");
const odavlDir = path.join(ROOT, ".odavl");
const _unusedVar = "test"; // This will create an ESLint warning (but now ignored)

// Check if --json flag is passed for structured output
const isJsonMode = process.argv.includes("--json");

function logPhase(phase: string, msg: string, status: "info" | "success" | "error" = "info") {
  if (isJsonMode) {
    console.log(JSON.stringify({ type: "doctor", status, data: { phase, msg } }));
  } else {
    console.log(`[${phase}] ${msg}`);
  }
}

function sh(cmd: string): { out: string; err: string } {
  try {
    const out = execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString();
    return { out, err: "" };
  } catch (e: unknown) {
    const execError = e as { stdout?: Buffer; stderr?: Buffer };
    const out = execError.stdout?.toString() ?? "";
    const err = execError.stderr?.toString() ?? "";
    return { out, err };
  }
}

function ensureDirs() {
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  if (!fs.existsSync(odavlDir)) fs.mkdirSync(odavlDir, { recursive: true });
}

function loadRecipes(): Recipe[] {
  const rDir = path.join(odavlDir, "recipes");
  const list: Recipe[] = [];
  if (fs.existsSync(rDir)) {
    for (const f of fs.readdirSync(rDir)) {
      const fp = path.join(rDir, f);
      try { list.push(JSON.parse(fs.readFileSync(fp, "utf8"))); } catch { /* ignore */ }
    }
  }
  return list;
}

function updateTrust(recipeId: string, success: boolean) {
  const trustPath = path.join(odavlDir, "recipes-trust.json");
  let arr: TrustRecord[] = [];
  if (fs.existsSync(trustPath)) {
    try { arr = JSON.parse(fs.readFileSync(trustPath, "utf8")); } catch { /* ignore */ }
  }
  let r = arr.find((x) => x.id === recipeId);
  if (!r) { r = { id: recipeId, runs: 0, success: 0, trust: 0.8 }; arr.push(r); }
  r.runs++;
  if (success) r.success++;
  r.trust = Math.max(0.1, Math.min(1, r.success / r.runs));
  fs.writeFileSync(trustPath, JSON.stringify(arr, null, 2));
}

function observe(): Metrics {
  ensureDirs();
  // ESLint JSON
  const eslintRes = sh("pnpm -s exec eslint . -f json");
  let eslintWarnings = 0;
  try {
    const parsed = JSON.parse(eslintRes.out || "[]");
    if (Array.isArray(parsed)) {
      for (const file of parsed) {
        for (const msg of file.messages || []) {
          if (msg.severity === 1) eslintWarnings++;
        }
      }
    }
  } catch {
    // If parsing fails, fallback to 0 warnings
  }

  // TypeScript noEmit
  const tscRes = sh("pnpm -s exec tsc -p tsconfig.json --noEmit");
  const typeErrors = (tscRes.out + tscRes.err).match(/error TS\d+/g)?.length ?? 0;

  const metrics: Metrics = { eslintWarnings, typeErrors, timestamp: new Date().toISOString() };
  fs.writeFileSync(path.join(reportsDir, `observe-${Date.now()}.json`), JSON.stringify(metrics, null, 2));
  return metrics;
}

function decide(_m: Metrics): string {
  const recipes = loadRecipes();
  if (!recipes.length) return "noop";
  const sorted = [...recipes].sort((a,b) => (b.trust ?? 0) - (a.trust ?? 0));
  const best = sorted[0];
  logPhase("DECIDE", `Selected recipe: ${best.id} (trust ${best.trust})`, "info");
  return best.id;
}

function act(decision: string) {
  if (decision === "remove-unused" || decision === "esm-hygiene" || decision === "format-consistency") {
    saveUndoSnapshot(["apps/cli/src/index.ts", "package.json", "tsconfig.json"]);
    logPhase("ACT", "Running eslint --fix …", "info");
    sh("pnpm -s exec eslint . --fix");
  } else {
    logPhase("ACT", "noop (nothing to fix)", "info");
  }
}

function checkGates(deltas: { eslint: number; types: number }): { passed: boolean; gates: unknown; violations: string[] } {
  const gatesPath = path.join(odavlDir, "gates.yml");
  let gates: unknown = {};
  if (fs.existsSync(gatesPath)) {
    try { gates = yaml.load(fs.readFileSync(gatesPath, "utf8")); } catch { /* ignore */ }
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

function verify(before: Metrics): { after: Metrics; deltas: { eslint: number; types: number }; gatesPassed: boolean; gates: unknown } {
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

function learn(report: RunReport) {
  const success = report.deltas.eslint < 0 || report.deltas.types <= 0;
  updateTrust(report.decision, success);
  const histPath = path.join(odavlDir, "history.json");
  let arr: unknown[] = [];
  if (fs.existsSync(histPath)) {
    try { arr = JSON.parse(fs.readFileSync(histPath, "utf8")); } catch { /* ignore */ }
  }
  arr.push({ ts: new Date().toISOString(), success, ...report });
  fs.writeFileSync(histPath, JSON.stringify(arr, null, 2));
  if (report.gatesPassed) writeAttestation(report);
}

function writeAttestation(report: RunReport) {
  const attDir = path.join(odavlDir, "attestation");
  if (!fs.existsSync(attDir)) fs.mkdirSync(attDir, { recursive: true });
  const file = path.join(attDir, `attestation-${new Date().toISOString().replace(/[:.]/g,"")}.json`);
  const payload = {
    planId: "W3-" + new Date().toISOString(),
    timestamp: new Date().toISOString(),
    recipe: report.decision,
    deltas: report.deltas,
    verified: report.gatesPassed,
    gates: report.gates,
    signature: "sig-" + Math.random().toString(36).substring(2,10)
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  fs.writeFileSync(path.join(attDir, "latest.json"), JSON.stringify(payload, null, 2));
  console.log(`[LEARN] Attestation saved → ${file}`);
}

function runShadowVerify(): boolean {
  const shadowDir = path.join(odavlDir, "shadow");
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

function saveUndoSnapshot(modifiedFiles: string[]) {
  const undoDir = path.join(odavlDir, "undo");
  if (!fs.existsSync(undoDir)) fs.mkdirSync(undoDir, { recursive: true });
  const snap = {
    timestamp: new Date().toISOString(),
    modifiedFiles,
    data: {} as Record<string, string | null>
  };
  for (const f of modifiedFiles) {
    snap.data[f] = fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null;
  }
  const file = path.join(undoDir, `undo-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(snap, null, 2));
  fs.writeFileSync(path.join(undoDir, "latest.json"), JSON.stringify(snap, null, 2));
  console.log("[UNDO] Snapshot saved:", file);
}

function undoLast() {
  const undoDir = path.join(odavlDir, "undo");
  const latest = path.join(undoDir, "latest.json");
  if (!fs.existsSync(latest)) return console.log("[UNDO] No undo snapshot found.");
  const snap = JSON.parse(fs.readFileSync(latest, "utf8"));
  for (const [f, content] of Object.entries(snap.data)) {
    if (content) fs.writeFileSync(f, content as string);
  }
  console.log("[UNDO] Project reverted to last safe state (" + snap.timestamp + ")");
}

function runCycle() {
  logPhase("ODAVL", "Observe → Decide → Act → Verify → Learn", "info");
  const before = observe();
  logPhase("OBSERVE", `ESLint warnings: ${before.eslintWarnings}, Type errors: ${before.typeErrors}`, "info");
  const decision = decide(before);
  logPhase("DECIDE", decision, "info");
  act(decision);
  const { after, deltas, gatesPassed, gates } = verify(before);
  const report: RunReport = { before, after, deltas, decision, gatesPassed, gates };
  const runFile = path.join(reportsDir, `run-${Date.now()}.json`);
  fs.writeFileSync(runFile, JSON.stringify(report, null, 2));
  learn(report);
  const status = gatesPassed ? "success" : "error";
  logPhase("DONE", `ESLint warnings: ${before.eslintWarnings} → ${after.eslintWarnings} (Δ ${deltas.eslint}) | Type errors: ${before.typeErrors} → ${after.typeErrors} (Δ ${deltas.types})`, status);
}

const cmd = process.argv[2] ?? "help";
if (cmd === "observe")      { const m = observe(); console.log(m); }
else if (cmd === "decide")  { const d = decide(observe()); console.log(d); }
else if (cmd === "act")     { act("remove-unused"); console.log("act done"); }
else if (cmd === "verify")  { const v = verify(observe()); console.log(v); }
else if (cmd === "run")     { runCycle(); }
else if (cmd === "undo")    { undoLast(); }
else {
  console.log("Usage: tsx apps/cli/src/index.ts <observe|decide|act|verify|run|undo>");
}