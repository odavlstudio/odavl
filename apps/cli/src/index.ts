import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

type Metrics = { eslintWarnings: number; typeErrors: number; timestamp: string };
type RunReport = {
  before: Metrics;
  after: Metrics;
  deltas: { eslint: number; types: number };
  decision: "remove-unused" | "noop";
};

const ROOT = process.cwd();
const reportsDir = path.join(ROOT, "reports");
const odavlDir = path.join(ROOT, ".odavl");

function sh(cmd: string): { out: string; err: string } {
  try {
    const out = execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString();
    return { out, err: "" };
  } catch (e: any) {
    const out = e?.stdout?.toString?.() ?? "";
    const err = e?.stderr?.toString?.() ?? "";
    return { out, err };
  }
}

function ensureDirs() {
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  if (!fs.existsSync(odavlDir)) fs.mkdirSync(odavlDir, { recursive: true });
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
  } catch (_) {
    // If parsing fails, fallback to 0 warnings
  }

  // TypeScript noEmit
  const tscRes = sh("pnpm -s exec tsc -p tsconfig.json --noEmit");
  const typeErrors = (tscRes.out + tscRes.err).match(/error TS\d+/g)?.length ?? 0;

  const metrics: Metrics = { eslintWarnings, typeErrors, timestamp: new Date().toISOString() };
  fs.writeFileSync(path.join(reportsDir, `observe-${Date.now()}.json`), JSON.stringify(metrics, null, 2));
  return metrics;
}

function decide(m: Metrics): "remove-unused" | "noop" {
  return m.eslintWarnings > 0 ? "remove-unused" : "noop";
}

function act(decision: "remove-unused" | "noop") {
  if (decision === "remove-unused") {
    console.log("[ACT] Running eslint --fix …");
    sh("pnpm -s exec eslint . --fix");
  } else {
    console.log("[ACT] noop (nothing to fix)");
  }
}

function verify(before: Metrics): { after: Metrics; deltas: { eslint: number; types: number } } {
  const after = observe();
  const deltas = {
    eslint: after.eslintWarnings - before.eslintWarnings,
    types: after.typeErrors - before.typeErrors
  };
  const verify = { after, deltas };
  fs.writeFileSync(path.join(reportsDir, `verify-${Date.now()}.json`), JSON.stringify(verify, null, 2));
  return verify;
}

function learn(report: RunReport) {
  const histPath = path.join(odavlDir, "history.json");
  let arr: any[] = [];
  if (fs.existsSync(histPath)) {
    try { arr = JSON.parse(fs.readFileSync(histPath, "utf8")); } catch {}
  }
  arr.push({ ts: new Date().toISOString(), ...report });
  fs.writeFileSync(histPath, JSON.stringify(arr, null, 2));
}

function runCycle() {
  console.log("[ODAVL] Observe → Decide → Act → Verify → Learn");
  const before = observe();
  const decision = decide(before);
  console.log("[DECIDE]", decision);
  act(decision);
  const { after, deltas } = verify(before);
  const report: RunReport = { before, after, deltas, decision };
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