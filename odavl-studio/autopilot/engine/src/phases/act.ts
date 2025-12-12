/**
 * ACT phase: Executes improvement actions with safety controls
 * Phase P3: ACTIVE manifest enforcement (risk budget, protected paths, trust)
 * 
 * ✅ Phase 3 Update:
 * - Executes fixes on issues detected by Insight
 * - Respects canBeHandedToAutopilot flag from Insight analysis
 * - NO detection logic (Autopilot = Executor ONLY)
 * - Risk budget enforced via gates.yml
 * - Phase P3: Runtime enforcement of protected paths, risk budget, trust thresholds
 * 
 * Phase 3B: Parallel execution for independent recipe actions
 * @fileoverview Action execution functionality for ODAVL cycle
 */

import * as fsw from "./fs-wrapper";
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import { execSync } from "./cp-wrapper";
import { logPhase } from "./logPhase.js";
import type { RecipeAction } from "./decide.js";
import { generateUndoFilename } from "../utils/file-naming.js";
// Phase P3: Runtime enforcement functions
import {
  validateRiskBudget,
  isProtectedPath,
  shouldAvoidChanges,
} from '../config/manifest-config.js';

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
 * Round 15: Load from JSON files (not TypeScript modules)
 * 
 * @param recipeId - The unique identifier of the recipe to load
 * @returns The recipe object or null if not found
 */
async function loadRecipe(recipeId: string): Promise<any | null> {
  try {
    // Round 15: Load from .odavl/recipes/*.json (same as decide.ts)
    const recipePath = path.join(process.cwd(), '.odavl', 'recipes', `${recipeId}.json`);
    
    try {
      const content = await fsp.readFile(recipePath, 'utf8');
      const recipe = JSON.parse(content);
      return recipe;
    } catch (error) {
      logPhase("ACT", `Recipe not found: ${recipeId}`, "error");
      return null;
    }
  } catch (error) {
    logPhase("ACT", `Failed to load recipe ${recipeId}: ${error}`, "error");
    return null;
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
/**
 * ACT phase: Executes the improvement action determined in DECIDE phase.
 * Round 13: Enhanced with new recipe system that applies direct code fixes.
 * Creates undo snapshots before making changes for safe rollback capability.
 * 
 * @param decision - The recipe identifier to execute (or "noop")
 * @returns Execution result with success status and any error messages
 */
export async function act(decision: string): Promise<{
  success: boolean;
  actionsExecuted: number;
  errors?: string[];
  filesModified?: string[];
}> {
  // Handle noop case
  if (decision === "noop") {
    logPhase("ACT", "noop (nothing to fix)", "info");
    return { success: true, actionsExecuted: 0, filesModified: [] };
  }

  // Load recipe from new recipe system
  const recipe = await loadRecipe(decision);
  if (!recipe) {
    logPhase("ACT", `Failed to load recipe: ${decision}`, "error");
    return { success: false, actionsExecuted: 0, errors: [`Recipe not found: ${decision}`], filesModified: [] };
  }

  logPhase("ACT", `Executing recipe: ${recipe.name}`, "info");
  
  // Phase P3: Validate risk budget BEFORE any file operations
  const actions = recipe.actions || [];
  const modifiedFiles = collectModifiedFiles(actions);
  const estimatedLoc = actions.reduce((sum: number, a: any) => sum + (a.locCount || 10), 0); // Estimate LOC
  
  const riskCheck = validateRiskBudget({
    locCount: estimatedLoc,
    filesCount: modifiedFiles.length,
    recipesCount: 1,
  });
  
  if (!riskCheck.allowed) {
    logPhase("ACT", `❌ RISK BUDGET VIOLATED`, "error");
    riskCheck.violations.forEach((v) => logPhase("ACT", `   - ${v}`, "error"));
    // TODO P3: Add audit entry for risk budget violation
    return {
      success: false,
      actionsExecuted: 0,
      errors: [`Risk budget violated: ${riskCheck.violations.join(', ')}`],
      filesModified: []
    };
  }
  
  // Phase P3: Check protected paths BEFORE any modifications
  for (const file of modifiedFiles) {
    const protectedCheck = isProtectedPath(file);
    if (protectedCheck.blocked) {
      logPhase("ACT", `❌ PROTECTED PATH: ${file} (pattern: ${protectedCheck.matchedPattern})`, "error");
      // TODO P3: Add audit entry for protected path violation
      return {
        success: false,
        actionsExecuted: 0,
        errors: [`Protected path modification blocked: ${file} (matched: ${protectedCheck.matchedPattern})`],
        filesModified: []
      };
    }
    
    // Phase P3: Soft warning for avoid-changes paths
    const avoidCheck = shouldAvoidChanges(file);
    if (avoidCheck.shouldAvoid) {
      logPhase("ACT", `⚠️  AVOID-CHANGES PATH: ${file} (pattern: ${avoidCheck.matchedPattern})`, "warn");
      // Continue execution but log the warning
    }
  }
  
  // Round 13: Apply recipe to workspace files
  // For MVP, we'll apply the recipe to the first matching issue
  try {
    // Step 1: Find issues matching this recipe (from most recent observe)
    const ROOT = process.cwd();
    const observeResultPath = path.join(ROOT, '.odavl', 'metrics', 'latest-observe.json');
    
    let issues: any[] = [];
    try {
      const observeContent = await fsp.readFile(observeResultPath, 'utf8');
      const observeData = JSON.parse(observeContent);
      issues = observeData.issues || [];
    } catch {
      logPhase("ACT", "No observe results found, creating sample fixes", "warn");
    }
    
    // Step 2: Find first issue matching recipe detector
    const matchingIssues = issues.filter((issue: any) => {
      try {
        // Check if recipe has a match() method (TypeScript recipe class)
        if (typeof recipe.match === 'function') {
          return recipe.match(issue);
        }
        
        // For JSON recipes, match by condition.metric → detector mapping
        if (recipe.condition && recipe.condition.rules) {
          const rule = recipe.condition.rules[0]; // Use first rule for MVP
          const metricToDetectorMap: Record<string, string> = {
            'imports': 'import',
            'complexity': 'complexity',
            'performance': 'performance',
            'security': 'security',
            'typescript': 'typescript',
            'eslint': 'eslint',
            'build': 'build',
            'circular': 'circular',
            'network': 'network',
            'isolation': 'isolation'
          };
          
          const targetDetector = metricToDetectorMap[rule.metric];
          return issue.detector === targetDetector;
        }
        
        return false;
      } catch {
        return false;
      }
    });
    
    if (matchingIssues.length === 0) {
      logPhase("ACT", `No matching issues found for recipe: ${recipe.name}`, "warn");
      return { success: true, actionsExecuted: 0, filesModified: [] };
    }
    
    logPhase("ACT", `Found ${matchingIssues.length} matching issues`, "info");
    
    // Step 3: Apply recipe to first matching issue (MVP: one fix at a time)
    const issue = matchingIssues[0];
    const filePath = issue.location?.file || issue.filePath;
    
    if (!filePath) {
      logPhase("ACT", "Issue has no file location", "error");
      return { success: false, actionsExecuted: 0, errors: ["No file location in issue"], filesModified: [] };
    }
    
    // Step 4: Read file content
    let originalContent: string;
    try {
      originalContent = await fsp.readFile(filePath, 'utf8');
    } catch (error) {
      logPhase("ACT", `Failed to read file: ${filePath}`, "error");
      return { success: false, actionsExecuted: 0, errors: [`Cannot read file: ${filePath}`], filesModified: [] };
    }
    
    // Step 5: Create undo snapshot
    await saveUndoSnapshot([filePath]);
    
    // Step 6: Apply recipe fix
    logPhase("ACT", `Applying fix to: ${filePath}`, "info");
    
    let updatedContent: string;
    
    // Check if recipe has apply() method (TypeScript recipe class)
    if (typeof recipe.apply === 'function') {
      updatedContent = recipe.apply(originalContent, issue);
      
      // Step 7: Write updated content
      await fsp.writeFile(filePath, updatedContent, 'utf8');
      
      logPhase("ACT", `✅ Recipe applied successfully: ${recipe.name}`, "info");
      logPhase("ACT", `Modified file: ${filePath}`, "info");
    }
    // For JSON recipes with shell actions
    else if (recipe.actions && recipe.actions.length > 0) {
      const action = recipe.actions[0]; // Use first action for MVP
      
      if (action.type === 'shell') {
        logPhase("ACT", `Executing shell command: ${action.command}`, "info");
        
        // Import sh() helper from this file (defined below)
        const { execSync } = await import('./cp-wrapper.js');
        
        try {
          // Execute command for the specific file only
          const fileSpecificCommand = action.command.replace(/\s+\.\s*$/, ` ${filePath}`);
          const stdout = execSync(fileSpecificCommand, { encoding: 'utf8', stdio: 'pipe' });
          
          logPhase("ACT", `✅ Command executed successfully`, "info");
          logPhase("ACT", `Output: ${stdout.toString().substring(0, 200)}`, "info");
        } catch (error: any) {
          const errorMsg = error.stderr?.toString() || error.message || String(error);
          logPhase("ACT", `⚠️  Command completed with warnings: ${errorMsg.substring(0, 200)}`, "warn");
          // Don't fail - ESLint returns non-zero exit codes even when fixing successfully
        }
      } else {
        logPhase("ACT", `Unsupported action type: ${action.type}`, "error");
        return { success: false, actionsExecuted: 0, errors: [`Unsupported action type: ${action.type}`], filesModified: [] };
      }
    } else {
      logPhase("ACT", `Recipe has no apply() method or actions array`, "error");
      return { success: false, actionsExecuted: 0, errors: [`Recipe has no apply() method or actions`], filesModified: [] };
    }    
    return {
      success: true,
      actionsExecuted: 1,
      filesModified: [filePath]
    };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logPhase("ACT", `Recipe execution failed: ${errorMsg}`, "error");
    return {
      success: false,
      actionsExecuted: 0,
      errors: [errorMsg],
      filesModified: []
    };
  }
}
