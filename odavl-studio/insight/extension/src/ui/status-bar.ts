/**
 * ODAVL Insight - Status Bar Integration
 * 
 * Phase 4.1.4 - Offline/Cloud indicator:
 * Makes execution mode explicit to maintain user trust and privacy clarity.
 * 
 * **Modes**:
 * - Local: No cloud upload, nothing leaves machine (default)
 * - Cloud: User authenticated, cloud upload enabled, network reachable
 * - Offline: Cloud enabled but network unreachable or API error
 * - Analyzing: Active analysis in progress
 */

import * as vscode from 'vscode';

/**
 * Execution mode for ODAVL Insight
 * 
 * Phase 4.1.4: User must always know where analysis runs and where data stays
 */
export type ExecutionMode = 'local' | 'cloud' | 'offline';

export class InsightStatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private mode: ExecutionMode = 'local'; // Default: local-only (privacy-first)
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
  
  /**
   * Phase 4.1.4: Set execution mode
   * 
   * **Mode Definitions**:
   * - `local`: No cloud upload, no token, or user disabled cloud (guarantee: nothing leaves machine)
   * - `cloud`: User authenticated, cloud upload enabled, network reachable
   * - `offline`: Cloud enabled but network unreachable or API error
   * 
   * @param mode Execution mode
   */
  setMode(mode: ExecutionMode): void {
    this.mode = mode;
    this.updateStatusBar();
  }
  
  /**
   * Set analyzing state (shown during active analysis)
   * 
   * **Behavior**: Reverts to previous mode immediately after completion
   * 
   * @param analyzing Whether analysis is in progress
   */
  setAnalyzing(analyzing: boolean): void {
    this.isAnalyzing = analyzing;
    this.updateStatusBar();
  }
  
  /**
   * Phase 4.1.4: Update status bar display
   * 
   * **Display Rules**:
   * 1. During analysis: "Insight: Analyzing…" (temporary)
   * 2. Otherwise: "Insight: Local" | "Insight: Cloud" | "Insight: Offline"
   * 
   * **Constraints**:
   * - Never combine states
   * - Never abbreviate
   * - Never hide state
   * - No popups, tooltips with marketing, or auth prompts
   */
  private updateStatusBar(): void {
    // Phase 4.1.4: Analyzing state takes precedence (temporary)
    if (this.isAnalyzing) {
      this.statusBarItem.text = '$(sync~spin) Insight: Analyzing…';
      this.statusBarItem.tooltip = 'ODAVL Insight is analyzing your workspace';
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      return;
    }
    
    // Phase 4.1.4: Show execution mode (always visible)
    switch (this.mode) {
      case 'local':
        // Local-only mode: No cloud upload, privacy-first
        this.statusBarItem.text = '$(check) Insight: Local';
        this.statusBarItem.tooltip = 'Local analysis only (no cloud upload)';
        this.statusBarItem.backgroundColor = undefined;
        break;
      
      case 'cloud':
        // Cloud-connected mode: User authenticated, network reachable
        this.statusBarItem.text = '$(cloud) Insight: Cloud';
        this.statusBarItem.tooltip = 'Cloud analysis enabled';
        this.statusBarItem.backgroundColor = undefined;
        break;
      
      case 'offline':
        // Offline mode: Cloud enabled but network unreachable
        this.statusBarItem.text = '$(cloud-offline) Insight: Offline';
        this.statusBarItem.tooltip = 'Cloud unavailable (network unreachable)';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        break;
    }
  }
  
  dispose(): void {
    this.statusBarItem.dispose();
  }
}
