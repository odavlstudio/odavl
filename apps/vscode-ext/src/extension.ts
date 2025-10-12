import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { DashboardProvider } from './components/DashboardProvider';
import { RecipesProvider } from './components/RecipesProvider';
import { ActivityProvider } from './components/ActivityProvider';
import { ConfigProvider } from './components/ConfigProvider';
import { IntelligenceProvider } from './components/IntelligenceProvider';
import { ODAVLDataService } from './services/ODAVLDataService';
import { PerformanceMetrics } from './utils/PerformanceMetrics';
import { AnalyticsView } from './views/AnalyticsView';
import { ControlDashboard } from './views/ControlDashboard';
import { Logger } from './utils/Logger';

class ODAVLItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly phase?: string,
    public readonly status?: string
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label} - Click to run this phase`;
    this.contextValue = phase || 'root';
    
    // Link phase items to their corresponding commands
    if (phase) {
      this.command = {
        command: `odavl.${phase.toLowerCase()}`,
        title: `Run ${phase}`,
        arguments: []
      };
    }
    
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

/**
 * Update status bar with current ODAVL system state
 */
function updateStatusBar(statusBarItem: vscode.StatusBarItem, state: 'active' | 'updated' | 'running', dataService?: ODAVLDataService): void {
  const metrics = dataService?.getCurrentMetrics();
  const hasIssues = metrics && (metrics.eslintWarnings > 0 || metrics.typeErrors > 0);
  
  let icon = '$(pulse)';
  let text = 'ODAVL Control';
  let color = undefined;
  
  if (state === 'running') {
    icon = '$(sync~spin)';
    text = 'ODAVL Running...';
    color = '#00d4ff';
  } else if (hasIssues && metrics) {
    icon = '$(warning)';
    text = `ODAVL ${metrics.eslintWarnings + metrics.typeErrors} issues`;
    color = '#f59e0b';
  } else if (metrics) {
    icon = '$(check)';
    text = 'ODAVL ✓ Clean';
    color = '#10b981';
  }
  
  statusBarItem.text = `${icon} ${text}`;
  statusBarItem.color = color;
  statusBarItem.tooltip = dataService 
    ? `ODAVL Control - ESLint: ${metrics?.eslintWarnings || 0}, Types: ${metrics?.typeErrors || 0}`
    : 'ODAVL Control - Click to open dashboard';
  statusBarItem.command = 'odavl.control';
  statusBarItem.show();
}

/**
 * Unified CLI command helper for executing ODAVL operations
 */
async function runCLICommand(cmd: string, workspaceRoot?: string, statusBarItem?: vscode.StatusBarItem, dataService?: ODAVLDataService): Promise<void> {
  const wsRoot = workspaceRoot || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!wsRoot) {
    vscode.window.showErrorMessage('ODAVL requires a workspace folder to run commands.');
    return;
  }

  // Update status bar to show running state
  if (statusBarItem) {
    updateStatusBar(statusBarItem, 'running', dataService);
  }

  // Determine the appropriate command to use
  let command = 'pnpm';
  let args: string[] = [];
  
  if (cmd === 'run') {
    args = ['odavl:run'];
  } else if (cmd === 'observe') {
    args = ['odavl:observe'];
  } else if (cmd === 'decide') {
    args = ['odavl:decide'];
  } else if (cmd === 'act') {
    args = ['odavl:act'];
  } else if (cmd === 'verify') {
    args = ['odavl:verify'];
  } else {
    args = [cmd];
  }

  // Check if we can use the built CLI directly
  try {
    const cliPath = path.join(wsRoot, 'apps', 'cli', 'dist', 'index.js');
    if (fs.existsSync(cliPath)) {
      command = 'node';
      args = [cliPath, cmd];
    }
  } catch {
    // Fall back to pnpm command
  }

  const terminal = vscode.window.createTerminal({
    name: `ODAVL ${cmd}`,
    cwd: wsRoot
  });

  terminal.sendText(`${command} ${args.join(' ')}`);
  terminal.show();

  // Reset status bar after a short delay (assuming command completes)
  setTimeout(() => {
    if (statusBarItem) {
      updateStatusBar(statusBarItem, 'active', dataService);
    }
  }, 5000);
}

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
  
  // Initialize global logger
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const logger = new Logger(workspaceRoot);
  
  logger.info('ODAVL VS Code extension activating...', 'Extension');
  
  // Initialize ODAVL data service
  const dataService = workspaceRoot ? new ODAVLDataService(workspaceRoot) : undefined;
  
  // Create enhanced status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  updateStatusBar(statusBarItem, 'active', dataService);
  context.subscriptions.push(statusBarItem);
  
  // Setup status bar updates when data changes
  if (dataService) {
    dataService.onMetricsChanged(() => {
      updateStatusBar(statusBarItem, 'updated', dataService);
    });
  }
  
  logger.success('ODAVL extension activated successfully!', 'Extension');

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
  
  // Dispose services when extension is deactivated
  if (dataService) {
    context.subscriptions.push({ dispose: () => dataService.dispose() });
  }
  context.subscriptions.push({ dispose: () => logger.dispose() });

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

  const runCycleCommand = vscode.commands.registerCommand('odavl.runCycle', async () => {
    await runCLICommand('run', workspaceRoot, statusBarItem, dataService);
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

  // Individual ODAVL phase commands for tree item interaction
  const observeCommand = vscode.commands.registerCommand('odavl.observe', async () => {
    await runCLICommand('observe', workspaceRoot, statusBarItem, dataService);
  });

  const decideCommand = vscode.commands.registerCommand('odavl.decide', async () => {
    await runCLICommand('decide', workspaceRoot, statusBarItem, dataService);
  });

  const actCommand = vscode.commands.registerCommand('odavl.act', async () => {
    await runCLICommand('act', workspaceRoot, statusBarItem, dataService);
  });

  const verifyCommand = vscode.commands.registerCommand('odavl.verify', async () => {
    await runCLICommand('verify', workspaceRoot, statusBarItem, dataService);
  });

  const learnCommand = vscode.commands.registerCommand('odavl.learn', async () => {
    await runCLICommand('learn', workspaceRoot, statusBarItem, dataService);
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
    refreshIntelligenceCommand,
    observeCommand,
    decideCommand,
    actCommand,
    verifyCommand,
    learnCommand
  );
}

export function deactivate() {
  // Extension cleanup logic would go here
}