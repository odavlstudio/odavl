/**
 * ODAVL Insight - Status Bar Integration
 * Wave 5 - UX Polish with status bar item showing analysis state
 */

import * as vscode from 'vscode';

export class InsightStatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private issueCount = 0;
  private isAnalyzing = false;
  
  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = 'odavl-insight.analyzeWorkspace';
    this.statusBarItem.show();
    this.updateStatusBar();
  }
  
  setAnalyzing(analyzing: boolean): void {
    this.isAnalyzing = analyzing;
    this.updateStatusBar();
  }
  
  setIssueCount(count: number): void {
    this.issueCount = count;
    this.updateStatusBar();
  }
  
  private updateStatusBar(): void {
    if (this.isAnalyzing) {
      this.statusBarItem.text = '$(sync~spin) Insight: Analyzing...';
      this.statusBarItem.tooltip = 'ODAVL Insight is analyzing your workspace';
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else if (this.issueCount > 0) {
      this.statusBarItem.text = `$(flame) Insight: ${this.issueCount} issue${this.issueCount !== 1 ? 's' : ''}`;
      this.statusBarItem.tooltip = `ODAVL Insight found ${this.issueCount} issue${this.issueCount !== 1 ? 's' : ''}. Click to analyze workspace.`;
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    } else {
      this.statusBarItem.text = '$(check) Insight: Active';
      this.statusBarItem.tooltip = 'ODAVL Insight is active. Click to analyze workspace.';
      this.statusBarItem.backgroundColor = undefined;
    }
  }
  
  dispose(): void {
    this.statusBarItem.dispose();
  }
}
