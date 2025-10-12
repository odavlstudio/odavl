/**
 * DECIDE phase: Selects improvement actions based on trust scores
 * @fileoverview Decision-making functionality for ODAVL cycle
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { Metrics } from "./observe.js";

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
 * DECIDE phase: Selects the most appropriate improvement action based on trust scores.
 * Chooses the highest-trust recipe from available options. Returns "noop" if no recipes exist.
 * 
 * @param _m - Current metrics (unused in basic implementation, reserved for future ML)
 * @returns String identifier of the selected recipe or "noop"
 */
export function decide(_m: Metrics): string {
  const recipes = loadRecipes();
  if (!recipes.length) return "noop";
  
  const sorted = [...recipes].sort((a, b) => (b.trust ?? 0) - (a.trust ?? 0));
  const best = sorted[0];
  
  logPhase("DECIDE", `Selected recipe: ${best.id} (trust ${best.trust})`, "info");
  return best.id;
}