import * as vscode from 'vscode';
import { spawn } from 'child_process';
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
 * Unified CLI command helper for executing ODAVL operations
 */
async function runCLICommand(cmd: string, workspaceRoot?: string): Promise<void> {
  const wsRoot = workspaceRoot || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!wsRoot) {
    vscode.window.showErrorMessage('ODAVL requires a workspace folder to run commands.');
    return;
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

  const runCycleCommand = vscode.commands.registerCommand('odavl.runCycle', async () => {
    await runCLICommand('run');
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
    await runCLICommand('observe');
  });

  const decideCommand = vscode.commands.registerCommand('odavl.decide', async () => {
    await runCLICommand('decide');
  });

  const actCommand = vscode.commands.registerCommand('odavl.act', async () => {
    await runCLICommand('act');
  });

  const verifyCommand = vscode.commands.registerCommand('odavl.verify', async () => {
    await runCLICommand('verify');
  });

  const learnCommand = vscode.commands.registerCommand('odavl.learn', async () => {
    await runCLICommand('learn');
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