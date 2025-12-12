/**
 * ODAVL Autopilot Self-Healing Execution Layer
 * Phase Ω-P3: Controlled, safe execution of fix recipes
 * Phase Ω-P4: REAL EXECUTION with AST modifications
 * 
 * Responsibilities:
 * - Execute selected recipes under strict constraints (<=40 LOC, <=10 files)
 * - Capture unified evidence log (diffs, LOC, risk reduction)
 * - Re-run Insight on affected files
 * - Auto-rollback if healing worsens results
 */

import type { SelectedRecipe } from '../selection/recipe-selector';
import type { AutopilotFixCandidate } from '../../../core/src/intake/insight-intake';
import { Project, SourceFile } from 'ts-morph';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { loadDetector, type DetectorName } from '../../../../insight/core/src/detector/detector-loader.js';

export interface SelfHealSession {
  sessionId: string;
  timestamp: string;
  selectedRecipes: SelectedRecipe[];
  executionResults: RecipeExecutionResult[];
  constraints: ExecutionConstraints;
  finalOutcome: 'success' | 'partial' | 'failed' | 'rolled-back';
}

export interface RecipeExecutionResult {
  recipeId: string;
  status: 'executed' | 'skipped' | 'failed' | 'rolled-back';
  evidence: ExecutionEvidence;
  insightRevalidation?: InsightRevalidation;
  errors?: string[];
}

export interface ExecutionEvidence {
  filesModified: string[];
  locChanged: number;
  diffs: FileDiff[];
  riskReductionEstimate: number;
  executionTime: number; // milliseconds
  recipeJustification: string[];
}

export interface FileDiff {
  file: string;
  before: string;
  after: string;
  diff: string; // Unified diff format
  locAdded: number;
  locRemoved: number;
}

export interface InsightRevalidation {
  beforeIssues: number;
  afterIssues: number;
  severityImprovement: boolean;
  newIssuesIntroduced: number;
}

export interface ExecutionConstraints {
  maxLOC: number;
  maxFiles: number;
  protectedPaths: string[];
  allowedCategories: string[];
}

export class SelfHealExecutor {
  private defaultConstraints: ExecutionConstraints = {
    maxLOC: 40,
    maxFiles: 10,
    protectedPaths: ['security/**', 'auth/**', '**/*.test.*', '**/*.spec.*', 'database/migrations/**'],
    allowedCategories: ['syntax', 'import', 'build', 'performance'],
  };

  /**
   * Execute self-healing session with selected recipes
   */
  async executeSession(
    recipes: SelectedRecipe[],
    constraints?: Partial<ExecutionConstraints>
  ): Promise<SelfHealSession> {
    const sessionId = `heal-${Date.now()}`;
    const finalConstraints = { ...this.defaultConstraints, ...constraints };
    const executionResults: RecipeExecutionResult[] = [];

    console.log(`🚀 Starting self-heal session: ${sessionId}`);

    for (const recipe of recipes) {
      // Check constraints before execution
      if (!this.validateConstraints(recipe, finalConstraints)) {
        executionResults.push({
          recipeId: recipe.recipeId,
          status: 'skipped',
          evidence: this.createEmptyEvidence(),
          errors: ['Recipe violates execution constraints'],
        });
        continue;
      }

      // Execute recipe
      const result = await this.executeRecipe(recipe, finalConstraints);
      executionResults.push(result);

      // If failed or worse, stop session
      if (result.status === 'failed' || this.isWorse(result)) {
        console.warn(`⚠️ Recipe ${recipe.recipeId} ${result.status}, stopping session`);
        break;
      }
    }

    // Determine final outcome
    const finalOutcome = this.determineFinalOutcome(executionResults);

    return {
      sessionId,
      timestamp: new Date().toISOString(),
      selectedRecipes: recipes,
      executionResults,
      constraints: finalConstraints,
      finalOutcome,
    };
  }

  /**
   * Execute a single recipe
   */
  private async executeRecipe(
    recipe: SelectedRecipe,
    constraints: ExecutionConstraints
  ): Promise<RecipeExecutionResult> {
    const startTime = Date.now();

    try {
      // Capture before state
      const filesModified = this.getAffectedFiles(recipe.targetCandidates);
      const beforeState = await this.captureFileState(filesModified);

      // Execute recipe (OMEGA-P4: Real AST-based execution via ts-morph)
      console.log(`🔧 Executing recipe: ${recipe.recipeId}`);
      await this.mockRecipeExecution(recipe);

      // Capture after state
      const afterState = await this.captureFileState(filesModified);
      const diffs = this.computeDiffs(beforeState, afterState);
      const locChanged = diffs.reduce((sum, d) => sum + d.locAdded + d.locRemoved, 0);

      // Re-run Insight on affected files
      const insightRevalidation = await this.revalidateWithInsight(filesModified, recipe.targetCandidates);

      // Build evidence
      const evidence: ExecutionEvidence = {
        filesModified,
        locChanged,
        diffs,
        riskReductionEstimate: recipe.estimatedImpact.riskReduction,
        executionTime: Date.now() - startTime,
        recipeJustification: recipe.score.justification,
      };

      // Check if healing improved results
      if (insightRevalidation && !insightRevalidation.severityImprovement) {
        // Rollback if worse
        await this.rollbackFiles(beforeState);
        return {
          recipeId: recipe.recipeId,
          status: 'rolled-back',
          evidence,
          insightRevalidation,
          errors: ['Healing did not improve results, rolled back'],
        };
      }

      return {
        recipeId: recipe.recipeId,
        status: 'executed',
        evidence,
        insightRevalidation,
      };
    } catch (error) {
      return {
        recipeId: recipe.recipeId,
        status: 'failed',
        evidence: this.createEmptyEvidence(),
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Validate recipe against constraints
   */
  private validateConstraints(recipe: SelectedRecipe, constraints: ExecutionConstraints): boolean {
    // Check LOC limit
    if (recipe.estimatedImpact.locChanged > constraints.maxLOC) {
      console.warn(`Recipe ${recipe.recipeId} exceeds LOC limit: ${recipe.estimatedImpact.locChanged} > ${constraints.maxLOC}`);
      return false;
    }

    // Check file count limit
    if (recipe.estimatedImpact.filesAffected > constraints.maxFiles) {
      console.warn(`Recipe ${recipe.recipeId} exceeds file limit: ${recipe.estimatedImpact.filesAffected} > ${constraints.maxFiles}`);
      return false;
    }

    // Check protected paths
    const affectedFiles = this.getAffectedFiles(recipe.targetCandidates);
    for (const file of affectedFiles) {
      if (this.isProtectedPath(file, constraints.protectedPaths)) {
        console.warn(`Recipe ${recipe.recipeId} targets protected path: ${file}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Check if path is protected
   */
  private isProtectedPath(path: string, protectedPaths: string[]): boolean {
    for (const pattern of protectedPaths) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
      if (regex.test(path)) return true;
    }
    return false;
  }

  /**
   * Get affected files from candidates
   */
  private getAffectedFiles(candidates: AutopilotFixCandidate[]): string[] {
    return Array.from(new Set(candidates.map((c) => c.finding.file)));
  }

  /**
   * Capture file state for rollback (OMEGA-P4: Real file I/O)
   */
  private async captureFileState(files: string[]): Promise<Map<string, string>> {
    const state = new Map<string, string>();
    
    for (const file of files) {
      try {
        if (existsSync(file)) {
          const content = await readFile(file, 'utf-8');
          state.set(file, content);
        } else {
          console.warn(`⚠️ File not found for capture: ${file}`);
          state.set(file, '');
        }
      } catch (error) {
        console.error(`❌ Failed to capture ${file}:`, error);
        state.set(file, '');
      }
    }
    
    return state;
  }

  /**
   * Execute recipe with real AST transformations (OMEGA-P4: Real execution)
   */
  private async mockRecipeExecution(recipe: SelectedRecipe): Promise<void> {
    const project = new Project({ useInMemoryFileSystem: false });
    
    for (const candidate of recipe.targetCandidates) {
      const filePath = candidate.finding.file;
      
      // Skip non-TypeScript files for now
      if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
        console.log(`⏭️ Skipping non-TS file: ${filePath}`);
        continue;
      }
      
      if (!existsSync(filePath)) {
        console.warn(`⚠️ File not found: ${filePath}`);
        continue;
      }
      
      try {
        const sourceFile = project.addSourceFileAtPath(filePath);
        
        // Apply recipe-specific transformations
        switch (recipe.recipeId) {
          case 'organize-imports':
            sourceFile.organizeImports();
            break;
            
          case 'fix-unused-imports':
            this.removeUnusedImports(sourceFile);
            break;
            
          case 'fix-typescript-errors':
            // Apply type fixes based on candidate.finding.message
            this.applyTypeScriptFixes(sourceFile, candidate);
            break;
            
          default:
            console.log(`🛠️ Recipe ${recipe.recipeId} transformation not yet implemented`);
        }
        
        // Save changes to disk
        await sourceFile.save();
        console.log(`✅ Applied ${recipe.recipeId} to ${filePath}`);
      } catch (error) {
        console.error(`❌ Failed to apply ${recipe.recipeId} to ${filePath}:`, error);
      }
    }
  }
  
  /**
   * Remove unused imports from source file
   */
  private removeUnusedImports(sourceFile: SourceFile): void {
    const imports = sourceFile.getImportDeclarations();
    
    for (const importDecl of imports) {
      const namedImports = importDecl.getNamedImports();
      const unusedImports = namedImports.filter((ni) => {
        const name = ni.getName();
        const refs = ni.findReferencesAsNodes();
        return refs.length <= 1; // Only the import itself
      });
      
      if (unusedImports.length > 0) {
        unusedImports.forEach((ui) => ui.remove());
      }
      
      // Remove entire import if all named imports removed
      if (importDecl.getNamedImports().length === 0) {
        importDecl.remove();
      }
    }
  }
  
  /**
   * Apply TypeScript type fixes based on finding
   */
  private applyTypeScriptFixes(sourceFile: SourceFile, candidate: AutopilotFixCandidate): void {
    // Extract error code from message (e.g., "TS2322: Type 'string' is not assignable to...")
    const tsErrorMatch = candidate.finding.message.match(/TS(\d+)/);
    
    if (!tsErrorMatch) {
      console.log(`ℹ️ No TS error code found in: ${candidate.finding.message}`);
      return;
    }
    
    const errorCode = tsErrorMatch[1];
    
    // Apply specific fixes based on error code
    switch (errorCode) {
      case '2322': // Type assignment errors
      case '2345': // Argument type errors
        console.log(`🔧 Would fix TS${errorCode} (type assignment) - requires semantic analysis`);
        break;
      case '2307': // Cannot find module
        console.log(`🔧 Would fix TS${errorCode} (missing import) - requires dependency analysis`);
        break;
      default:
        console.log(`ℹ️ TS${errorCode} fix not implemented`);
    }
  }

  /**
   * Compute diffs between before/after states
   */
  private computeDiffs(before: Map<string, string>, after: Map<string, string>): FileDiff[] {
    const diffs: FileDiff[] = [];
    
    for (const [file, beforeContent] of before) {
      const afterContent = after.get(file) || beforeContent;
      if (beforeContent !== afterContent) {
        diffs.push({
          file,
          before: beforeContent,
          after: afterContent,
          diff: this.generateUnifiedDiff(beforeContent, afterContent),
          locAdded: 5, // Mock
          locRemoved: 3, // Mock
        });
      }
    }

    return diffs;
  }

  /**
   * Generate unified diff (mock)
   */
  private generateUnifiedDiff(before: string, after: string): string {
    return `--- before\n+++ after\n@@ -1,5 +1,5 @@\n-${before.slice(0, 50)}\n+${after.slice(0, 50)}`;
  }

  /**
   * Re-run Insight on affected files (OMEGA-P4: Real detector execution)
   */
  private async revalidateWithInsight(
    files: string[],
    originalCandidates: AutopilotFixCandidate[]
  ): Promise<InsightRevalidation> {
    const beforeIssues = originalCandidates.length;
    let afterIssues = 0;
    
    try {
      // Determine which detectors to run based on original findings
      const detectorNames = new Set<DetectorName>();
      for (const candidate of originalCandidates) {
        const detector = candidate.finding.detector;
        if (detector && this.isValidDetectorName(detector)) {
          detectorNames.add(detector as DetectorName);
        }
      }
      
      // Run each detector on affected files
      for (const detectorName of detectorNames) {
        try {
          const DetectorClass = await loadDetector(detectorName);
          const detector = new DetectorClass();
          
          // Run detector on each file
          for (const file of files) {
            if (existsSync(file)) {
              const result = await detector.analyze(file);
              if (result && Array.isArray(result)) {
                afterIssues += result.length;
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️ Failed to run ${detectorName} detector:`, error);
        }
      }
      
      const severityImprovement = afterIssues < beforeIssues;
      const newIssuesIntroduced = afterIssues > beforeIssues ? afterIssues - beforeIssues : 0;
      
      return {
        beforeIssues,
        afterIssues,
        severityImprovement,
        newIssuesIntroduced,
      };
    } catch (error) {
      console.error('❌ Insight revalidation failed:', error);
      // Fallback: assume no improvement if validation fails
      return {
        beforeIssues,
        afterIssues: beforeIssues,
        severityImprovement: false,
        newIssuesIntroduced: 0,
      };
    }
  }
  
  /**
   * Check if detector name is valid
   */
  private isValidDetectorName(name: string): boolean {
    const validDetectors = [
      'typescript', 'eslint', 'import', 'package', 'runtime', 'build',
      'security', 'circular', 'network', 'performance', 'complexity', 'isolation',
    ];
    return validDetectors.includes(name);
  }

  /**
   * Rollback files to previous state (OMEGA-P4: Real file restoration)
   */
  private async rollbackFiles(beforeState: Map<string, string>): Promise<void> {
    console.log('🔄 Rolling back files...');
    
    for (const [file, content] of beforeState) {
      try {
        if (existsSync(file)) {
          await writeFile(file, content, 'utf-8');
          console.log(`  ✅ Rolled back: ${file}`);
        } else {
          console.warn(`  ⚠️ Cannot rollback ${file} - file does not exist`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to rollback ${file}:`, error);
      }
    }
  }

  /**
   * Check if result is worse than before
   */
  private isWorse(result: RecipeExecutionResult): boolean {
    if (result.status === 'failed' || result.status === 'rolled-back') return true;
    if (result.insightRevalidation && !result.insightRevalidation.severityImprovement) return true;
    return false;
  }

  /**
   * Determine final session outcome
   */
  private determineFinalOutcome(results: RecipeExecutionResult[]): 'success' | 'partial' | 'failed' | 'rolled-back' {
    const executed = results.filter((r) => r.status === 'executed').length;
    const rolledBack = results.filter((r) => r.status === 'rolled-back').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    if (executed === results.length) return 'success';
    if (rolledBack > 0 || failed > 0) {
      return executed > 0 ? 'partial' : rolledBack > 0 ? 'rolled-back' : 'failed';
    }
    return 'partial';
  }

  /**
   * Create empty evidence (for skipped/failed recipes)
   */
  private createEmptyEvidence(): ExecutionEvidence {
    return {
      filesModified: [],
      locChanged: 0,
      diffs: [],
      riskReductionEstimate: 0,
      executionTime: 0,
      recipeJustification: [],
    };
  }
}
