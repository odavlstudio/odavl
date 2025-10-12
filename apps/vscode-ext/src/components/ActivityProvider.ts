import * as vscode from 'vscode';
import { ODAVLDataService } from '../services/ODAVLDataService';
import { HistoryEntry } from '../types/ODAVLTypes';

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
  private readonly dataService?: ODAVLDataService;

  constructor(dataService?: ODAVLDataService) {
    this.dataService = dataService;
    this.dataService?.onHistoryChanged(() => this.refresh());
  }

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
      const history = this.dataService?.getHistoryEntries(5) || [];
      if (history.length === 0) {
        return Promise.resolve([
          new ActivityItem('No cycles run yet', vscode.TreeItemCollapsibleState.None, undefined, 'info', 'Run your first ODAVL cycle')
        ]);
      }
      
      return Promise.resolve(history.map(entry => {
        const status = entry.success ? 'success' : 'error';
        const time = new Date(entry.ts).toLocaleString();
        const details = `Decision: ${entry.decision}, Gates: ${entry.gatesPassed ? 'Passed' : 'Failed'}`;
        return new ActivityItem(`${entry.decision} Cycle`, vscode.TreeItemCollapsibleState.None, time, status, details);
      }));
    } else if (element.label === 'Today') {
      return Promise.resolve([
        new ActivityItem('No cycles run today', vscode.TreeItemCollapsibleState.None, undefined, 'info', 'Run your first ODAVL cycle using the Control panel')
      ]);
    } else if (element.label === 'This Week') {
      return Promise.resolve([
        new ActivityItem('No cycles run this week', vscode.TreeItemCollapsibleState.None, undefined, 'info', 'ODAVL cycles will appear here once executed')
      ]);
    } else if (element.label === 'Cycle History') {
      const allHistory = this.dataService?.getHistoryEntries(20) || [];
      if (allHistory.length === 0) {
        return Promise.resolve([
          new ActivityItem('History Empty', vscode.TreeItemCollapsibleState.None, undefined, 'info', 'Cycle history will be populated after running ODAVL cycles')
        ]);
      }

      return Promise.resolve(allHistory.map(entry => {
        const status = entry.success ? 'success' : 'error';
        const time = new Date(entry.ts).toLocaleString();
        const deltaText = `ESLint: ${entry.deltas.eslint}, Types: ${entry.deltas.types}`;
        return new ActivityItem(`${entry.decision}`, vscode.TreeItemCollapsibleState.None, time, status, deltaText);
      }));
    }
    
    return Promise.resolve([]);
  }
}