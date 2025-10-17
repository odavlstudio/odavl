import * as vscode from 'vscode';
import { getODAVLIcon } from '../utils/iconLoader';
import { ODAVLDataService } from '../services/ODAVLDataService';
import { Logger } from '../utils/Logger';

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
      this.iconPath = getODAVLIcon(iconName);
    }
  }
}

export class ConfigProvider implements vscode.TreeDataProvider<ConfigItem> {
  private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeChangeEvent> = new vscode.EventEmitter<TreeChangeEvent>();
  readonly onDidChangeTreeData: vscode.Event<TreeChangeEvent> = this._onDidChangeTreeData.event;
  private readonly dataService?: ODAVLDataService;

  private readonly logger = new Logger();
  constructor(dataService?: ODAVLDataService) {
    this.dataService = dataService;
    this.dataService?.onConfigChanged(() => this.refresh());
  }

  refresh(): void {
    const perfEnabled = vscode.workspace.getConfiguration('odavl').get('enablePerfMetrics', false);
    let t0: number | undefined;
    if (perfEnabled) t0 = performance.now();
    this._onDidChangeTreeData.fire();
    if (perfEnabled && t0 !== undefined) {
      const t1 = performance.now();
      this.logger.info(`[Perf] ConfigProvider.refresh: ${(t1 - t0).toFixed(2)}ms`);
    }
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }

  getTreeItem(element: ConfigItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ConfigItem): Promise<ConfigItem[]> {
    const perfEnabled = vscode.workspace.getConfiguration('odavl').get('enablePerfMetrics', false);
    let t0: number | undefined;
    if (perfEnabled) t0 = performance.now();
    let items: ConfigItem[] = [];
    if (!element) {
      items = this.getRootSectionItems();
    } else if (element.label === 'ODAVL Configuration') {
      items = this.getODAVLConfigItems();
    } else if (element.label === 'Safety Gates') {
      items = await this.getSafetyGatesItems();
    } else if (element.label === 'Risk Policy') {
      items = await this.getRiskPolicyItems();
    } else if (element.label === 'Extension Settings') {
      items = this.getExtensionSettingsItems();
    } else if (element.label === 'Configuration Files') {
      items = this.getConfigFilesItems();
    }
    if (perfEnabled && t0 !== undefined) {
      const t1 = performance.now();
      this.logger.info(`[Perf] ConfigProvider.getChildren: ${(t1 - t0).toFixed(2)}ms`);
    }
    return items;
  }

  private getRootSectionItems(): ConfigItem[] {
    return [
      new ConfigItem('ODAVL Configuration', vscode.TreeItemCollapsibleState.Expanded, 'section', undefined, false),
      new ConfigItem('Safety Gates', vscode.TreeItemCollapsibleState.Collapsed, 'section', undefined, false),
      new ConfigItem('Risk Policy', vscode.TreeItemCollapsibleState.Collapsed, 'section', undefined, false),
      new ConfigItem('Extension Settings', vscode.TreeItemCollapsibleState.Collapsed, 'section', undefined, false),
      new ConfigItem('Configuration Files', vscode.TreeItemCollapsibleState.Collapsed, 'section', undefined, false)
    ];
  }

  private getODAVLConfigItems(): ConfigItem[] {
    return [
      new ConfigItem('Workspace Root', vscode.TreeItemCollapsibleState.None, 'setting', vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || 'Not found', false),
      new ConfigItem('Config Directory', vscode.TreeItemCollapsibleState.None, 'setting', '.odavl/', false),
      new ConfigItem('Reports Directory', vscode.TreeItemCollapsibleState.None, 'setting', 'reports/', false),
      new ConfigItem('Auto-run Enabled', vscode.TreeItemCollapsibleState.None, 'setting', 'false', true),
      new ConfigItem('JSON Output', vscode.TreeItemCollapsibleState.None, 'setting', 'true', true)
    ];
  }

  private async getSafetyGatesItems(): Promise<ConfigItem[]> {
    const config = this.dataService ? await this.dataService.getConfiguration() : undefined;
    const gates = config?.gates || {};
    return [
      new ConfigItem('Type Errors Delta Max', vscode.TreeItemCollapsibleState.None, 'gates',
        this.safeToString(this.getNestedValue(gates, 'typeErrors.deltaMax')) || '0', false),
      new ConfigItem('ESLint Delta Max', vscode.TreeItemCollapsibleState.None, 'gates',
        this.safeToString(this.getNestedValue(gates, 'eslint.deltaMax')) || '0', false),
      new ConfigItem('Shadow Testing', vscode.TreeItemCollapsibleState.None, 'gates',
        this.getNestedValue(gates, 'shadow.mustPass') ? 'Required' : 'Optional', false),
      new ConfigItem('Edit Gates Config', vscode.TreeItemCollapsibleState.None, 'gates', '.odavl/gates.yml', true)
    ];
  }

  private async getRiskPolicyItems(): Promise<ConfigItem[]> {
    const config = this.dataService ? await this.dataService.getConfiguration() : undefined;
    const policy = config?.policy || {};
    return [
      new ConfigItem('Max Files Per Change', vscode.TreeItemCollapsibleState.None, 'policy',
        this.safeToString(this.getNestedValue(policy, 'riskBudget.maxFilesTouched')) || '10', false),
      new ConfigItem('Max Lines Per Change', vscode.TreeItemCollapsibleState.None, 'policy',
        this.safeToString(this.getNestedValue(policy, 'riskBudget.maxLinesPerPatch')) || '40', false),
      new ConfigItem('Autonomy Level', vscode.TreeItemCollapsibleState.None, 'policy',
        policy.autonomy?.toString() || '1', false),
      new ConfigItem('Edit Policy Config', vscode.TreeItemCollapsibleState.None, 'policy', '.odavl/policy.yml', true)
    ];
  }

  private getExtensionSettingsItems(): ConfigItem[] {
    return [
      new ConfigItem('Activity Bar Enabled', vscode.TreeItemCollapsibleState.None, 'setting', 'true', false),
      new ConfigItem('Auto-refresh Views', vscode.TreeItemCollapsibleState.None, 'setting', 'true', true),
      new ConfigItem('Show Timestamps', vscode.TreeItemCollapsibleState.None, 'setting', 'true', true),
      new ConfigItem('Enable Notifications', vscode.TreeItemCollapsibleState.None, 'setting', 'true', true)
    ];
  }

  private getConfigFilesItems(): ConfigItem[] {
    return [
      new ConfigItem('.odavl/gates.yml', vscode.TreeItemCollapsibleState.None, 'file', 'Safety gates configuration', true),
      new ConfigItem('.odavl/policy.yml', vscode.TreeItemCollapsibleState.None, 'file', 'Risk policy settings', true),
      new ConfigItem('.odavl/history.json', vscode.TreeItemCollapsibleState.None, 'file', 'Cycle execution history', false),
      new ConfigItem('eslint.config.mjs', vscode.TreeItemCollapsibleState.None, 'file', 'ESLint configuration', true),
      new ConfigItem('tsconfig.json', vscode.TreeItemCollapsibleState.None, 'file', 'TypeScript configuration', true)
    ];
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      return (current && typeof current === 'object' && key in current)
        ? (current as Record<string, unknown>)[key]
        : undefined;
    }, obj);
  }

  private safeToString(value: unknown): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return undefined;
  }
}
