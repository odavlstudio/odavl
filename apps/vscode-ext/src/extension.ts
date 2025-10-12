import * as vscode from 'vscode';
import { DashboardProvider } from './components/DashboardProvider';
import { RecipesProvider } from './components/RecipesProvider';
import { ActivityProvider } from './components/ActivityProvider';
import { ConfigProvider } from './components/ConfigProvider';
import { IntelligenceProvider } from './components/IntelligenceProvider';
import { ODAVLDataService } from './services/ODAVLDataService';
import { PerformanceMetrics } from './utils/PerformanceMetrics';
import { AnalyticsView } from './views/AnalyticsView';
import { ControlDashboard } from './views/ControlDashboard';

class ODAVLItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly phase?: string,
    public readonly status?: string
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
    this.contextValue = phase || 'root';
    
    if (status) {
      let iconName: string;
      if (status === 'success') {
        iconName = 'check';
      } else if (status === 'error') {
        iconName = 'error';
      } else if (status === 'running') {
        iconName = 'sync~spin';
      } else {
        iconName = 'circle-outline';
      }
      this.iconPath = new vscode.ThemeIcon(iconName);
    }
  }
}

type TreeChangeEvent = ODAVLItem | undefined | null | void;

class ODAVLTreeDataProvider implements vscode.TreeDataProvider<ODAVLItem> {
  private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeChangeEvent> = new vscode.EventEmitter<TreeChangeEvent>();
  readonly onDidChangeTreeData: vscode.Event<TreeChangeEvent> = this._onDidChangeTreeData.event;

  private readonly cycleStatus: { [key: string]: string } = {};

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ODAVLItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ODAVLItem): Thenable<ODAVLItem[]> {
    if (!element) {
      return Promise.resolve([
        new ODAVLItem('Observe', vscode.TreeItemCollapsibleState.None, 'observe', this.cycleStatus['observe']),
        new ODAVLItem('Decide', vscode.TreeItemCollapsibleState.None, 'decide', this.cycleStatus['decide']),
        new ODAVLItem('Act', vscode.TreeItemCollapsibleState.None, 'act', this.cycleStatus['act']),
        new ODAVLItem('Verify', vscode.TreeItemCollapsibleState.None, 'verify', this.cycleStatus['verify']),
        new ODAVLItem('Learn', vscode.TreeItemCollapsibleState.None, 'learn', this.cycleStatus['learn'])
      ]);
    }
    return Promise.resolve([]);
  }
}

export function activate(context: vscode.ExtensionContext) {
  const activationStart = performance.now();
  
  // Log activation to console
  console.log('ODAVL VS Code extension is now active!');
  
  // Initialize ODAVL data service
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const dataService = workspaceRoot ? new ODAVLDataService(workspaceRoot) : undefined;
  
  // Create status bar item for better UX
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.text = "$(pulse) ODAVL Control Active";
  statusBarItem.tooltip = "ODAVL autonomous code quality system is active";
  statusBarItem.command = 'odavl.control';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
  
  // Show activation confirmation
  vscode.window.showInformationMessage("ODAVL extension activated!");

  // Create all tree data providers with data service integration
  const controlProvider = new ODAVLTreeDataProvider();
  const dashboardProvider = new DashboardProvider(dataService);
  const recipesProvider = new RecipesProvider(dataService);
  const activityProvider = new ActivityProvider(dataService);
  const configProvider = new ConfigProvider(dataService);
  
  // Phase 3: Initialize intelligence features (only if dataService available)
  const intelligenceProvider = dataService ? new IntelligenceProvider(dataService) : undefined;
  
  // Phase 3: Performance monitoring
  const performanceMetrics = PerformanceMetrics;
  
  // Dispose data service when extension is deactivated
  if (dataService) {
    context.subscriptions.push({ dispose: () => dataService.dispose() });
  }

  // Register tree view providers  
  vscode.window.registerTreeDataProvider('odavlControl', controlProvider);
  vscode.window.registerTreeDataProvider('odavlDashboard', dashboardProvider);
  vscode.window.registerTreeDataProvider('odavlRecipes', recipesProvider);
  vscode.window.registerTreeDataProvider('odavlActivity', activityProvider);
  vscode.window.registerTreeDataProvider('odavlConfig', configProvider);
  
  if (intelligenceProvider) {
    vscode.window.registerTreeDataProvider('odavlIntelligence', intelligenceProvider);
  }

  // Phase 4: Initialize Control Dashboard (only if dataService available)
  const controlDashboard = dataService ? new ControlDashboard(context, dataService) : undefined;

  // Register commands
  const controlCommand = vscode.commands.registerCommand('odavl.control', () => {
    if (controlDashboard) {
      controlDashboard.show();
    } else {
      vscode.window.showWarningMessage('ODAVL Control requires a workspace to be opened.');
    }
  });

  const runCycleCommand = vscode.commands.registerCommand('odavl.runCycle', () => {
    vscode.commands.executeCommand('odavl.control');
  });

  const refreshCommand = vscode.commands.registerCommand('odavl.refresh', () => {
    controlProvider.refresh();
    dashboardProvider.refresh();
    recipesProvider.refresh();
    activityProvider.refresh();
    configProvider.refresh();
  });

  // Add individual refresh commands for each view
  const refreshDashboardCommand = vscode.commands.registerCommand('odavl.refreshDashboard', () => {
    dashboardProvider.refresh();
  });

  const refreshRecipesCommand = vscode.commands.registerCommand('odavl.refreshRecipes', () => {
    recipesProvider.refresh();
  });

  const refreshActivityCommand = vscode.commands.registerCommand('odavl.refreshActivity', () => {
    activityProvider.refresh();
  });

  const refreshConfigCommand = vscode.commands.registerCommand('odavl.refreshConfig', () => {
    configProvider.refresh();
  });

  const refreshIntelligenceCommand = vscode.commands.registerCommand('odavl.refreshIntelligence', () => {
    if (intelligenceProvider) {
      intelligenceProvider.refresh();
    }
  });

  // Phase 3: Analytics command
  const analyticsCommand = vscode.commands.registerCommand('odavl.analytics', () => {
    if (dataService) {
      const analyticsView = new AnalyticsView(context);
      analyticsView.show();
    } else {
      vscode.window.showWarningMessage('Analytics requires a workspace to be opened.');
    }
  });

  // Performance tracking
  const activationEnd = performance.now();
  const activationTime = activationEnd - activationStart;
  performanceMetrics.recordActivation(activationTime);

  // Register all commands for disposal
  context.subscriptions.push(
    controlCommand, 
    runCycleCommand, 
    refreshCommand,
    refreshDashboardCommand,
    refreshRecipesCommand,
    refreshActivityCommand,
    refreshConfigCommand,
    analyticsCommand,
    refreshIntelligenceCommand
  );
}

export function deactivate() {
  // Extension cleanup logic would go here
}