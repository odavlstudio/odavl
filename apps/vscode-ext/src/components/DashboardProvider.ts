import { DashboardTree } from '../ui/DashboardTree';
import { DashboardLogic } from '../logic/DashboardLogic';
import * as vscode from 'vscode';
import { getODAVLIcon } from '../utils/iconLoader';
import { DashboardDataService } from '../providers/DashboardDataService';



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
      this.iconPath = getODAVLIcon(icon);
    }
  }
}

export class DashboardProvider implements vscode.TreeDataProvider<DashboardItem> {
  private readonly dataService?: DashboardDataService;
  private readonly logic?: DashboardLogic;
  private readonly tree?: DashboardTree;

  constructor(dataService?: DashboardDataService) {
    this.dataService = dataService;
    this.logic = dataService ? new DashboardLogic(dataService) : undefined;
    this.tree = this.logic ? new DashboardTree(this.logic) : undefined;
    this.dataService?.onDidChange(() => this.refresh());
  }

  get onDidChangeTreeData() {
    return this.tree?.onDidChangeTreeData;
  }

  refresh(): void {
    this.tree?.refresh();
  }

  dispose(): void {
    this.tree?.dispose();
  }

  getTreeItem(element: DashboardItem): vscode.TreeItem {
    if (this.tree) {
      return this.tree.getTreeItem(element);
    }
    // fallback: return a default TreeItem if tree is not initialized
    return new DashboardItem(element.label, element.collapsibleState, element.value, element.icon);
  }

  getChildren(element?: DashboardItem): Thenable<DashboardItem[]> {
    return this.tree?.getChildren(element) ?? Promise.resolve([]);
  }
}
