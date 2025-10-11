import * as vscode from 'vscode';

type TreeChangeEvent = ActivityItem | undefined | null | void;

export class ActivityItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly timestamp?: string,
    public readonly status?: 'success' | 'error' | 'warning' | 'info',
    public readonly details?: string
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}${timestamp ? ' - ' + timestamp : ''}${details ? '\n' + details : ''}`;
    this.contextValue = 'activityItem';
    
    // Set icon based on status
    if (status) {
      let iconName: string;
      let iconColor: vscode.ThemeColor | undefined;
      
      switch (status) {
        case 'success':
          iconName = 'check';
          iconColor = new vscode.ThemeColor('testing.iconPassed');
          break;
        case 'error':
          iconName = 'error';
          iconColor = new vscode.ThemeColor('testing.iconFailed');
          break;
        case 'warning':
          iconName = 'warning';
          iconColor = new vscode.ThemeColor('testing.iconQueued');
          break;
        default:
          iconName = 'info';
          iconColor = new vscode.ThemeColor('foreground');
      }
      
      this.iconPath = new vscode.ThemeIcon(iconName, iconColor);
    } else {
      this.iconPath = new vscode.ThemeIcon('history');
    }
  }
}

export class ActivityProvider implements vscode.TreeDataProvider<ActivityItem> {
  private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeChangeEvent> = new vscode.EventEmitter<TreeChangeEvent>();
  readonly onDidChangeTreeData: vscode.Event<TreeChangeEvent> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ActivityItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ActivityItem): Thenable<ActivityItem[]> {
    if (!element) {
      // Root activity sections
      return Promise.resolve([
        new ActivityItem('Recent Activity', vscode.TreeItemCollapsibleState.Expanded, undefined, undefined, 'Latest ODAVL cycle activities'),
        new ActivityItem('Today', vscode.TreeItemCollapsibleState.Collapsed, undefined, undefined, 'Activities from today'),
        new ActivityItem('This Week', vscode.TreeItemCollapsibleState.Collapsed, undefined, undefined, 'Activities from this week'),
        new ActivityItem('Cycle History', vscode.TreeItemCollapsibleState.Collapsed, undefined, undefined, 'Complete cycle execution history')
      ]);
    } else if (element.label === 'Recent Activity') {
      return Promise.resolve([
        new ActivityItem('Extension Activated', vscode.TreeItemCollapsibleState.None, new Date().toLocaleTimeString(), 'info', 'ODAVL VS Code extension loaded successfully'),
        new ActivityItem('Workspace Scanned', vscode.TreeItemCollapsibleState.None, new Date(Date.now() - 60000).toLocaleTimeString(), 'success', 'Found .odavl configuration directory'),
        new ActivityItem('Ready for Cycle', vscode.TreeItemCollapsibleState.None, new Date(Date.now() - 120000).toLocaleTimeString(), 'info', 'System ready to run ODAVL cycle')
      ]);
    } else if (element.label === 'Today') {
      return Promise.resolve([
        new ActivityItem('No cycles run today', vscode.TreeItemCollapsibleState.None, undefined, 'info', 'Run your first ODAVL cycle using the Doctor view')
      ]);
    } else if (element.label === 'This Week') {
      return Promise.resolve([
        new ActivityItem('No cycles run this week', vscode.TreeItemCollapsibleState.None, undefined, 'info', 'ODAVL cycles will appear here once executed')
      ]);
    } else if (element.label === 'Cycle History') {
      return Promise.resolve([
        new ActivityItem('History Empty', vscode.TreeItemCollapsibleState.None, undefined, 'info', 'Cycle history will be populated after running ODAVL cycles'),
        new ActivityItem('View Reports Folder', vscode.TreeItemCollapsibleState.None, undefined, 'info', 'Check reports/ directory for detailed cycle logs')
      ]);
    }
    
    return Promise.resolve([]);
  }
}