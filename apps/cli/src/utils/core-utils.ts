/**
 * Core utilities for ODAVL CLI operations
 * @fileoverview Shared utility functions used across ODAVL phases
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
export function sh(cmd: string): { out: string; err: string } {
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
export function ensureDirs() {
  const ROOT = process.cwd();
  const reportsDir = path.join(ROOT, "reports");
  const odavlDir = path.join(ROOT, ".odavl");
  
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  if (!fs.existsSync(odavlDir)) fs.mkdirSync(odavlDir, { recursive: true });
}

/**
 * Logs a message for a specific ODAVL phase with optional status indication.
 * Supports both human-readable and JSON output modes for VS Code extension integration.
 * Optimized for low-latency streaming to reduce round-trip message delays.
 * 
 * @param phase - The ODAVL phase (OBSERVE, DECIDE, ACT, VERIFY, LEARN)
 * @param msg - The message to log
 * @param status - The message status level for color-coding
 */
export function logPhase(phase: string, msg: string, status: "info" | "success" | "error" = "info") {
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
 * Restores the project to the last saved undo snapshot.
 * Reads the latest undo snapshot and restores all files to their previous state.
 */
export function undoLast() {
  const ROOT = process.cwd();
  const undoDir = path.join(ROOT, ".odavl", "undo");
  const latest = path.join(undoDir, "latest.json");
  
  if (!fs.existsSync(latest)) {
    return console.log("[UNDO] No undo snapshot found.");
  }
  
  const snap = JSON.parse(fs.readFileSync(latest, "utf8"));
  
  for (const [f, content] of Object.entries(snap.data)) {
    if (content) fs.writeFileSync(f, content as string);
  }
  
  console.log("[UNDO] Project reverted to last safe state (" + snap.timestamp + ")");
}