import * as vscode from 'vscode';
import { ODAVLDataService } from '../services/ODAVLDataService';
import { SystemMetrics, HistoryEntry } from '../types/ODAVLTypes';

type TreeChangeEvent = DashboardItem | undefined | null | void;

export class DashboardItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly value?: string,
    public readonly icon?: string
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}${value ? ': ' + value : ''}`;
    this.contextValue = 'dashboardItem';
    
    if (icon) {
      this.iconPath = new vscode.ThemeIcon(icon);
    }
  }
}

export class DashboardProvider implements vscode.TreeDataProvider<DashboardItem> {
  private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeChangeEvent> = new vscode.EventEmitter<TreeChangeEvent>();
  readonly onDidChangeTreeData: vscode.Event<TreeChangeEvent> = this._onDidChangeTreeData.event;
  private readonly dataService?: ODAVLDataService;

  constructor(dataService?: ODAVLDataService) {
    this.dataService = dataService;
    this.dataService?.onMetricsChanged(() => this.refresh());
    this.dataService?.onHistoryChanged(() => this.refresh());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: DashboardItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: DashboardItem): Thenable<DashboardItem[]> {
    if (!element) {
      // Root dashboard items
      return Promise.resolve([
        new DashboardItem('System Status', vscode.TreeItemCollapsibleState.Collapsed, undefined, 'pulse'),
        new DashboardItem('Quality Metrics', vscode.TreeItemCollapsibleState.Collapsed, undefined, 'graph'),
        new DashboardItem('Last Run Results', vscode.TreeItemCollapsibleState.Collapsed, undefined, 'history'),
        new DashboardItem('Quick Actions', vscode.TreeItemCollapsibleState.Collapsed, undefined, 'rocket')
      ]);
    } else if (element.label === 'System Status') {
      const metrics = this.dataService?.getCurrentMetrics();
      return Promise.resolve([
        new DashboardItem('ESLint', vscode.TreeItemCollapsibleState.None, 
          metrics ? `${metrics.eslintWarnings} warnings` : 'Loading...', 
          metrics?.eslintWarnings === 0 ? 'check' : 'warning'),
        new DashboardItem('TypeScript', vscode.TreeItemCollapsibleState.None, 
          metrics ? `${metrics.typeErrors} errors` : 'Loading...', 
          metrics?.typeErrors === 0 ? 'check' : 'error'),
        new DashboardItem('ODAVL Config', vscode.TreeItemCollapsibleState.None, 
          this.dataService ? 'Loaded' : 'Not Connected', 'settings-gear')
      ]);
    } else if (element.label === 'Quality Metrics') {
      const metrics = this.dataService?.getCurrentMetrics();
      return Promise.resolve([
        new DashboardItem('Warnings', vscode.TreeItemCollapsibleState.None, 
          metrics ? metrics.eslintWarnings.toString() : 'Loading...', 'warning'),
        new DashboardItem('Errors', vscode.TreeItemCollapsibleState.None, 
          metrics ? metrics.typeErrors.toString() : 'Loading...', 'error'),
        new DashboardItem('Code Coverage', vscode.TreeItemCollapsibleState.None, 'N/A', 'shield')
      ]);
    } else if (element.label === 'Last Run Results') {
      const history = this.dataService?.getHistoryEntries(1);
      const lastRun = history?.[0];
      return Promise.resolve([
        new DashboardItem('Last Cycle', vscode.TreeItemCollapsibleState.None, 
          lastRun ? new Date(lastRun.ts).toLocaleString() : 'Never', 'clock'),
        new DashboardItem('Decision', vscode.TreeItemCollapsibleState.None, 
          lastRun?.decision || 'None', lastRun?.success ? 'check' : 'error'),
        new DashboardItem('Gates Passed', vscode.TreeItemCollapsibleState.None, 
          lastRun?.gatesPassed ? 'Yes' : 'No', lastRun?.gatesPassed ? 'check' : 'x')
      ]);
    } else if (element.label === 'Quick Actions') {
      return Promise.resolve([
        new DashboardItem('Run Full Cycle', vscode.TreeItemCollapsibleState.None, undefined, 'play'),
        new DashboardItem('Observe Only', vscode.TreeItemCollapsibleState.None, undefined, 'eye'),
        new DashboardItem('View Reports', vscode.TreeItemCollapsibleState.None, undefined, 'list-unordered')
      ]);
    }
    
    return Promise.resolve([]);
  }
}