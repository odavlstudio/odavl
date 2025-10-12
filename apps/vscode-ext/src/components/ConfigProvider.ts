import * as vscode from 'vscode';
import { ODAVLDataService } from '../services/ODAVLDataService';

type TreeChangeEvent = ConfigItem | undefined | null | void;

export class ConfigItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly configType?: string,
    public readonly value?: string,
    public readonly editable?: boolean
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}${value ? ': ' + value : ''}${editable ? ' (Click to edit)' : ''}`;
    this.contextValue = configType || 'configItem';
    
    // Set icon based on config type
    if (configType) {
      let iconName: string;
      switch (configType) {
        case 'section':
          iconName = 'folder';
          break;
        case 'policy':
          iconName = 'shield';
          break;
        case 'gates':
          iconName = 'lock';
          break;
        case 'setting':
          iconName = editable ? 'edit' : 'gear';
          break;
        case 'file':
          iconName = 'file';
          break;
        default:
          iconName = 'settings-gear';
      }
      this.iconPath = new vscode.ThemeIcon(iconName);
    }
  }
}

export class ConfigProvider implements vscode.TreeDataProvider<ConfigItem> {
  private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeChangeEvent> = new vscode.EventEmitter<TreeChangeEvent>();
  readonly onDidChangeTreeData: vscode.Event<TreeChangeEvent> = this._onDidChangeTreeData.event;
  private readonly dataService?: ODAVLDataService;

  constructor(dataService?: ODAVLDataService) {
    this.dataService = dataService;
    this.dataService?.onConfigChanged(() => this.refresh());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ConfigItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ConfigItem): Thenable<ConfigItem[]> {
    if (!element) {
      // Root configuration sections
      return Promise.resolve([
        new ConfigItem('ODAVL Configuration', vscode.TreeItemCollapsibleState.Expanded, 'section', undefined, false),
        new ConfigItem('Safety Gates', vscode.TreeItemCollapsibleState.Collapsed, 'section', undefined, false),
        new ConfigItem('Risk Policy', vscode.TreeItemCollapsibleState.Collapsed, 'section', undefined, false),
        new ConfigItem('Extension Settings', vscode.TreeItemCollapsibleState.Collapsed, 'section', undefined, false),
        new ConfigItem('Configuration Files', vscode.TreeItemCollapsibleState.Collapsed, 'section', undefined, false)
      ]);
    } else if (element.label === 'ODAVL Configuration') {
      return Promise.resolve([
        new ConfigItem('Workspace Root', vscode.TreeItemCollapsibleState.None, 'setting', vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || 'Not found', false),
        new ConfigItem('Config Directory', vscode.TreeItemCollapsibleState.None, 'setting', '.odavl/', false),
        new ConfigItem('Reports Directory', vscode.TreeItemCollapsibleState.None, 'setting', 'reports/', false),
        new ConfigItem('Auto-run Enabled', vscode.TreeItemCollapsibleState.None, 'setting', 'false', true),
        new ConfigItem('JSON Output', vscode.TreeItemCollapsibleState.None, 'setting', 'true', true)
      ]);
    } else if (element.label === 'Safety Gates') {
      const config = this.dataService?.getConfiguration();
      const gates = config?.gates || {};
      
      return Promise.resolve([
        new ConfigItem('Type Errors Delta Max', vscode.TreeItemCollapsibleState.None, 'gates', 
          gates.typeErrors?.deltaMax?.toString() || '0', false),
        new ConfigItem('ESLint Delta Max', vscode.TreeItemCollapsibleState.None, 'gates', 
          gates.eslint?.deltaMax?.toString() || '0', false),
        new ConfigItem('Shadow Testing', vscode.TreeItemCollapsibleState.None, 'gates', 
          gates.shadow?.mustPass ? 'Required' : 'Optional', false),
        new ConfigItem('Edit Gates Config', vscode.TreeItemCollapsibleState.None, 'gates', '.odavl/gates.yml', true)
      ]);
    } else if (element.label === 'Risk Policy') {
      const config = this.dataService?.getConfiguration();
      const policy = config?.policy || {};
      
      return Promise.resolve([
        new ConfigItem('Max Files Per Change', vscode.TreeItemCollapsibleState.None, 'policy', 
          policy.riskBudget?.maxFilesTouched?.toString() || '10', false),
        new ConfigItem('Max Lines Per Change', vscode.TreeItemCollapsibleState.None, 'policy', 
          policy.riskBudget?.maxLinesPerPatch?.toString() || '40', false),
        new ConfigItem('Autonomy Level', vscode.TreeItemCollapsibleState.None, 'policy', 
          policy.autonomy?.toString() || '1', false),
        new ConfigItem('Edit Policy Config', vscode.TreeItemCollapsibleState.None, 'policy', '.odavl/policy.yml', true)
      ]);
    } else if (element.label === 'Extension Settings') {
      return Promise.resolve([
        new ConfigItem('Activity Bar Enabled', vscode.TreeItemCollapsibleState.None, 'setting', 'true', false),
        new ConfigItem('Auto-refresh Views', vscode.TreeItemCollapsibleState.None, 'setting', 'true', true),
        new ConfigItem('Show Timestamps', vscode.TreeItemCollapsibleState.None, 'setting', 'true', true),
        new ConfigItem('Enable Notifications', vscode.TreeItemCollapsibleState.None, 'setting', 'true', true)
      ]);
    } else if (element.label === 'Configuration Files') {
      return Promise.resolve([
        new ConfigItem('.odavl/gates.yml', vscode.TreeItemCollapsibleState.None, 'file', 'Safety gates configuration', true),
        new ConfigItem('.odavl/policy.yml', vscode.TreeItemCollapsibleState.None, 'file', 'Risk policy settings', true),
        new ConfigItem('.odavl/history.json', vscode.TreeItemCollapsibleState.None, 'file', 'Cycle execution history', false),
        new ConfigItem('eslint.config.mjs', vscode.TreeItemCollapsibleState.None, 'file', 'ESLint configuration', true),
        new ConfigItem('tsconfig.json', vscode.TreeItemCollapsibleState.None, 'file', 'TypeScript configuration', true)
      ]);
    }
    
    return Promise.resolve([]);
  }
}