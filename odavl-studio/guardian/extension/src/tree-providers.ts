import * as vscode from 'vscode';
import { GuardianApiClient } from './api-client';

interface TestItem {
  id: string;
  name: string;
  url: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
}

class TestTreeItem extends vscode.TreeItem {
  constructor(
    public readonly test: TestItem,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(test.name, collapsibleState);
    this.tooltip = `${test.url}\nSchedule: ${test.schedule}`;
    this.description = test.enabled ? '✓ Enabled' : '✗ Disabled';
    this.contextValue = 'test';
    this.iconPath = new vscode.ThemeIcon(
      test.enabled ? 'check-circle' : 'circle-slash'
    );

    this.command = {
      command: 'guardian.showTestDetails',
      title: 'Show Test Details',
      arguments: [test],
    };
  }
}

export class TestsProvider implements vscode.TreeDataProvider<TestTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TestTreeItem | undefined | null>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private apiClient: GuardianApiClient) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: TestTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TestTreeItem): Promise<TestTreeItem[]> {
    if (element) {
      return [];
    }

    const tests = await this.apiClient.getTests();
    return tests.map(
      (test) => new TestTreeItem(test, vscode.TreeItemCollapsibleState.None)
    );
  }
}

interface Alert {
  id: string;
  ruleId: string;
  testId: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'acknowledged' | 'resolved' | 'failed';
  createdAt: string;
}

class AlertTreeItem extends vscode.TreeItem {
  constructor(
    public readonly alert: Alert,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(alert.title, collapsibleState);
    this.tooltip = alert.message;
    this.description = `${alert.severity} • ${alert.status}`;
    this.contextValue = 'alert';

    const iconMap = {
      critical: 'error',
      high: 'warning',
      medium: 'info',
      low: 'circle',
      info: 'info',
    };
    this.iconPath = new vscode.ThemeIcon(iconMap[alert.severity]);

    this.command = {
      command: 'guardian.showAlertDetails',
      title: 'Show Alert Details',
      arguments: [alert],
    };
  }
}

export class AlertsProvider implements vscode.TreeDataProvider<AlertTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<AlertTreeItem | undefined | null>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private apiClient: GuardianApiClient) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: AlertTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: AlertTreeItem): Promise<AlertTreeItem[]> {
    if (element) {
      return [];
    }

    const alerts = await this.apiClient.getAlerts({
      status: 'pending',
      limit: 50,
    });
    return alerts.map(
      (alert) => new AlertTreeItem(alert, vscode.TreeItemCollapsibleState.None)
    );
  }
}

interface TrendItem {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
}

class TrendTreeItem extends vscode.TreeItem {
  constructor(
    public readonly item: TrendItem,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(item.label, collapsibleState);
    this.description = item.value;
    this.contextValue = 'trend';

    if (item.trend) {
      const iconMap = {
        up: 'arrow-up',
        down: 'arrow-down',
        stable: 'arrow-right',
      };
      this.iconPath = new vscode.ThemeIcon(iconMap[item.trend]);
    }
  }
}

export class TrendsProvider implements vscode.TreeDataProvider<TrendTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TrendTreeItem | undefined | null>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private apiClient: GuardianApiClient) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: TrendTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TrendTreeItem): Promise<TrendTreeItem[]> {
    if (element) {
      return [];
    }

    // For demo purposes, show aggregated trends
    // In production, this would query all tests and aggregate
    const items: TrendItem[] = [
      { label: 'Overall Score', value: '85/100', trend: 'up' },
      { label: 'Success Rate', value: '94%', trend: 'up' },
      { label: 'Active Alerts', value: '3', trend: 'down' },
      { label: 'Tests Run', value: '156', trend: 'stable' },
    ];

    return items.map(
      (item) => new TrendTreeItem(item, vscode.TreeItemCollapsibleState.None)
    );
  }
}
