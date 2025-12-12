/**
 * ODAVL Autopilot Self-Heal Preview Panel (VS Code Extension)
 * Phase Ω-P3: Real-time self-healing visualization
 * 
 * Features:
 * - Preview selected recipes before execution
 * - Show risk/ML/fusion scores
 * - Display expected diffs
 * - Show Guardian pass/fail after healing
 */

import * as vscode from 'vscode';

export interface AutopilotPreviewData {
  sessionId: string;
  candidates: Array<{
    finding: { file: string; line?: number; message: string; severity: string; category: string };
    riskWeight: number;
    priority: number;
  }>;
  selectedRecipes: Array<{
    recipeId: string;
    mlScore: number;
    trustScore: number;
    fusionScore: number;
    finalScore: number;
    safetyClass: string;
    justification: string[];
    estimatedImpact: { filesAffected: number; locChanged: number; riskReduction: number };
  }>;
  executionResult?: {
    status: string;
    filesModified: string[];
    locChanged: number;
    brainConfidenceBefore: number;
    brainConfidenceAfter: number;
    guardianPassed: boolean;
    gatesStatus: Array<{ gate: string; pass: boolean; reason: string }>;
  };
}

export class AutopilotSelfHealPanel {
  public static currentPanel: AutopilotSelfHealPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri, data: AutopilotPreviewData) {
    const column = vscode.ViewColumn.Two;

    if (AutopilotSelfHealPanel.currentPanel) {
      AutopilotSelfHealPanel.currentPanel._panel.reveal(column);
      AutopilotSelfHealPanel.currentPanel.update(data);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'odavlAutopilotPreview',
      '🤖 ODAVL Autopilot Self-Heal',
      column,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    AutopilotSelfHealPanel.currentPanel = new AutopilotSelfHealPanel(panel, extensionUri);
    AutopilotSelfHealPanel.currentPanel.update(data);
  }

  public update(data: AutopilotPreviewData) {
    this._panel.webview.html = this._getHtmlContent(data);
  }

  private _getHtmlContent(data: AutopilotPreviewData): string {
    const hasExecution = Boolean(data.executionResult);
    const avgScore =
      data.selectedRecipes.length > 0
        ? data.selectedRecipes.reduce((sum, r) => sum + r.finalScore, 0) / data.selectedRecipes.length
        : 0;

    // OMEGA-P5 Phase 4 Commit 6: OMS file type risk icons
    const getFileRiskIcon = (file: string): string => {
      // Simple heuristic based on file extension
      if (file.endsWith('.env') || file.endsWith('.key') || file.endsWith('.pem')) return '🔴';
      if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.py')) return '🟡';
      return '🟢';
    };
        : 0;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
    h1 { color: #569cd6; margin-bottom: 10px; }
    h2 { color: #4fc1ff; margin-top: 30px; margin-bottom: 15px; }
    .session-id { color: #858585; font-size: 12px; margin-bottom: 20px; }
    .summary { background: #252526; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .summary-item { margin: 8px 0; }
    .recipes-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .recipes-table th { background: #2d2d30; padding: 10px; text-align: left; color: #4fc1ff; }
    .recipes-table td { padding: 10px; border-bottom: 1px solid #3e3e42; }
    .score-bar { background: #3e3e42; height: 20px; border-radius: 3px; overflow: hidden; }
    .score-fill { background: linear-gradient(90deg, #4CAF50, #8BC34A); height: 100%; transition: width 0.3s; }
    .safe { color: #4CAF50; }
    .review { color: #FF9800; }
    .unsafe { color: #F44336; }
    .justification { background: #2d2d30; padding: 10px; border-radius: 3px; margin-top: 5px; font-size: 12px; }
    .justification-item { margin: 5px 0; color: #858585; }
    .execution-result { background: #2d2d30; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .gate-pass { color: #4CAF50; }
    .gate-fail { color: #F44336; }
    .confidence-change { font-size: 24px; font-weight: bold; margin: 15px 0; }
    .improvement { color: #4CAF50; }
    .decline { color: #F44336; }
  </style>
</head>
<body>
  <h1>🤖 Autopilot Self-Heal ${hasExecution ? 'Results' : 'Preview'}</h1>
  <div class="session-id">Session: ${data.sessionId}</div>

  <div class="summary">
    <div class="summary-item"><strong>Issues Detected:</strong> ${data.candidates.length}</div>
    <div class="summary-item"><strong>Recipes Selected:</strong> ${data.selectedRecipes.length}</div>
    <div class="summary-item"><strong>Average Score:</strong> ${(avgScore * 100).toFixed(1)}%</div>
    ${hasExecution ? `<div class="summary-item"><strong>Status:</strong> ${data.executionResult.status.toUpperCase()}</div>` : ''}
  </div>

  <h2>🎯 Selected Recipes</h2>
  <table class="recipes-table">
    <thead>
      <tr>
        <th>Recipe</th>
        <th>ML</th>
        <th>Trust</th>
        <th>Fusion</th>
        <th>Final</th>
        <th>Safety</th>
        <th>Impact</th>
      </tr>
    </thead>
    <tbody>
      ${data.selectedRecipes
        .map(
          (r) => `
        <tr>
          <td><strong>${r.recipeId}</strong></td>
          <td>${(r.mlScore * 100).toFixed(0)}%</td>
          <td>${(r.trustScore * 100).toFixed(0)}%</td>
          <td>${(r.fusionScore * 100).toFixed(0)}%</td>
          <td>
            <div class="score-bar">
              <div class="score-fill" style="width: ${r.finalScore * 100}%"></div>
            </div>
            ${(r.finalScore * 100).toFixed(1)}%
          </td>
          <td class="${r.safetyClass}">${r.safetyClass.toUpperCase()}</td>
          <td>${r.estimatedImpact.filesAffected} files, ${r.estimatedImpact.locChanged} LOC</td>
        </tr>
        <tr>
          <td colspan="7">
            <div class="justification">
              ${r.justification.map((j) => `<div class="justification-item">${j}</div>`).join('')}
            </div>
          </td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  ${
    hasExecution
      ? `
    <h2>📊 Execution Results</h2>
    <div class="execution-result">
      <div class="confidence-change">
        <span>Brain Confidence:</span>
        <span>${data.executionResult.brainConfidenceBefore.toFixed(1)}%</span>
        <span> → </span>
        <span class="${data.executionResult.brainConfidenceAfter > data.executionResult.brainConfidenceBefore ? 'improvement' : 'decline'}">
          ${data.executionResult.brainConfidenceAfter.toFixed(1)}%
        </span>
        <span class="${data.executionResult.brainConfidenceAfter > data.executionResult.brainConfidenceBefore ? 'improvement' : 'decline'}">
          (${data.executionResult.brainConfidenceAfter >= data.executionResult.brainConfidenceBefore ? '+' : ''}${(data.executionResult.brainConfidenceAfter - data.executionResult.brainConfidenceBefore).toFixed(1)}%)
        </span>
      </div>

      <p><strong>Files Modified:</strong> ${data.executionResult.filesModified.length} (${data.executionResult.locChanged} LOC changed)</p>

      <h3>🛡️ Guardian Validation: ${data.executionResult.guardianPassed ? '<span class="gate-pass">PASSED</span>' : '<span class="gate-fail">FAILED</span>'}</h3>
      <table class="recipes-table">
        <thead>
          <tr>
            <th>Gate</th>
            <th>Status</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          ${data.executionResult.gatesStatus
            .map(
              (g) => `
            <tr>
              <td><strong>${g.gate}</strong></td>
              <td class="${g.pass ? 'gate-pass' : 'gate-fail'}">${g.pass ? '✅' : '❌'}</td>
              <td>${g.reason}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `
      : `
    <div class="summary">
      <p>This is a preview. Run <code>odavl autopilot run</code> to execute healing.</p>
    </div>
  `
  }
</body>
</html>`;
  }

  public dispose() {
    AutopilotSelfHealPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) disposable.dispose();
    }
  }
}
