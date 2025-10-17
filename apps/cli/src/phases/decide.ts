/**
 * DECIDE phase: Selects improvement actions based on trust scores
 * @fileoverview Decision-making functionality for ODAVL cycle with auto-approval integration
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { Metrics } from "./observe.js";
import { evaluateCommandApproval, logApprovalDecision } from "../policies/autoapprove.js";
import { logPhase } from "../utils/core-utils.js";

/**
 * Recipe configuration for automated improvements
 */
export interface Recipe {
  id: string;
  trust?: number;
  [key: string]: unknown;
}

/**
 * Trust tracking record for recipe performance
 */
export interface TrustRecord {
  id: string;
  runs: number;
  success: number;
  trust: number;
}


/**
 * Loads available improvement recipes from the .odavl/recipes directory.
 * Each recipe is a JSON file containing automation patterns with trust scores.
 * 
 * @returns Array of recipe objects with id, trust score, and configuration
 */
function loadRecipes(): Recipe[] {
  const ROOT = process.cwd();
  const odavlDir = path.join(ROOT, ".odavl");
  const rDir = path.join(odavlDir, "recipes");
  const list: Recipe[] = [];

  if (fs.existsSync(rDir)) {
    for (const f of fs.readdirSync(rDir)) {
      const fp = path.join(rDir, f);
      try {
        list.push(JSON.parse(fs.readFileSync(fp, "utf8")));
      } catch {
        /* ignore malformed recipe files */
      }
    }
  }
  return list;
}

/**
 * Updates the trust score for a recipe based on execution success.
 * Trust scores range from 0.1 to 1.0, calculated as success_rate with safeguards.
 * Higher trust recipes are prioritized in the DECIDE phase.
 * 
 * @param recipeId - Unique identifier for the recipe
 * @param success - Whether the recipe execution was successful
 */
export function updateTrust(recipeId: string, success: boolean) {
  const ROOT = process.cwd();
  const trustPath = path.join(ROOT, ".odavl", "recipes-trust.json");
  let arr: TrustRecord[] = [];

  if (fs.existsSync(trustPath)) {
    try {
      arr = JSON.parse(fs.readFileSync(trustPath, "utf8"));
    } catch {
      /* ignore malformed trust file */
    }
  }

  let r = arr.find((x) => x.id === recipeId);
  if (!r) {
    r = { id: recipeId, runs: 0, success: 0, trust: 0.8 };
    arr.push(r);
  }

  r.runs++;
  if (success) r.success++;
  r.trust = Math.max(0.1, Math.min(1, r.success / r.runs));

  fs.writeFileSync(trustPath, JSON.stringify(arr, null, 2));
}

/**
 * Evaluates if a command should be auto-approved based on safety policies
 * 
 * @param command - The command to evaluate
 * @returns Approval decision with enhanced logging
 */
export function evaluateCommand(command: string): boolean {
  const result = evaluateCommandApproval(command);
  logApprovalDecision(command, result, "DECIDE");

  return result.approved;
}

/**
 * DECIDE phase: Selects the most appropriate improvement action based on trust scores.
 * Chooses the highest-trust recipe from available options. Returns "noop" if no recipes exist.
 * Now includes auto-approval evaluation for enhanced safety logging.
 * 
 * @param _m - Current metrics (unused in basic implementation, reserved for future ML)
 * @returns String identifier of the selected recipe or "noop"
 * 
 * @example
 * ```typescript
 * import { decide, evaluateCommand } from './phases/decide.js';
 * import { observe } from './phases/observe.js';
 * 
 * // Basic usage with current metrics
 * const currentMetrics = observe();
 * const decision = decide(currentMetrics);
 * console.log(`Selected action: ${decision}`);
 * 
 * // Command approval evaluation
 * const approved = evaluateCommand("pnpm list");
 * console.log(`Command approved: ${approved}`);
 * 
 * // Example scenarios:
 * 
 * // Scenario 1: High-trust recipe available
 * // .odavl/recipes/remove-unused.json: {"id": "remove-unused", "trust": 0.9}
 * // Result: "remove-unused"
 * 
 * // Scenario 2: Multiple recipes, chooses highest trust
 * // .odavl/recipes/format.json: {"id": "format-fix", "trust": 0.7}
 * // .odavl/recipes/unused.json: {"id": "remove-unused", "trust": 0.9}
 * // Result: "remove-unused" (higher trust score)
 * 
 * // Scenario 3: No recipes available
 * // .odavl/recipes/ directory empty or missing
 * // Result: "noop"
 * 
 * // Integration with ODAVL cycle
 * const metrics = observe();
 * const action = decide(metrics);
 * if (action !== "noop") {
 *   console.log(`Will execute: ${action}`);
 * } else {
 *   console.log("No action needed");
 * }
 * ```
 */
export function decide(_m: Metrics): string {
  const recipes = loadRecipes();
  if (!recipes.length) return "noop";

  const sorted = [...recipes].sort((a, b) => (b.trust ?? 0) - (a.trust ?? 0));
  const best = sorted[0];

  logPhase("DECIDE", `Selected recipe: ${best.id} (trust ${best.trust})`, "info");

  // Log auto-approval evaluation for demonstration
  // In real implementation, this would be used in the ACT phase
  evaluateCommand(`eslint --fix`);

  return best.id;
}
