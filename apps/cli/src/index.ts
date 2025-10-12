#!/usr/bin/env node

/**
 * @fileoverview ODAVL CLI - Main orchestrator for the Observe-Decide-Act-Verify-Learn cycle
 * 
 * This is the main entry point for the ODAVL CLI system. It has been refactored into a modular
 * architecture with separate phase modules while preserving exact functionality. The CLI supports
 * both human-readable output and JSON mode for VS Code extension integration.
 * 
 * @author ODAVL Team
 * @version 2.0.0 - Modular Architecture
 */

import * as fs from "node:fs";
import * as path from "node:path";
// Node.js built-in modules - only import what we use

// Import modular phase implementations
import { observe } from './phases/observe.js';
import { decide } from './phases/decide.js';
import { act } from './phases/act.js';
import { verify } from './phases/verify.js';
import { learn } from './phases/learn.js';

// Import utility functions
import { logPhase, undoLast } from './utils/core-utils.js';
import { launchDashboard } from './utils/dashboard.js';

// Constants
const ROOT = process.cwd();
const reportsDir = path.join(ROOT, "reports");

/**
 * Executes the complete ODAVL cycle: Observe → Decide → Act → Verify → Learn.
 * This is the main entry point for autonomous code quality improvement.
 * Creates comprehensive reports and maintains audit trails throughout the process.
 * 
 * @description This function orchestrates all ODAVL phases with performance tracking,
 * error handling, and comprehensive reporting. Each phase is timed and logged for
 * monitoring and debugging purposes.
 */
function runCycle(): void {
  const perfStart = performance.now();
  logPhase("ODAVL", "Observe → Decide → Act → Verify → Learn", "info");
  
  // OBSERVE phase with timing
  const observeStart = performance.now();
  const before = observe();
  const observeTime = performance.now() - observeStart;
  logPhase("OBSERVE", `ESLint warnings: ${before.eslintWarnings}, Type errors: ${before.typeErrors} (${observeTime.toFixed(1)}ms)`, "info");
  
  // DECIDE phase with timing
  const decideStart = performance.now();
  const decision = decide(before);
  const decideTime = performance.now() - decideStart;
  logPhase("DECIDE", `${decision} (${decideTime.toFixed(1)}ms)`, "info");
  
  // ACT phase with timing
  const actStart = performance.now();
  act(decision);
  const actTime = performance.now() - actStart;
  logPhase("ACT", `Completed (${actTime.toFixed(1)}ms)`, "info");
  
  // VERIFY phase with timing  
  const verifyStart = performance.now();
  const verificationResult = verify(before);
  const verifyTime = performance.now() - verifyStart;
  logPhase("VERIFY", `Gates ${verificationResult.gatesPassed ? "PASSED" : "FAILED"} (${verifyTime.toFixed(1)}ms)`, verificationResult.gatesPassed ? "success" : "error");
  
  // LEARN phase with timing
  const learnStart = performance.now();
  const after = observe(); // Get post-action metrics
  const deltas = {
    eslint: after.eslintWarnings - before.eslintWarnings,
    types: after.typeErrors - before.typeErrors
  };
  
  const report = {
    before,
    after,
    deltas,
    decision,
    gatesPassed: verificationResult.gatesPassed,
    gates: verificationResult.gates
  };
  
  learn(report);
  const learnTime = performance.now() - learnStart;
  logPhase("LEARN", `Trust scores updated (${learnTime.toFixed(1)}ms)`, "info");
  
  // Performance metrics
  const totalTime = performance.now() - perfStart;
  const perfMetrics = {
    totalTime: Math.round(totalTime),
    phases: {
      observe: Math.round(observeTime),
      decide: Math.round(decideTime),
      act: Math.round(actTime),
      verify: Math.round(verifyTime),
      learn: Math.round(learnTime)
    },
    timestamp: new Date().toISOString()
  };
  
  // Save performance data
  const perfDir = path.join(reportsDir, "performance");
  if (!fs.existsSync(perfDir)) fs.mkdirSync(perfDir, { recursive: true });
  const perfFile = path.join(perfDir, "cli.json");
  fs.writeFileSync(perfFile, JSON.stringify(perfMetrics, null, 2));
  
  // Save run report
  const runFile = path.join(reportsDir, `run-${Date.now()}.json`);
  fs.writeFileSync(runFile, JSON.stringify(report, null, 2));
  
  const status = verificationResult.gatesPassed ? "success" : "error";
  logPhase("DONE", `ESLint warnings: ${before.eslintWarnings} → ${after.eslintWarnings} (Δ ${deltas.eslint}) | Type errors: ${before.typeErrors} → ${after.typeErrors} (Δ ${deltas.types}) | Total: ${totalTime.toFixed(1)}ms`, status);
}

/**
 * Main CLI command dispatcher
 * 
 * @description Handles command-line arguments and routes to appropriate functions.
 * Supports individual phase execution, full cycle runs, and utility commands.
 */
function main(): void {
  const cmd = process.argv[2] ?? "help";
  
  try {
    switch (cmd) {
      case "observe": {
        const metrics = observe();
        console.log(JSON.stringify(metrics, null, 2));
        break;
      }
      case "decide": {
        const metrics = observe();
        const decision = decide(metrics);
        console.log(decision);
        break;
      }
      case "act": {
        act("remove-unused");
        console.log("Act completed");
        break;
      }
      case "verify": {
        const metrics = observe();
        const result = verify(metrics);
        console.log(JSON.stringify(result, null, 2));
        break;
      }
      case "run": {
        runCycle();
        break;
      }
      case "undo": {
        undoLast();
        break;
      }
      case "dashboard": {
        launchDashboard();
        break;
      }
      case "help":
      default: {
        console.log("Usage: pnpm odavl:run | pnpm odavl:<command> <observe|decide|act|verify|run|undo|dashboard>");
        console.log("");
        console.log("Commands:");
        console.log("  observe    - Collect quality metrics");
        console.log("  decide     - Determine improvement action");
        console.log("  act        - Execute improvement");
        console.log("  verify     - Check quality gates");
        console.log("  run        - Execute full ODAVL cycle");
        console.log("  undo       - Rollback last changes");
        console.log("  dashboard  - Launch analytics dashboard");
        break;
      }
    }
  } catch (error) {
    logPhase("ERROR", `Command failed: ${error}`, "error");
    process.exit(1);
  }
}

// Execute main function
main();