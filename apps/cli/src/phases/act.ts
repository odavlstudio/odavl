/**
 * ACT phase: Executes improvement actions with safety controls
 * @fileoverview Action execution functionality for ODAVL cycle
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

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
 * Creates an undo snapshot before making changes for safe rollback capability.
 * Saves current state of specified files to enable instant rollback if needed.
 * 
 * @param modifiedFiles - Array of file paths that will be modified
 */
export function saveUndoSnapshot(modifiedFiles: string[]) {
  const ROOT = process.cwd();
  const undoDir = path.join(ROOT, ".odavl", "undo");
  
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

/**
 * ACT phase: Executes the improvement action determined in DECIDE phase.
 * Creates undo snapshots before making changes for safe rollback capability.
 * 
 * @param decision - The recipe identifier to execute
 * 
 * @example
 * ```typescript
 * import { act } from './phases/act.js';
 * import { decide } from './phases/decide.js';
 * import { observe } from './phases/observe.js';
 * 
 * // Basic usage with decision from DECIDE phase
 * const metrics = observe();
 * const decision = decide(metrics);
 * act(decision);
 * 
 * // Example execution scenarios:
 * 
 * // Scenario 1: Execute ESLint fixes
 * act("remove-unused");
 * // Result: 
 * // - Creates undo snapshot in .odavl/undo/
 * // - Runs `pnpm exec eslint . --fix`
 * // - Logs: "[ACT] Running eslint --fix …"
 * 
 * // Scenario 2: Execute formatting fixes  
 * act("format-consistency");
 * // Result:
 * // - Creates undo snapshot for safety
 * // - Runs ESLint with --fix flag
 * // - Automatically fixes formatting issues
 * 
 * // Scenario 3: No action needed
 * act("noop");
 * // Result: 
 * // - Logs: "[ACT] noop (nothing to fix)"
 * // - No files modified, no snapshot created
 * 
 * // Safety features demonstration:
 * // Before any changes, undo snapshot is saved:
 * // .odavl/undo/undo-1640995200000.json contains:
 * // {
 * //   "timestamp": "2025-01-12T10:30:00.000Z",
 * //   "modifiedFiles": ["apps/cli/src/index.ts", "package.json"],
 * //   "data": {
 * //     "apps/cli/src/index.ts": "original file content...",
 * //     "package.json": "original package.json content..."
 * //   }
 * // }
 * 
 * // Complete ODAVL integration:
 * const before = observe();
 * const decision = decide(before);
 * if (decision !== "noop") {
 *   console.log(`Executing action: ${decision}`);
 *   act(decision);
 *   console.log("Action completed - undo snapshot saved");
 * }
 * ```
 */
export function act(decision: string) {
  if (decision === "remove-unused" || decision === "esm-hygiene" || decision === "format-consistency") {
    saveUndoSnapshot(["apps/cli/src/index.ts", "package.json", "tsconfig.json"]);
    logPhase("ACT", "Running eslint --fix …", "info");
    sh("pnpm -s exec eslint . --fix");
  } else {
    logPhase("ACT", "noop (nothing to fix)", "info");
  }
}