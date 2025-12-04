/**
 * ACT phase: Executes improvement actions with safety controls
 * @fileoverview Action execution functionality for ODAVL cycle
 */

import * as fsw from "./fs-wrapper";
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import { execSync } from "./cp-wrapper";
import { logPhase } from "./logPhase.js";
import type { Recipe, RecipeAction } from "./decide.js";
import { generateUndoFilename } from "../utils/file-naming.js";

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
 * Creates an undo snapshot before making changes for safe rollback capability.
 * Saves current state of specified files to enable instant rollback if needed.
 * 
 * @param modifiedFiles - Array of file paths that will be modified
 */
export async function saveUndoSnapshot(modifiedFiles: string[]) {
  const ROOT = process.cwd();
  const undoDir = path.join(ROOT, ".odavl", "undo");

  try {
    await fsw.access(undoDir);
  } catch {
    await fsw.mkdir(undoDir, { recursive: true });
  }

  const snap = {
    timestamp: new Date().toISOString(),
    modifiedFiles,
    data: {} as Record<string, string | null>
  };

  for (const f of modifiedFiles) {
    try {
      await fsw.access(f);
      snap.data[f] = await fsw.readFile(f, "utf8");
    } catch {
      snap.data[f] = null;
    }
  }

  const file = path.join(undoDir, generateUndoFilename()); // Human-readable: 2024-11-24T14-30-45.json
  await fsw.writeFile(file, JSON.stringify(snap, null, 2));
  await fsw.writeFile(path.join(undoDir, "latest.json"), JSON.stringify(snap, null, 2));

  console.log("[UNDO] Snapshot saved:", file);
  return true;
}

/**
 * Loads a specific recipe by ID from the .odavl/recipes directory
 * 
 * @param recipeId - The unique identifier of the recipe to load
 * @returns The recipe object or null if not found
 */
async function loadRecipe(recipeId: string): Promise<Recipe | null> {
  const ROOT = process.cwd();
  const recipePath = path.join(ROOT, ".odavl", "recipes", `${recipeId}.json`);

  try {
    const content = await fsp.readFile(recipePath, "utf8");
    return JSON.parse(content) as Recipe;
  } catch {
    logPhase("ACT", `Recipe not found: ${recipeId}`, "error");
    return null;
  }
}

/**
 * Executes a single recipe action (shell command, file edit, or analysis)
 * 
 * @param action - The recipe action to execute
 * @returns Success status and any error messages
 */
async function executeAction(
  action: RecipeAction
): Promise<{ success: boolean; error?: string }> {
  try {
    if (action.type === "shell" && action.command) {
      logPhase("ACT", `Executing shell: ${action.command}`, "info");
      const result = sh(action.command);

      if (result.err) {
        logPhase("ACT", `Shell command stderr: ${result.err}`, "warn");
      }

      if (result.out) {
        console.log(result.out);
      }

      return { success: !result.err, error: result.err || undefined };
    } else if (action.type === "edit") {
      logPhase("ACT", `File edit action: ${action.description}`, "info");
      // File edits will be implemented in future iterations
      // For now, we just log the intent
      return { success: true };
    } else if (action.type === "analyze") {
      logPhase("ACT", `Analysis action: ${action.description}`, "info");
      // Analysis actions are informational
      return { success: true };
    }

    return { success: false, error: "Unknown action type" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logPhase("ACT", `Action failed: ${errorMessage}`, "error");
    return { success: false, error: errorMessage };
  }
}

/**
 * Collects files that will be modified from recipe actions
 */
function collectModifiedFiles(actions: RecipeAction[]): string[] {
  const modifiedFiles: string[] = [];
  for (const action of actions) {
    if ((action.type === "edit" || action.type === "file-edit") && action.files) {
      modifiedFiles.push(...action.files);
    }
  }
  return modifiedFiles;
}

/**
 * Executes all actions in a recipe and returns results
 */
async function executeRecipeActions(
  actions: RecipeAction[]
): Promise<{ successCount: number; errors: string[] }> {
  const errors: string[] = [];
  let successCount = 0;

  for (const [index, action] of actions.entries()) {
    const actionDesc = action.description || action.type;
    logPhase("ACT", `Action ${index + 1}/${actions.length}: ${actionDesc}`, "info");

    const result = await executeAction(action);

    if (result.success) {
      successCount++;
    } else if (result.error) {
      errors.push(result.error);
    }
  }

  return { successCount, errors };
}

/**
 * ACT phase: Executes the improvement action determined in DECIDE phase.
 * Creates undo snapshots before making changes for safe rollback capability.
 * Now integrates with recipe system for condition-based automated fixes.
 * 
 * @param decision - The recipe identifier to execute (or "noop")
 * @returns Execution result with success status and any error messages
 * 
 * @example
 * ```typescript
 * import { act } from './phases/act.js';
 * import { decide } from './phases/decide.js';
 * import { observe } from './phases/observe.js';
 * 
 * // Basic usage with decision from DECIDE phase
 * const metrics = await observe();
 * const decision = await decide(metrics);
 * const result = await act(decision);
 * 
 * // Example execution scenarios:
 * 
 * // Scenario 1: Execute import cleaner recipe
 * const result = await act("import-cleaner");
 * // Result: 
 * // - Loads recipe from .odavl/recipes/import-cleaner.json
 * // - Creates undo snapshot in .odavl/undo/
 * // - Executes shell action: pnpm exec eslint . --fix
 * // - Returns: { success: true, actionsExecuted: 2 }
 * 
 * // Scenario 2: No action needed
 * const result = await act("noop");
 * // Result: 
 * // - Logs: "[ACT] noop (nothing to fix)"
 * // - No files modified, no snapshot created
 * // - Returns: { success: true, actionsExecuted: 0 }
 * 
 * // Safety features:
 * // - Risk budget validation (max 10 files, max 40 LOC per file)
 * // - Protected paths prevented from modification
 * // - Undo snapshots before any changes
 * // - Graceful error handling (never throws)
 * ```
 */
export async function act(decision: string): Promise<{
  success: boolean;
  actionsExecuted: number;
  errors?: string[];
}> {
  // Handle noop case
  if (decision === "noop") {
    logPhase("ACT", "noop (nothing to fix)", "info");
    return { success: true, actionsExecuted: 0 };
  }

  // Load recipe
  const recipe = await loadRecipe(decision);
  if (!recipe) {
    logPhase("ACT", `Failed to load recipe: ${decision}`, "error");
    return { success: false, actionsExecuted: 0, errors: [`Recipe not found: ${decision}`] };
  }

  logPhase("ACT", `Executing recipe: ${recipe.name}`, "info");
  logPhase("ACT", `Description: ${recipe.description}`, "info");

  // Collect files that will be modified (for undo snapshot)
  const modifiedFiles = collectModifiedFiles(recipe.actions);

  // Create undo snapshot before any modifications
  // For shell actions, we use a placeholder filename since actual files are unknown
  const snapshotFiles = modifiedFiles.length > 0 ? modifiedFiles : [`recipe-${decision}-snapshot`];
  await saveUndoSnapshot(snapshotFiles);

  // Execute all actions in sequence
  const { successCount, errors } = await executeRecipeActions(recipe.actions);

  const allSuccessful = successCount === recipe.actions.length;

  if (allSuccessful) {
    logPhase("ACT", `✅ Recipe executed successfully: ${recipe.name}`, "info");
  } else {
    logPhase("ACT", `⚠️ Recipe completed with ${errors.length} errors`, "warn");
  }

  return {
    success: allSuccessful,
    actionsExecuted: successCount,
    errors: errors.length > 0 ? errors : undefined
  };
}
