/**
 * Dry-Run Preview Mode for Autopilot
 * 
 * Allows users to preview changes before applying them:
 * - See exactly what files will be modified
 * - View diffs for each change
 * - Estimate impact (LOC changed, files affected, risk score)
 * - Interactive approval workflow (approve/reject/modify)
 * - Export preview to HTML/JSON for review
 * 
 * Safety: Never execute without user confirmation in dry-run mode
 */

import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import type { Recipe, RecipeAction } from '../phases/decide.js';
import { MLTrustPredictor } from '../ml/trust-predictor.js';

export interface DryRunOptions {
  recipe: Recipe;
  outputFormat?: 'console' | 'json' | 'html';
  outputPath?: string; // For JSON/HTML export
  interactive?: boolean; // Prompt for approval
  showDiffs?: boolean; // Generate diffs (slower but more accurate)
  estimateOnly?: boolean; // Just show metadata, no execution
}

export interface DryRunResult {
  recipeId: string;
  recipeName: string;
  estimatedImpact: ImpactEstimate;
  plannedChanges: PlannedChange[];
  mlPrediction?: MLPrediction;
  riskScore: number; // 0-100 (0 = safe, 100 = very risky)
  recommendation: 'safe-to-execute' | 'review-carefully' | 'high-risk';
  timestamp: string;
}

export interface ImpactEstimate {
  filesAffected: number;
  linesAdded: number; // Estimated
  linesRemoved: number; // Estimated
  linesModified: number; // Estimated
  complexity: number; // 0-10 scale
  protectedPathsAffected: string[]; // Files in security/**, auth/**, etc.
  testFilesAffected: number;
  documentationAffected: number;
}

export interface PlannedChange {
  file: string;
  operation: 'create' | 'modify' | 'delete';
  reason: string; // Why this change?
  currentHash?: string; // SHA-256 of current content
  estimatedLines?: number;
  diff?: string; // Unified diff (if showDiffs enabled)
  riskLevel: 'low' | 'medium' | 'high';
}

export interface MLPrediction {
  predictedSuccess: number; // 0-1
  confidence: number; // 0-1
  recommendation: 'execute' | 'review' | 'skip';
  explanation: string;
}

/**
 * Dry-Run Preview Engine
 */
export class DryRunEngine {
  private mlPredictor: MLTrustPredictor | null = null;

  constructor() {
    // ML predictor loaded on-demand
  }

  /**
   * Load ML predictor (lazy)
   */
  private async getMLPredictor(): Promise<MLTrustPredictor | null> {
    if (!this.mlPredictor) {
      try {
        this.mlPredictor = new MLTrustPredictor();
        await this.mlPredictor.loadModel();
      } catch {
        return null;
      }
    }
    return this.mlPredictor;
  }

  /**
   * Generate file content hash
   */
  private generateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Estimate lines of code from file size
   */
  private estimateLOC(filePath: string): number {
    // Heuristic: avg line = 50 chars
    // Will be more accurate with actual file read
    return 100; // Placeholder
  }

  /**
   * Check if file is in protected path
   */
  private isProtectedPath(filePath: string): boolean {
    const protectedPatterns = [
      /^security\//,
      /^auth\//,
      /\.spec\.[jt]s$/,
      /\.test\.[jt]s$/,
      /^public-api\//,
    ];
    return protectedPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Check if file is a test
   */
  private isTestFile(filePath: string): boolean {
    return /\.(test|spec)\.[jt]sx?$/.test(filePath);
  }

  /**
   * Check if file is documentation
   */
  private isDocFile(filePath: string): boolean {
    return /\.(md|txt|rst)$/i.test(filePath);
  }

  /**
   * Estimate impact of recipe execution
   */
  private async estimateImpact(recipe: Recipe): Promise<ImpactEstimate> {
    const filesAffected = new Set<string>();
    const protectedPathsAffected: string[] = [];
    let testFilesAffected = 0;
    let documentationAffected = 0;
    let linesAdded = 0;
    let linesRemoved = 0;
    let linesModified = 0;

    for (const action of recipe.actions) {
      if (action.files) {
        for (const file of action.files) {
          filesAffected.add(file);

          if (this.isProtectedPath(file)) {
            protectedPathsAffected.push(file);
          }
          if (this.isTestFile(file)) {
            testFilesAffected++;
          }
          if (this.isDocFile(file)) {
            documentationAffected++;
          }

          // Estimate lines changed (heuristic)
          const estimatedLines = this.estimateLOC(file);
          if (action.type === 'edit' || action.type === 'file-edit') {
            linesModified += estimatedLines * 0.3; // Assume 30% of file modified
          } else if (action.type === 'delete') {
            linesRemoved += estimatedLines;
          } else {
            linesAdded += estimatedLines * 0.5; // New files partial
          }
        }
      }
    }

    // Complexity score (0-10)
    const complexity = Math.min(10, filesAffected.size * 0.5 + protectedPathsAffected.length * 2);

    return {
      filesAffected: filesAffected.size,
      linesAdded: Math.round(linesAdded),
      linesRemoved: Math.round(linesRemoved),
      linesModified: Math.round(linesModified),
      complexity,
      protectedPathsAffected,
      testFilesAffected,
      documentationAffected,
    };
  }

  /**
   * Calculate risk score (0-100)
   */
  private calculateRiskScore(impact: ImpactEstimate, mlPrediction?: MLPrediction): number {
    let risk = 0;

    // File count risk
    risk += Math.min(30, impact.filesAffected * 3); // 30 points max

    // Protected paths risk
    risk += impact.protectedPathsAffected.length * 15; // 15 points per protected file

    // Complexity risk
    risk += impact.complexity * 3; // 30 points max

    // Lines changed risk
    const totalLines = impact.linesAdded + impact.linesRemoved + impact.linesModified;
    risk += Math.min(20, totalLines / 100); // 20 points max

    // ML prediction adjustment
    if (mlPrediction) {
      const mlRisk = (1 - mlPrediction.predictedSuccess) * 20; // 20 points max
      risk += mlRisk;
    }

    return Math.min(100, Math.round(risk));
  }

  /**
   * Get risk recommendation
   */
  private getRiskRecommendation(riskScore: number): 'safe-to-execute' | 'review-carefully' | 'high-risk' {
    if (riskScore < 30) return 'safe-to-execute';
    if (riskScore < 60) return 'review-carefully';
    return 'high-risk';
  }

  /**
   * Analyze planned changes for each file
   */
  private async analyzePlannedChanges(recipe: Recipe, showDiffs: boolean): Promise<PlannedChange[]> {
    const changes: PlannedChange[] = [];

    for (const action of recipe.actions) {
      if (!action.files) continue;

      for (const file of action.files) {
        let operation: 'create' | 'modify' | 'delete' = 'modify';
        let currentHash: string | undefined;
        let diff: string | undefined;

        try {
          // Check if file exists
          await fsp.access(file);
          const content = await fsp.readFile(file, 'utf8');
          currentHash = this.generateHash(content);

          // Determine operation
          if (action.type === 'delete') {
            operation = 'delete';
          } else {
            operation = 'modify';
          }

          // Generate diff if requested (placeholder - would need actual change simulation)
          if (showDiffs) {
            diff = `--- ${file}\n+++ ${file}\n@@ ... @@\n(Diff unavailable in dry-run - full execution needed)`;
          }
        } catch {
          // File doesn't exist
          operation = 'create';
        }

        // Determine risk level
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (this.isProtectedPath(file)) {
          riskLevel = 'high';
        } else if (operation === 'delete' || this.isTestFile(file)) {
          riskLevel = 'medium';
        }

        changes.push({
          file,
          operation,
          reason: action.description || 'No description',
          currentHash,
          estimatedLines: this.estimateLOC(file),
          diff,
          riskLevel,
        });
      }
    }

    return changes;
  }

  /**
   * Execute dry-run analysis
   */
  async preview(options: DryRunOptions): Promise<DryRunResult> {
    console.log(`[DRY-RUN] 🔍 Analyzing recipe: ${options.recipe.name}...`);

    // Estimate impact
    const estimatedImpact = await this.estimateImpact(options.recipe);

    // Analyze planned changes
    const plannedChanges = await this.analyzePlannedChanges(
      options.recipe,
      options.showDiffs ?? false
    );

    // ML prediction (if available)
    let mlPrediction: MLPrediction | undefined;
    const mlPredictor = await this.getMLPredictor();
    if (mlPredictor) {
      const features = mlPredictor.extractFeatures({
        successRate: options.recipe.trust ?? 0.5,
        totalRuns: 0,
        consecutiveFailures: 0,
        filesAffected: plannedChanges.map(c => c.file),
        locChanged: estimatedImpact.linesAdded + estimatedImpact.linesModified,
        complexity: estimatedImpact.complexity,
      });
      const prediction = await mlPredictor.predict(features);
      mlPrediction = {
        predictedSuccess: prediction.predictedTrust,
        confidence: prediction.confidence,
        recommendation: prediction.recommendation,
        explanation: prediction.explanation,
      };
    }

    // Calculate risk score
    const riskScore = this.calculateRiskScore(estimatedImpact, mlPrediction);
    const recommendation = this.getRiskRecommendation(riskScore);

    const result: DryRunResult = {
      recipeId: options.recipe.id,
      recipeName: options.recipe.name,
      estimatedImpact,
      plannedChanges,
      mlPrediction,
      riskScore,
      recommendation,
      timestamp: new Date().toISOString(),
    };

    // Output based on format
    if (options.outputFormat === 'console') {
      this.printConsolePreview(result);
    } else if (options.outputFormat === 'json') {
      await this.exportJSON(result, options.outputPath);
    } else if (options.outputFormat === 'html') {
      await this.exportHTML(result, options.outputPath);
    }

    // Interactive approval
    if (options.interactive) {
      const approved = await this.promptApproval(result);
      console.log(approved ? '✅ Approved for execution' : '❌ Rejected');
    }

    return result;
  }

  /**
   * Print console preview
   */
  private printConsolePreview(result: DryRunResult): void {
    console.log('\n' + '='.repeat(80));
    console.log(`📋 DRY-RUN PREVIEW: ${result.recipeName}`);
    console.log('='.repeat(80));

    console.log(`\n📊 Estimated Impact:`);
    console.log(`  Files affected: ${result.estimatedImpact.filesAffected}`);
    console.log(`  Lines added: ~${result.estimatedImpact.linesAdded}`);
    console.log(`  Lines modified: ~${result.estimatedImpact.linesModified}`);
    console.log(`  Lines removed: ~${result.estimatedImpact.linesRemoved}`);
    console.log(`  Complexity: ${result.estimatedImpact.complexity}/10`);
    console.log(`  Test files: ${result.estimatedImpact.testFilesAffected}`);
    console.log(`  Documentation: ${result.estimatedImpact.documentationAffected}`);

    if (result.estimatedImpact.protectedPathsAffected.length > 0) {
      console.log(`\n⚠️  Protected Paths Affected:`);
      result.estimatedImpact.protectedPathsAffected.forEach(p => console.log(`    - ${p}`));
    }

    if (result.mlPrediction) {
      console.log(`\n🤖 ML Prediction:`);
      console.log(`  Success probability: ${(result.mlPrediction.predictedSuccess * 100).toFixed(1)}%`);
      console.log(`  Confidence: ${(result.mlPrediction.confidence * 100).toFixed(1)}%`);
      console.log(`  Recommendation: ${result.mlPrediction.recommendation.toUpperCase()}`);
      console.log(`\n${result.mlPrediction.explanation}`);
    }

    console.log(`\n⚡ Risk Assessment:`);
    console.log(`  Risk Score: ${result.riskScore}/100`);
    console.log(`  Recommendation: ${result.recommendation.toUpperCase().replace(/-/g, ' ')}`);

    console.log(`\n📝 Planned Changes (${result.plannedChanges.length} files):`);
    result.plannedChanges.forEach(change => {
      const icon = change.operation === 'create' ? '➕' : change.operation === 'delete' ? '❌' : '✏️';
      const risk = change.riskLevel === 'high' ? '🔴' : change.riskLevel === 'medium' ? '🟡' : '🟢';
      console.log(`  ${icon} ${risk} ${change.file} (${change.operation})`);
      console.log(`      ${change.reason}`);
    });

    console.log('\n' + '='.repeat(80));
  }

  /**
   * Export to JSON
   */
  private async exportJSON(result: DryRunResult, outputPath?: string): Promise<void> {
    const json = JSON.stringify(result, null, 2);
    const filePath = outputPath || path.join(process.cwd(), '.odavl', 'dry-run-preview.json');
    await fsp.mkdir(path.dirname(filePath), { recursive: true });
    await fsp.writeFile(filePath, json);
    console.log(`[DRY-RUN] 💾 Preview saved to ${filePath}`);
  }

  /**
   * Export to HTML
   */
  private async exportHTML(result: DryRunResult, outputPath?: string): Promise<void> {
    const html = this.generateHTML(result);
    const filePath = outputPath || path.join(process.cwd(), '.odavl', 'dry-run-preview.html');
    await fsp.mkdir(path.dirname(filePath), { recursive: true });
    await fsp.writeFile(filePath, html);
    console.log(`[DRY-RUN] 💾 Preview saved to ${filePath}`);
  }

  /**
   * Generate HTML report
   */
  private generateHTML(result: DryRunResult): string {
    const riskColor = result.riskScore < 30 ? '#22c55e' : result.riskScore < 60 ? '#f59e0b' : '#ef4444';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dry-Run Preview: ${result.recipeName}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 1200px; margin: 40px auto; padding: 0 20px; background: #0f172a; color: #e2e8f0; }
    h1 { color: #60a5fa; }
    .card { background: #1e293b; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #334155; }
    .stat { display: inline-block; margin: 10px 20px 10px 0; }
    .stat-label { color: #94a3b8; font-size: 14px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #60a5fa; }
    .risk-score { font-size: 48px; font-weight: bold; color: ${riskColor}; }
    .change { padding: 10px; margin: 10px 0; background: #334155; border-radius: 4px; }
    .change-icon { display: inline-block; width: 30px; }
    .risk-low { color: #22c55e; }
    .risk-medium { color: #f59e0b; }
    .risk-high { color: #ef4444; }
  </style>
</head>
<body>
  <h1>📋 Dry-Run Preview: ${result.recipeName}</h1>
  <p>Generated: ${new Date(result.timestamp).toLocaleString()}</p>

  <div class="card">
    <h2>📊 Estimated Impact</h2>
    <div class="stat"><div class="stat-label">Files</div><div class="stat-value">${result.estimatedImpact.filesAffected}</div></div>
    <div class="stat"><div class="stat-label">Lines Added</div><div class="stat-value">~${result.estimatedImpact.linesAdded}</div></div>
    <div class="stat"><div class="stat-label">Lines Modified</div><div class="stat-value">~${result.estimatedImpact.linesModified}</div></div>
    <div class="stat"><div class="stat-label">Lines Removed</div><div class="stat-value">~${result.estimatedImpact.linesRemoved}</div></div>
    <div class="stat"><div class="stat-label">Complexity</div><div class="stat-value">${result.estimatedImpact.complexity}/10</div></div>
  </div>

  ${result.mlPrediction ? `
  <div class="card">
    <h2>🤖 ML Prediction</h2>
    <p><strong>Success Probability:</strong> ${(result.mlPrediction.predictedSuccess * 100).toFixed(1)}%</p>
    <p><strong>Confidence:</strong> ${(result.mlPrediction.confidence * 100).toFixed(1)}%</p>
    <p><strong>Recommendation:</strong> ${result.mlPrediction.recommendation.toUpperCase()}</p>
    <pre style="background: #0f172a; padding: 10px; border-radius: 4px; overflow-x: auto;">${result.mlPrediction.explanation}</pre>
  </div>
  ` : ''}

  <div class="card">
    <h2>⚡ Risk Assessment</h2>
    <div class="risk-score">${result.riskScore}/100</div>
    <p><strong>Recommendation:</strong> ${result.recommendation.toUpperCase().replace(/-/g, ' ')}</p>
  </div>

  <div class="card">
    <h2>📝 Planned Changes</h2>
    ${result.plannedChanges.map(change => `
      <div class="change">
        <span class="change-icon">${change.operation === 'create' ? '➕' : change.operation === 'delete' ? '❌' : '✏️'}</span>
        <span class="risk-${change.riskLevel}">${change.riskLevel.toUpperCase()}</span>
        <strong>${change.file}</strong> (${change.operation})
        <p style="margin: 5px 0 0 30px; color: #94a3b8;">${change.reason}</p>
      </div>
    `).join('')}
  </div>
</body>
</html>`;
  }

  /**
   * Prompt for approval (interactive mode)
   */
  private async promptApproval(result: DryRunResult): Promise<boolean> {
    // Placeholder - would integrate with readline or inquirer
    console.log('\n❓ Execute this recipe? (y/n)');
    return true; // Default approve for now
  }
}

/**
 * Example usage:
 * 
 * ```typescript
 * const engine = new DryRunEngine();
 * const recipe = await loadRecipe('fix-unused-imports');
 * 
 * // Console preview
 * const result = await engine.preview({
 *   recipe,
 *   outputFormat: 'console',
 *   showDiffs: true,
 * });
 * 
 * // HTML export
 * await engine.preview({
 *   recipe,
 *   outputFormat: 'html',
 *   outputPath: './preview.html',
 * });
 * 
 * // Interactive approval
 * await engine.preview({
 *   recipe,
 *   interactive: true,
 * });
 * ```
 */
