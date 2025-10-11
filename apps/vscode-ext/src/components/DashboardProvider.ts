import * as vscode from 'vscode';

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
      return Promise.resolve([
        new DashboardItem('ESLint', vscode.TreeItemCollapsibleState.None, 'Ready', 'check'),
        new DashboardItem('TypeScript', vscode.TreeItemCollapsibleState.None, 'Ready', 'check'),
        new DashboardItem('ODAVL Config', vscode.TreeItemCollapsibleState.None, 'Loaded', 'settings-gear')
      ]);
    } else if (element.label === 'Quality Metrics') {
      return Promise.resolve([
        new DashboardItem('Warnings', vscode.TreeItemCollapsibleState.None, '0', 'warning'),
        new DashboardItem('Errors', vscode.TreeItemCollapsibleState.None, '0', 'error'),
        new DashboardItem('Code Coverage', vscode.TreeItemCollapsibleState.None, 'N/A', 'shield')
      ]);
    } else if (element.label === 'Last Run Results') {
      return Promise.resolve([
        new DashboardItem('Last Cycle', vscode.TreeItemCollapsibleState.None, 'Never', 'clock'),
        new DashboardItem('Duration', vscode.TreeItemCollapsibleState.None, '-', 'stopwatch'),
        new DashboardItem('Files Changed', vscode.TreeItemCollapsibleState.None, '0', 'file')
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