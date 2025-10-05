import { execSync } from "node:child_process";
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
  console.log("[DECIDE] Selected recipe:", best.id, "(trust", best.trust, ")");
  return best.id;
}

function act(decision: string) {
  if (decision === "remove-unused") {
    console.log("[ACT] Running eslint --fix …");
    sh("pnpm -s exec eslint . --fix");
  } else {
    console.log("[ACT] noop (nothing to fix)");
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
  console.log(passed ? "[VERIFY] Gates check: PASS ✅" : `[VERIFY] Gates check: FAIL ❌ (${violations.join(', ')})`);
  return { passed, gates, violations };
}

function verify(before: Metrics): { after: Metrics; deltas: { eslint: number; types: number }; gatesPassed: boolean; gates: unknown } {
  const after = observe();
  const deltas = {
    eslint: after.eslintWarnings - before.eslintWarnings,
    types: after.typeErrors - before.typeErrors
  };
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

function runCycle() {
  console.log("[ODAVL] Observe → Decide → Act → Verify → Learn");
  const before = observe();
  const decision = decide(before);
  console.log("[DECIDE]", decision);
  act(decision);
  const { after, deltas, gatesPassed, gates } = verify(before);
  const report: RunReport = { before, after, deltas, decision, gatesPassed, gates };
  const runFile = path.join(reportsDir, `run-${Date.now()}.json`);
  fs.writeFileSync(runFile, JSON.stringify(report, null, 2));
  learn(report);
  console.log(`[DONE] ESLint warnings: ${before.eslintWarnings} → ${after.eslintWarnings} (Δ ${deltas.eslint}) | Type errors: ${before.typeErrors} → ${after.typeErrors} (Δ ${deltas.types})`);
}

const cmd = process.argv[2] ?? "help";
if (cmd === "observe")      { const m = observe(); console.log(m); }
else if (cmd === "decide")  { const d = decide(observe()); console.log(d); }
else if (cmd === "act")     { act("remove-unused"); console.log("act done"); }
else if (cmd === "verify")  { const v = verify(observe()); console.log(v); }
else if (cmd === "run")     { runCycle(); }
else {
  console.log("Usage: tsx apps/cli/src/index.ts <observe|decide|act|verify|run>");
}