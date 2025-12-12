/**
 * ODAVL Autopilot OMS Report Generator
 * Phase Ω-P3: OMS-compliant self-heal session reports
 * 
 * Every self-heal session must produce:
 * .odavl/reports/autopilot/<timestamp>.oms.json
 * 
 * Structure includes all required OMS fields
 */

import type { SelfHealSession, RecipeExecutionResult } from '../engine/src/execution/self-heal';
import type { AutopilotCIResult } from '../runtime/auto-ci';
import type { AutopilotFixCandidate } from '../core/src/intake/insight-intake';
import type { SelectedRecipe } from '../engine/src/selection/recipe-selector';

export interface OMSAutopilotReport {
  // OMS Header
  oms: {
    version: string;
    schema: 'autopilot-session';
    timestamp: string;
    sessionId: string;
  };

  // Session Info
  session: {
    startTime: string;
    endTime: string;
    duration: number; // milliseconds
    outcome: 'success' | 'partial' | 'failed' | 'rolled-back';
  };

  // Detected Issues (from Insight)
  detectedIssues: {
    total: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    candidates: AutopilotFixCandidate[];
  };

  // Selected Recipes
  selectedRecipes: {
    total: number;
    recipes: SelectedRecipeOMS[];
  };

  // Execution Results
  execution: {
    executed: number;
    skipped: number;
    failed: number;
    rolledBack: number;
    results: RecipeExecutionOMS[];
  };

  // ML & Fusion Scores
  intelligence: {
    mlScoresUsed: boolean;
    fusionEngineUsed: boolean;
    avgMLScore: number;
    avgTrustScore: number;
    avgFusionScore: number;
  };

  // Fix Diffs
  fixDiffs: {
    totalFiles: number;
    totalLOC: number;
    diffs: DiffSummary[];
  };

  // Guardian Validation
  guardianResult?: {
    ran: boolean;
    canDeploy: boolean;
    gatesPassed: number;
    gatesTotal: number;
    gates: Array<{ gate: string; pass: boolean; reason: string }>;
  };

  // Brain Confidence
  brainConfidence: {
    before: number;
    after: number;
    improvement: number;
  };

  // Final Outcome
  finalOutcome: {
    decision: 'approved' | 'rejected' | 'needs-review';
    reasoning: string[];
    autoReverted: boolean;
  };

  // Rollback Info (if any)
  rollback?: {
    occurred: boolean;
    reason: string;
    filesReverted: string[];
  };
}

export interface SelectedRecipeOMS {
  recipeId: string;
  mlScore: number;
  trustScore: number;
  fusionScore: number;
  finalScore: number;
  safetyClass: string;
  targetCandidatesCount: number;
  estimatedImpact: {
    filesAffected: number;
    locChanged: number;
    riskReduction: number;
  };
}

export interface RecipeExecutionOMS {
  recipeId: string;
  status: string;
  filesModified: string[];
  locChanged: number;
  executionTime: number;
  insightRevalidation?: {
    beforeIssues: number;
    afterIssues: number;
    severityImprovement: boolean;
    newIssuesIntroduced: number;
  };
  errors?: string[];
}

export interface DiffSummary {
  file: string;
  locAdded: number;
  locRemoved: number;
  diffPreview: string; // First 200 chars
}

export class OMSReportGenerator {
  /**
   * Generate complete OMS report for self-heal session
   */
  generateReport(
    session: SelfHealSession,
    candidates: AutopilotFixCandidate[],
    ciResult: AutopilotCIResult
  ): OMSAutopilotReport {
    const startTime = session.timestamp;
    const endTime = ciResult.timestamp;
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

    return {
      oms: {
        version: '1.0.0',
        schema: 'autopilot-session',
        timestamp: endTime,
        sessionId: session.sessionId,
      },

      session: {
        startTime,
        endTime,
        duration,
        outcome: session.finalOutcome,
      },

      detectedIssues: this.summarizeIssues(candidates),

      selectedRecipes: this.summarizeRecipes(session.selectedRecipes),

      execution: this.summarizeExecution(session.executionResults),

      intelligence: this.summarizeIntelligence(session.selectedRecipes),

      fixDiffs: this.summarizeDiffs(session.executionResults),

      guardianResult: ciResult.guardianResult
        ? {
            ran: true,
            canDeploy: ciResult.guardianResult.canDeploy,
            gatesPassed: ciResult.guardianResult.gates.filter((g) => g.pass).length,
            gatesTotal: ciResult.guardianResult.gates.length,
            gates: ciResult.guardianResult.gates,
          }
        : undefined,

      brainConfidence: {
        before: ciResult.brainConfidenceBefore,
        after: ciResult.brainConfidenceAfter,
        improvement: ciResult.brainConfidenceAfter - ciResult.brainConfidenceBefore,
      },

      finalOutcome: {
        decision: ciResult.finalDecision,
        reasoning: ciResult.reasoning,
        autoReverted: ciResult.finalDecision === 'rejected',
      },

      rollback: this.summarizeRollback(session.executionResults),
    };
  }

  /**
   * Save report to disk (OMS-compliant location)
   * OMEGA-P4: Real file I/O with directory creation
   */
  async saveReport(report: OMSAutopilotReport, outputPath?: string): Promise<string> {
    const defaultPath = `.odavl/reports/autopilot/${report.oms.sessionId}.oms.json`;
    const path = outputPath || defaultPath;

    try {
      // Ensure directory exists
      const dir = path.substring(0, path.lastIndexOf('/'));
      await import('node:fs/promises').then(async (fs) => {
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path, JSON.stringify(report, null, 2), 'utf-8');
      });
      
      console.log(`💾 OMS report saved: ${path}`);
      return path;
    } catch (error) {
      console.error(`❌ Failed to save OMS report:`, error);
      // Fallback: log to console
      console.log(JSON.stringify(report, null, 2));
      return path;
    }
  }

  /**
   * Summarize detected issues
   */
  private summarizeIssues(candidates: AutopilotFixCandidate[]): OMSAutopilotReport['detectedIssues'] {
    const bySeverity: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const candidate of candidates) {
      const sev = candidate.finding.severity;
      const cat = candidate.finding.category;
      bySeverity[sev] = (bySeverity[sev] || 0) + 1;
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }

    return {
      total: candidates.length,
      bySeverity,
      byCategory,
      candidates,
    };
  }

  /**
   * Summarize selected recipes
   */
  private summarizeRecipes(recipes: SelectedRecipe[]): OMSAutopilotReport['selectedRecipes'] {
    return {
      total: recipes.length,
      recipes: recipes.map((r) => ({
        recipeId: r.recipeId,
        mlScore: r.score.mlScore,
        trustScore: r.score.trustScore,
        fusionScore: r.score.fusionScore,
        finalScore: r.score.finalScore,
        safetyClass: r.score.safetyClass,
        targetCandidatesCount: r.targetCandidates.length,
        estimatedImpact: r.estimatedImpact,
      })),
    };
  }

  /**
   * Summarize execution results
   */
  private summarizeExecution(results: RecipeExecutionResult[]): OMSAutopilotReport['execution'] {
    const executed = results.filter((r) => r.status === 'executed').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;
    const failed = results.filter((r) => r.status === 'failed').length;
    const rolledBack = results.filter((r) => r.status === 'rolled-back').length;

    return {
      executed,
      skipped,
      failed,
      rolledBack,
      results: results.map((r) => ({
        recipeId: r.recipeId,
        status: r.status,
        filesModified: r.evidence.filesModified,
        locChanged: r.evidence.locChanged,
        executionTime: r.evidence.executionTime,
        insightRevalidation: r.insightRevalidation,
        errors: r.errors,
      })),
    };
  }

  /**
   * Summarize intelligence scores
   */
  private summarizeIntelligence(recipes: SelectedRecipe[]): OMSAutopilotReport['intelligence'] {
    if (recipes.length === 0) {
      return {
        mlScoresUsed: false,
        fusionEngineUsed: false,
        avgMLScore: 0,
        avgTrustScore: 0,
        avgFusionScore: 0,
      };
    }

    const avgMLScore = recipes.reduce((sum, r) => sum + r.score.mlScore, 0) / recipes.length;
    const avgTrustScore = recipes.reduce((sum, r) => sum + r.score.trustScore, 0) / recipes.length;
    const avgFusionScore = recipes.reduce((sum, r) => sum + r.score.fusionScore, 0) / recipes.length;

    return {
      mlScoresUsed: true,
      fusionEngineUsed: true,
      avgMLScore,
      avgTrustScore,
      avgFusionScore,
    };
  }

  /**
   * Summarize fix diffs
   */
  private summarizeDiffs(results: RecipeExecutionResult[]): OMSAutopilotReport['fixDiffs'] {
    const allFiles = new Set<string>();
    let totalLOC = 0;
    const diffs: DiffSummary[] = [];

    for (const result of results) {
      for (const file of result.evidence.filesModified) {
        allFiles.add(file);
      }
      totalLOC += result.evidence.locChanged;

      for (const diff of result.evidence.diffs) {
        diffs.push({
          file: diff.file,
          locAdded: diff.locAdded,
          locRemoved: diff.locRemoved,
          diffPreview: diff.diff.slice(0, 200),
        });
      }
    }

    return {
      totalFiles: allFiles.size,
      totalLOC,
      diffs,
    };
  }

  /**
   * Summarize rollback info
   */
  private summarizeRollback(results: RecipeExecutionResult[]): OMSAutopilotReport['rollback'] | undefined {
    const rolledBack = results.filter((r) => r.status === 'rolled-back');
    if (rolledBack.length === 0) return undefined;

    const filesReverted = Array.from(
      new Set(rolledBack.flatMap((r) => r.evidence.filesModified))
    );

    return {
      occurred: true,
      reason: rolledBack[0].errors?.[0] || 'Healing did not improve results',
      filesReverted,
    };
  }
}
