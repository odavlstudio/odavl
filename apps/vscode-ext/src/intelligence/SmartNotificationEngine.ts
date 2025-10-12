import * as vscode from 'vscode';
import { SmartAlert } from '../types/IntelligenceTypes';
import { HistoryEntry, SystemMetrics } from '../types/ODAVLTypes';

/**
 * Smart Notification Engine - Context-aware alert system for ODAVL Phase 3
 * Provides intelligent notifications with adaptive frequency and priority scoring
 */
export class SmartNotificationEngine {
  private lastNotification = new Map<string, number>();
  private readonly MIN_INTERVAL = 300000; // 5 minutes minimum between similar notifications
  
  /**
   * Process quality metrics and generate smart alerts
   */
  public processQualityMetrics(current: SystemMetrics, history: HistoryEntry[]): SmartAlert[] {
    const alerts: SmartAlert[] = [];
    
    // Quality degradation detection
    if (this.detectQualityDegradation(current, history)) {
      const alert = this.createQualityAlert(current, history);
      if (this.shouldShowAlert(alert)) {
        alerts.push(alert);
      }
    }
    
    // Performance optimization detection
    const optimizationAlert = this.detectOptimizationOpportunity(current, history);
    if (optimizationAlert && this.shouldShowAlert(optimizationAlert)) {
      alerts.push(optimizationAlert);
    }
    
    return alerts;
  }

  /**
   * Show notification with VS Code integration
   */
  public async showAlert(alert: SmartAlert): Promise<void> {
    let showFunction;
    
    switch (alert.severity) {
      case 'high':
        showFunction = vscode.window.showErrorMessage;
        break;
      case 'medium':
        showFunction = vscode.window.showWarningMessage;
        break;
      default:
        showFunction = vscode.window.showInformationMessage;
    }
    
    const actions = alert.actions.map(a => a.label);
    const result = await showFunction(alert.message, ...actions);
    
    if (result) {
      const action = alert.actions.find(a => a.label === result);
      if (action) {
        await vscode.commands.executeCommand(action.command);
      }
    }
    
    this.recordNotification(alert);
  }

  private detectQualityDegradation(current: SystemMetrics, history: HistoryEntry[]): boolean {
    if (history.length < 3) return false;
    
    const recent = history.slice(-3);
    const avgPrevious = recent.reduce((sum, h) => sum + h.before.eslintWarnings, 0) / recent.length;
    
    return current.eslintWarnings > avgPrevious * 1.5; // 50% increase threshold
  }

  private createQualityAlert(current: SystemMetrics, history: HistoryEntry[]): SmartAlert {
    const recent = history.slice(-3);
    const avgPrevious = recent.reduce((sum, h) => sum + h.before.eslintWarnings, 0) / recent.length;
    const increase = Math.round(((current.eslintWarnings - avgPrevious) / avgPrevious) * 100);
    
    return {
      id: `quality-${Date.now()}`,
      type: 'quality_degradation',
      severity: increase > 100 ? 'high' : 'medium',
      title: 'Quality Degradation Detected',
      message: `ESLint warnings increased by ${increase}% (${Math.round(avgPrevious)} → ${current.eslintWarnings})`,
      actions: [
        { label: 'Run Quality Check', command: 'odavl.runCycle' },
        { label: 'View Analytics', command: 'odavl.showAnalytics' }
      ],
      metadata: { increase: increase.toString(), current: current.eslintWarnings.toString() }
    };
  }

  private detectOptimizationOpportunity(current: SystemMetrics, history: HistoryEntry[]): SmartAlert | null {
    if (history.length < 5) return null;
    
    const recentSuccessRate = history.slice(-5).filter(h => h.success).length / 5;
    if (recentSuccessRate > 0.8) { // 80% success rate suggests optimization opportunity
      return {
        id: `optimization-${Date.now()}`,
        type: 'optimization',
        severity: 'low',
        title: 'Optimization Opportunity',
        message: `High success rate (${Math.round(recentSuccessRate * 100)}%) - consider proactive improvements`,
        actions: [
          { label: 'View Recommendations', command: 'odavl.showIntelligence' },
          { label: 'Run Analysis', command: 'odavl.analyzePerformance' }
        ],
        metadata: { successRate: recentSuccessRate.toString() }
      };
    }
    
    return null;
  }

  private shouldShowAlert(alert: SmartAlert): boolean {
    const lastTime = this.lastNotification.get(alert.type) || 0;
    const now = Date.now();
    return (now - lastTime) > this.MIN_INTERVAL;
  }

  private recordNotification(alert: SmartAlert): void {
    this.lastNotification.set(alert.type, Date.now());
  }
}