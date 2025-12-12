/**
 * ODAVL Brain Live View Panel
 * Phase Ω-P2: Integration with Guardian gates + real-time deployment safety
 */

import * as vscode from 'vscode';

export interface GuardianGateResult {
  pass: boolean;
  reason: string;
  gate: string;
  score?: number;
}

export class BrainLiveViewPanel {
  public static currentPanel: BrainLiveViewPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri, brainData: any) {
    const column = vscode.ViewColumn.Two;

    if (BrainLiveViewPanel.currentPanel) {
      BrainLiveViewPanel.currentPanel._panel.reveal(column);
      BrainLiveViewPanel.currentPanel.update(brainData);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'odavlBrainView',
      '🧠 ODAVL Brain',
      column,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    BrainLiveViewPanel.currentPanel = new BrainLiveViewPanel(panel, extensionUri);
    BrainLiveViewPanel.currentPanel.update(brainData);
  }

  public update(data: any) {
    this._panel.webview.html = this._getHtmlContent(data);
  }

  private _getHtmlContent(data: any): string {
    const confidenceColor = data.confidence >= 75 ? '#4CAF50' : data.confidence >= 60 ? '#FF9800' : '#F44336';
    const deployStatus = data.canDeploy ? '✅ DEPLOY ALLOWED' : '❌ DEPLOY BLOCKED';

    // Phase Ω-P2: Guardian gates table
    const guardianGates = data.guardianGates || [];
    const guardianEnabled = guardianGates.length > 0;
    const failedGatesCount = guardianGates.filter((g: GuardianGateResult) => !g.pass).length;

    // OMEGA-P5 Phase 4 Commit 6: OMS file risk display
    const omsFileRisk = data.omsFileRisk || null;
    const fileRiskHtml = omsFileRisk
      ? `<div class="guardian-summary">
          <h3>📊 File Risk Analysis (OMS)</h3>
          <p>Average Risk: ${(omsFileRisk.avgRisk * 100).toFixed(1)}%</p>
          <p>Critical Files: ${omsFileRisk.criticalFileCount}</p>
        </div>`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
    h1 { color: #569cd6; }
    h2 { color: #4fc1ff; margin-top: 30px; }
    .confidence { font-size: 48px; font-weight: bold; color: ${confidenceColor}; margin: 20px 0; }
    .status { font-size: 24px; margin: 10px 0; }
    .reasoning { background: #252526; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .reasoning-item { padding: 5px 0; }
    .fusion { background: #2d2d30; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .fusion-weight { display: inline-block; margin: 5px 10px; }
    .guardian-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .guardian-table th { background: #2d2d30; padding: 10px; text-align: left; color: #4fc1ff; }
    .guardian-table td { padding: 10px; border-bottom: 1px solid #3e3e42; }
    .gate-pass { color: #4CAF50; font-size: 18px; }
    .gate-fail { color: #F44336; font-size: 18px; }
    .guardian-summary { background: #252526; padding: 15px; border-radius: 5px; margin: 15px 0; }
  </style>
</head>
<body>
  <h1>🧠 ODAVL Brain Live View</h1>
  
  <div class="confidence">${data.confidence.toFixed(1)}%</div>
  <div class="status">${deployStatus}</div>

  ${guardianEnabled ? `
    <h2>🛡️ Guardian Deployment Gates (Phase Ω-P2)</h2>
    <div class="guardian-summary">
      <p><strong>Status:</strong> ${failedGatesCount === 0 ? '✅ All gates passed' : `❌ ${failedGatesCount} gate(s) failed`}</p>
      ${data.finalConfidence ? `<p><strong>Final Confidence:</strong> ${data.finalConfidence.toFixed(1)}% (Brain: ${data.brainScore?.toFixed(1) || 'N/A'}%, Fusion: ${data.fusionScore?.toFixed(1) || 'N/A'}%)</p>` : ''}
    </div>
    <table class="guardian-table">
      <thead>
        <tr>
          <th>Gate</th>
          <th>Status</th>
          <th>Score</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody>
        ${guardianGates.map((gate: GuardianGateResult) => `
          <tr>
            <td><strong>${gate.gate}</strong></td>
            <td class="${gate.pass ? 'gate-pass' : 'gate-fail'}">${gate.pass ? '✅' : '❌'}</td>
            <td>${gate.score !== undefined ? gate.score.toFixed(1) : 'N/A'}</td>
            <td>${gate.reason}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''}
  
  <h2>📊 Brain Reasoning</h2>
  <div class="reasoning">
    ${data.reasoning.map((r: string) => `<div class="reasoning-item">${r}</div>`).join('')}
  </div>
  
  ${data.fusion ? `
    <h2>🧩 Fusion Engine (Phase P12)</h2>
    <div class="fusion">
      <p><strong>Fusion Score:</strong> ${(data.fusion.fusionScore * 100).toFixed(1)}%</p>
      <p><strong>Weights:</strong></p>
      <div>
        <span class="fusion-weight">NN: ${(data.fusion.weights.nn * 100).toFixed(0)}%</span>
        <span class="fusion-weight">LSTM: ${(data.fusion.weights.lstm * 100).toFixed(0)}%</span>
        <span class="fusion-weight">MTL: ${(data.fusion.weights.mtl * 100).toFixed(0)}%</span>
        <span class="fusion-weight">Bayesian: ${(data.fusion.weights.bayesian * 100).toFixed(0)}%</span>
        <span class="fusion-weight">Heuristic: ${(data.fusion.weights.heuristic * 100).toFixed(0)}%</span>
      </div>
      ${data.fusion.reasoning.map((r: string) => `<div class="reasoning-item">${r}</div>`).join('')}
    </div>
  ` : ''}
</body>
</html>`;
  }

  public dispose() {
    BrainLiveViewPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) disposable.dispose();
    }
  }
}
