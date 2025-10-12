/**
 * OBSERVE phase: Collects current code quality metrics
 * @fileoverview Core observation functionality for ODAVL cycle
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

/**
 * Code quality metrics collected during observation phase
 */
export interface Metrics {
  eslintWarnings: number;
  typeErrors: number;
  timestamp: string;
}

/**
 * Executes a shell command safely without throwing exceptions.
 * Returns both stdout and stderr for comprehensive error handling.
 * 
 * @param cmd - The shell command to execute
 * @returns Object containing stdout and stderr as strings
 */
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

/**
 * Ensures required ODAVL directories exist, creating them if necessary.
 * Creates both reports directory (for metrics) and .odavl directory (for configuration).
 */
function ensureDirs() {
  const ROOT = process.cwd();
  const reportsDir = path.join(ROOT, "reports");
  const odavlDir = path.join(ROOT, ".odavl");
  
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  if (!fs.existsSync(odavlDir)) fs.mkdirSync(odavlDir, { recursive: true });
}

/**
 * OBSERVE phase: Collects current code quality metrics from ESLint and TypeScript.
 * This is the first phase of the ODAVL cycle, establishing baseline measurements.
 * 
 * @returns Metrics object containing warning counts and timestamp
 * 
 * @example
 * ```typescript
 * import { observe } from './phases/observe.js';
 * 
 * // Basic usage - collect current code quality metrics
 * const metrics = observe();
 * console.log(`ESLint warnings: ${metrics.eslintWarnings}`);
 * console.log(`TypeScript errors: ${metrics.typeErrors}`);
 * console.log(`Collected at: ${metrics.timestamp}`);
 * 
 * // Example output:
 * // {
 * //   "eslintWarnings": 3,
 * //   "typeErrors": 0,
 * //   "timestamp": "2025-01-12T10:30:45.123Z"
 * // }
 * 
 * // Usage in ODAVL cycle
 * const before = observe();
 * // ... perform improvements ...
 * const after = observe();
 * const improvement = before.eslintWarnings - after.eslintWarnings;
 * console.log(`Improved by ${improvement} warnings`);
 * ```
 */
export function observe(): Metrics {
  ensureDirs();
  const ROOT = process.cwd();
  const reportsDir = path.join(ROOT, "reports");
  
  // ESLint JSON analysis
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

  // TypeScript compilation check
  const tscRes = sh("pnpm -s exec tsc -p tsconfig.json --noEmit");
  const typeErrors = (tscRes.out + tscRes.err).match(/error TS\d+/g)?.length ?? 0;

  const metrics: Metrics = { 
    eslintWarnings, 
    typeErrors, 
    timestamp: new Date().toISOString() 
  };
  
  // Save observation metrics
  fs.writeFileSync(
    path.join(reportsDir, `observe-${Date.now()}.json`), 
    JSON.stringify(metrics, null, 2)
  );
  
  return metrics;
}