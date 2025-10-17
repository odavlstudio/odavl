
// The registration of the Activity Bar dashboard view provider must be inside the activate function

// ...rest of imports and code...
// --- Imports ---
import * as vscode from 'vscode';
<<<<<<< Updated upstream
import { spawn } from 'child_process';

function startODAVLProcess(panel: vscode.WebviewPanel, workspaceRoot: string | undefined) {
  if (!workspaceRoot) {
    panel.webview.postMessage({
      type: 'doctor',
      status: 'error',
      data: { phase: 'Error', msg: 'No workspace folder found' }
    });
    return;
  }

  const cli = spawn('tsx', ['apps/cli/src/index.ts', 'run', '--json'], { cwd: workspaceRoot, shell: true });
  
  cli.stdout.on('data', (data) => {
    const output = data.toString().trim();
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          // Try to parse as JSON message
          const message = JSON.parse(line);
          if (message.type === 'doctor') {
            panel.webview.postMessage(message);
          }
        } catch {
          // Fallback for non-JSON output
          panel.webview.postMessage({
            type: 'doctor',
            status: 'info',
            data: { phase: 'CLI Output', msg: line }
          });
        }
      }
    }
  });

  cli.stderr.on('data', (data) => {
    const output = data.toString();
    panel.webview.postMessage({
      type: 'doctor',
      status: 'error',
      data: { phase: 'CLI Error', msg: output.trim() }
    });
  });
  
  cli.on('close', (code) => {
    panel.webview.postMessage({
      type: 'doctor',
      status: code === 0 ? 'success' : 'error',
      data: { phase: 'Process', msg: `ODAVL cycle completed with exit code ${code}` }
    });
  });
=======
import * as fs from 'node:fs';

import * as path from 'node:path';
import { Logger } from './utils/Logger';
import { PerformanceMetrics } from './utils/PerformanceMetrics';
import { GlobalContainer } from './services/ServiceContainer';
import { ODAVLDataService } from './services/ODAVLDataService';
import { DashboardDataService } from './providers/DashboardDataService';
import { RecipesDataService } from './providers/RecipesDataService';
import {
    DashboardProvider,
    RecipesProvider,
    ActivityProvider,
    ConfigProvider,
    IntelligenceProvider,
    AnalyticsView,
    InsightsView,
    ControlDashboard
} from './providers';
import { runCycle } from './intelligence';
import { appendLog } from './logs';
import { runCLI as runCLICommand } from './intelligence/cli';
const fsPromises = require('node:fs').promises;

// --- ODAVL Tree View Types and Provider ---

// (Removed duplicate ODAVLItem and TreeChangeEvent declarations)

// --- Network/Marketplace Robust Fetch Utility ---
/**
 * Safe fetch with offline/marketplace fallback and logging.
 * Usage: await safeFetch(url, options)
 */
export async function safeFetch(url: string, options?: RequestInit, logger?: Logger): Promise<Response | undefined> {
    try {
        const res = await fetch(url, options);
        if (!res.ok) {
            logger?.warn?.(`Remote fetch failed: ${url} (${res.status})`, 'safeFetch');
            return undefined;
        }
        return res;
    } catch (err) {
        logger?.error?.(`Fetch error: ${err}`, 'safeFetch');
        return undefined;
    }
}



async function handleCompareRuns(workspace: string, msg: any, mainPanel: vscode.WebviewPanel | undefined) {
    try {
        const [id1, id2] = msg.payload || [];
        if (!id1 || !id2) {
            vscode.window.showWarningMessage('Please select two runs to compare.');
            return;
        }
        const telemetryDir = path.join(workspace, '.odavl', 'telemetry');
        const t1Path = path.join(telemetryDir, id1.endsWith('.json') ? id1 : id1 + '.json');
        const t2Path = path.join(telemetryDir, id2.endsWith('.json') ? id2 : id2 + '.json');
        const t1 = JSON.parse(await fsPromises.readFile(t1Path, 'utf8'));
        const t2 = JSON.parse(await fsPromises.readFile(t2Path, 'utf8'));
        const diff = {
            durationDelta: (t2.metrics?.totalDuration || 0) - (t1.metrics?.totalDuration || 0),
            riskDelta: (t2.riskScore || 0) - (t1.riskScore || 0),
            phaseChanges: (t1.metrics?.phases || []).map((p: any, i: number) => ({
                phase: p.phase,
                delta: ((t2.metrics?.phases?.[i]?.duration || 0) - (p.duration || 0))
            }))
        };
        mainPanel?.webview?.postMessage({ type: 'compareResult', payload: diff });
    } catch (err) {
        vscode.window.showErrorMessage('Failed to compare runs: ' + ((err as any)?.message || String(err)));
    }
}

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

// --- End ODAVL Tree View Types and Provider ---

class ODAVLTreeDataProvider implements vscode.TreeDataProvider<ODAVLItem> {
    private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeChangeEvent> = new vscode.EventEmitter<TreeChangeEvent>();
    readonly onDidChangeTreeData: vscode.Event<TreeChangeEvent> = this._onDidChangeTreeData.event;

    private cycleStatus: { [key: string]: string } = {};

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    updatePhaseStatus(phase: string, status: string): void {
        this.cycleStatus[phase] = status;
        this.refresh();
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
>>>>>>> Stashed changes
}

// Lazy initialization state
let isFullyActivated = false;
const lazyServices: {
    dataService?: ODAVLDataService;
    controlDashboard?: ControlDashboard;
    providers?: {
        dashboard: DashboardProvider;
        recipes: RecipesProvider;
        activity: ActivityProvider;
        config: ConfigProvider;
        intelligence?: IntelligenceProvider;
    };
} = {};

// Single main webview panel reference
let mainPanel: vscode.WebviewPanel | undefined;

// Helpers to post messages to the main panel
function sendStatus(status: string, data?: any) {
    mainPanel?.webview?.postMessage?.({ type: 'status', status, data });
}

function sendUpdate(payload: any) {
    mainPanel?.webview?.postMessage?.({ type: 'update', payload });
}

async function activateOnDemand(context: vscode.ExtensionContext): Promise<void> {
    if (isFullyActivated) return;
    const lazyStart = PerformanceMetrics.start('lazy-activation');
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const container = GlobalContainer;

    registerDataService(context, container, workspaceRoot);
    setupProviders(context, container);
    initializeDashboard(context);

    isFullyActivated = true;
    PerformanceMetrics.end(lazyStart, { workspaceRoot: !!workspaceRoot });
}

function registerDataService(context: vscode.ExtensionContext, container: typeof GlobalContainer, workspaceRoot?: string) {
    if (workspaceRoot && !container.has('ODAVLDataService')) {
        const ds = new ODAVLDataService(workspaceRoot);
        context.subscriptions.push({ dispose: () => ds.dispose() });
        container.register('ODAVLDataService', ds);
        lazyServices.dataService = ds;
    } else if (container.has('ODAVLDataService')) {
        lazyServices.dataService = container.resolve('ODAVLDataService');
    }
}

function setupProviders(context: vscode.ExtensionContext, container: typeof GlobalContainer) {
    if (lazyServices.providers) return;
    const dashboardDataService = container.has('ODAVLDataService') ? new DashboardDataService(container.resolve('ODAVLDataService')) : undefined;
    const recipesDataService = container.has('ODAVLDataService') ? new RecipesDataService(container.resolve('ODAVLDataService')) : undefined;
    if (dashboardDataService) container.register('DashboardDataService', dashboardDataService);
    if (recipesDataService) container.register('RecipesDataService', recipesDataService);

    const dashboardProvider = dashboardDataService ? new DashboardProvider(dashboardDataService) : undefined;
    const recipesProvider = recipesDataService ? new RecipesProvider(recipesDataService) : undefined;
    if (dashboardProvider) container.register('DashboardProvider', dashboardProvider);
    if (recipesProvider) container.register('RecipesProvider', recipesProvider);

    lazyServices.providers = {
        dashboard: dashboardProvider!,
        recipes: recipesProvider!,
        activity: new ActivityProvider(container.resolve('ODAVLDataService')),
        config: new ConfigProvider(container.resolve('ODAVLDataService')),
        intelligence: container.has('ODAVLDataService') ? new IntelligenceProvider(container.resolve('ODAVLDataService')) : undefined
    };

    // Register tree view providers
    if (dashboardProvider) vscode.window.registerTreeDataProvider('odavl.dashboard', dashboardProvider);
    if (recipesProvider) vscode.window.registerTreeDataProvider('odavl.recipes', recipesProvider);
    vscode.window.registerTreeDataProvider('odavl.activity', lazyServices.providers.activity);
    vscode.window.registerTreeDataProvider('odavl.config', lazyServices.providers.config);
    if (lazyServices.providers.intelligence) {
        vscode.window.registerTreeDataProvider('odavl.intelligence', lazyServices.providers.intelligence);
    }
}

function initializeDashboard(context: vscode.ExtensionContext) {
    if (lazyServices.dataService && !lazyServices.controlDashboard) {
        const logger = new Logger(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath);
        const aiEngine = {
            initialize: () => { },
            generateQualityForecast: () => undefined
        };
        const dataAnalyzer = {
            analyzePerformance: () => undefined
        };
        const outputChannel = vscode.window.createOutputChannel('ODAVL Control');
        context.subscriptions.push(outputChannel);
        lazyServices.controlDashboard = new ControlDashboard(
            context,
            lazyServices.dataService,
            logger,
            aiEngine,
            dataAnalyzer,
            outputChannel
        );
    }
}

// Track disposables for full cleanup
let extensionDisposables: Array<{ dispose: () => void }> = [];

export function activate(context: vscode.ExtensionContext) {
<<<<<<< Updated upstream
  const disposable = vscode.commands.registerCommand('odavl.doctor', () => {
    const panel = vscode.window.createWebviewPanel(
      'odavlDoctor',
      'ODAVL Doctor',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    const htmlContent = getWebviewContent();
    panel.webview.html = htmlContent;
    
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
      (message: { command: string; }) => {
        if (message.command === 'explain') {
          vscode.window.showInformationMessage('ODAVL Explanation: The system uses Observe-Decide-Act-Verify-Learn cycle to autonomously improve code quality.');
        } else if (message.command === 'run') {
          startODAVLProcess(panel, workspaceRoot);
        }
      },
      undefined,
      context.subscriptions
    );
  });

  context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ODAVL Doctor</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 16px; 
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .header { margin-bottom: 20px; }
        .log-entry { 
            margin: 8px 0; 
            padding: 12px; 
            border-radius: 8px; 
            animation: fadeIn 0.3s ease-in;
            font-family: 'Consolas', 'Courier New', monospace;
        }
        .log-success { 
            background-color: var(--vscode-terminal-ansiGreen);
            color: var(--vscode-terminal-background);
            border-left: 4px solid var(--vscode-terminal-ansiGreen);
        }
        .log-error { 
            background-color: var(--vscode-terminal-ansiRed);
            color: var(--vscode-terminal-background);
            border-left: 4px solid var(--vscode-terminal-ansiRed);
        }
        .log-info { 
            background-color: var(--vscode-terminal-ansiBlue);
            color: var(--vscode-terminal-background);
            border-left: 4px solid var(--vscode-terminal-ansiBlue);
        }
        .log-phase { 
            font-weight: bold; 
            margin-bottom: 4px;
            font-size: 12px;
            text-transform: uppercase;
        }
        .log-msg { font-size: 14px; }
        .explain-btn { 
            margin-top: 16px; 
            padding: 8px 16px; 
            background: var(--vscode-button-background); 
            color: var(--vscode-button-foreground); 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
        }
        .explain-btn:hover { background: var(--vscode-button-hoverBackground); }
        #logs { max-height: 500px; overflow-y: auto; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="header">
        <h2>ODAVL Doctor - Live Cycle Monitor</h2>
        <button class="explain-btn" onclick="explainODAVL()">Explain ODAVL</button>
        <button class="explain-btn" onclick="runODAVL()">Run ODAVL Cycle</button>
    </div>
    <div id="logs"></div>
    
    <script>
        const vscode = acquireVsCodeApi();
        const logsContainer = document.getElementById('logs');
        
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'doctor') {
                addLogEntry(message.data.phase, message.data.msg, message.status);
            }
        });
        
        function addLogEntry(phase, msg, status) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry log-' + status;
            logEntry.innerHTML = '<div class="log-phase">' + phase + '</div><div class="log-msg">' + msg + '</div>';
            logsContainer.appendChild(logEntry);
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }
        
        function explainODAVL() {
            vscode.postMessage({ command: 'explain' });
        }
        
        function runODAVL() {
            vscode.postMessage({ command: 'run' });
        }
        
        // Initial welcome message
        addLogEntry('Welcome', 'ODAVL Doctor initialized. Click "Run ODAVL Cycle" to start monitoring.', 'info');
    </script>
</body>
</html>`;
=======
    const activationStart = performance.now();
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';

    // Logger and output channel
    const outputChannel = vscode.window.createOutputChannel('ODAVL');
    context.subscriptions.push(outputChannel);
    extensionDisposables.push(outputChannel);

    // Status bar item to open control panel
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = '$(pulse) ODAVL Control';
    statusBarItem.tooltip = 'ODAVL Control - Click to open dashboard';
    statusBarItem.command = 'odavl.control';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    extensionDisposables.push(statusBarItem);

    // Minimal control provider for immediate tree view
    const controlProvider = new ODAVLTreeDataProvider();
    vscode.window.registerTreeDataProvider('odavl.controlPanel', controlProvider);

    // Ensure data service exists in global container
    if (workspaceRoot && !GlobalContainer.has('ODAVLDataService')) {
        const ds = new ODAVLDataService(workspaceRoot);
        context.subscriptions.push({ dispose: () => ds.dispose() });
        GlobalContainer.register('ODAVLDataService', ds);
        lazyServices.dataService = ds;
    } else if (GlobalContainer.has('ODAVLDataService')) {
        lazyServices.dataService = GlobalContainer.resolve('ODAVLDataService');
    }

    // Command to open/reveal the dashboard panel (always use ControlDashboard)
    const controlCommand = vscode.commands.registerCommand('odavl.control', async () => {
        try {
            // Ensure all services/providers are activated and registered
            await activateOnDemand(context);
            const container = GlobalContainer;
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (container.has('ODAVLDataService')) {
                console.log('[ODAVL] ODAVLDataService registered');
                // Log to runtime file as well
                try {
                    const runtimeLogPath = path.join(workspaceRoot || '', '.odavl', 'logs', 'odavl-dashboard-runtime.log');
                    fs.mkdirSync(path.dirname(runtimeLogPath), { recursive: true });
                    fs.appendFileSync(runtimeLogPath, `[${new Date().toISOString()}] [ODAVL] ODAVLDataService registered\n`);
                } catch { }
            }
            // Always use the ControlDashboard instance to show the dashboard
            if (lazyServices.controlDashboard) {
                console.log('[ODAVL] Dashboard webview created');
                try {
                    const runtimeLogPath = path.join(workspaceRoot || '', '.odavl', 'logs', 'odavl-dashboard-runtime.log');
                    fs.appendFileSync(runtimeLogPath, `[${new Date().toISOString()}] [ODAVL] Dashboard webview created\n`);
                } catch { }
                lazyServices.controlDashboard.show();
                // Log React dashboard rendered
                setTimeout(() => {
                    try {
                        const runtimeLogPath = path.join(workspaceRoot || '', '.odavl', 'logs', 'odavl-dashboard-runtime.log');
                        fs.appendFileSync(runtimeLogPath, `[${new Date().toISOString()}] [ODAVL] React dashboard rendered ✅\n`);
                    } catch { }
                    console.log('[ODAVL] React dashboard rendered ✅');
                }, 1000);
            } else {
                vscode.window.showErrorMessage('ODAVL ControlDashboard is not initialized.');
            }
        } catch (err) {
            vscode.window.showErrorMessage(`❌ ODAVL Dashboard failed to open: ${(err as any)?.message || String(err)}`);
            console.error('[ODAVL] Dashboard open error:', err);
        }
    });

    context.subscriptions.push(controlCommand);
    extensionDisposables.push(controlCommand);

    // Register Evidence Panel webview view
    const { EvidencePanelProvider } = require('./view/EvidencePanelProvider');
    const evidencePanelProvider = new EvidencePanelProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('odavl.evidencePanel', evidencePanelProvider)
    );

    // Register command to show Evidence Panel
    const showEvidenceCmd = vscode.commands.registerCommand('odavl.showEvidence', () => {
        vscode.commands.executeCommand('workbench.view.extension.odavl.evidencePanel');
    });
    context.subscriptions.push(showEvidenceCmd);

    // Basic run cycle command (keeps parity with previous behavior)
    const runCycleCommand = vscode.commands.registerCommand('odavl.runCycle', async () => {
        await activateOnDemand(context);
        const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        try {
            const result = await runCycle(workspace);
            mainPanel?.webview?.postMessage?.({ type: 'cycleComplete', data: result });
            appendLog(result, workspace);
            vscode.window.showInformationMessage('✅ ODAVL Cycle completed!');
        } catch (err) {
            vscode.window.showErrorMessage('❌ ODAVL Cycle failed: ' + ((err as any)?.message || String(err)));
        }
    });
    extensionDisposables.push(runCycleCommand);

    // Command to send latest telemetry to Insights view (for manual refresh)
    const sendTelemetryCommand = vscode.commands.registerCommand('odavl.sendTelemetry', async () => {
        const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        try {
            const telemetryDir = path.join(workspace, '.odavl', 'telemetry');
            const files = fs.readdirSync(telemetryDir).filter(f => f.endsWith('.json'));
            const all = files.flatMap(f => {
                try {
                    const data = JSON.parse(fs.readFileSync(path.join(telemetryDir, f), 'utf-8'));
                    return Array.isArray(data) ? data : [data];
                } catch { return []; }
            });
            const sorted = [...all].sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            mainPanel?.webview?.postMessage?.({ type: 'telemetryUpdate', payload: sorted });
        } catch { }
    });
    extensionDisposables.push(sendTelemetryCommand);

    // --- Intelligence Engine: Analyze Workspace Command ---
    const analyzeWorkspaceCommand = vscode.commands.registerCommand('odavl.analyzeWorkspace', async () => {
        await activateOnDemand(context);
        // Placeholder: could call analyzer logic here
        vscode.window.showInformationMessage('ODAVL: Analyze Workspace (stub)');
    });
    extensionDisposables.push(analyzeWorkspaceCommand);

    // --- Intelligence Engine: Refresh Intelligence Command ---

    // Only register refreshIntelligenceCommand once (keep the above)

    // --- Logs: Open Logs Folder Command ---
    const openLogsCommand = vscode.commands.registerCommand('odavl.openLogs', async () => {
        const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        const logsPath = path.join(workspace, '.odavl', 'logs');
        vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(logsPath), true);
    });
    extensionDisposables.push(openLogsCommand);

    const refreshCommand = vscode.commands.registerCommand('odavl.refresh', async () => {
        await activateOnDemand(context);
        controlProvider.refresh();
        lazyServices.providers?.dashboard.refresh();
        lazyServices.providers?.recipes.refresh();
        lazyServices.providers?.activity.refresh();
        lazyServices.providers?.config.refresh();
        // Also send latest telemetry to Insights view
        vscode.commands.executeCommand('odavl.sendTelemetry');
    });
    extensionDisposables.push(refreshCommand);

    const refreshDashboardCommand = vscode.commands.registerCommand('odavl.refreshDashboard', async () => {
        await activateOnDemand(context);
        lazyServices.providers?.dashboard.refresh();
    });
    extensionDisposables.push(refreshDashboardCommand);

    const refreshRecipesCommand = vscode.commands.registerCommand('odavl.refreshRecipes', async () => {
        await activateOnDemand(context);
        lazyServices.providers?.recipes.refresh();
    });
    extensionDisposables.push(refreshRecipesCommand);

    const refreshActivityCommand = vscode.commands.registerCommand('odavl.refreshActivity', async () => {
        await activateOnDemand(context);
        lazyServices.providers?.activity.refresh();
    });
    extensionDisposables.push(refreshActivityCommand);

    const refreshConfigCommand = vscode.commands.registerCommand('odavl.refreshConfig', async () => {
        await activateOnDemand(context);
        lazyServices.providers?.config.refresh();
    });
    extensionDisposables.push(refreshConfigCommand);

    const refreshIntelligenceCommand = vscode.commands.registerCommand('odavl.refreshIntelligence', async () => {
        await activateOnDemand(context);
        lazyServices.providers?.intelligence?.refresh();
    });
    extensionDisposables.push(refreshIntelligenceCommand);

    let analyticsView: AnalyticsView | undefined;
    const analyticsCommand = vscode.commands.registerCommand('odavl.analytics', async () => {
        await activateOnDemand(context);
        if (lazyServices.dataService) {
            if (!analyticsView) {
                analyticsView = new AnalyticsView(context);
                // No direct panel access; rely on garbage collection and deactivate cleanup
                extensionDisposables.push({ dispose: () => { analyticsView = undefined; } });
            }
            analyticsView.show();
        } else {
            vscode.window.showWarningMessage('Analytics requires a workspace to be opened.');
        }
    });
    extensionDisposables.push(analyticsCommand);

    // Individual ODAVL phase commands
    const observeCommand = vscode.commands.registerCommand('odavl.observe', async () => {
        await activateOnDemand(context);
        await runCLICommand('observe', workspaceRoot || '');
    });
    extensionDisposables.push(observeCommand);

    const decideCommand = vscode.commands.registerCommand('odavl.decide', async () => {
        await activateOnDemand(context);
        await runCLICommand('decide', workspaceRoot || '');
    });
    extensionDisposables.push(decideCommand);

    const actCommand = vscode.commands.registerCommand('odavl.act', async () => {
        await activateOnDemand(context);
        await runCLICommand('act', workspaceRoot || '');
    });
    extensionDisposables.push(actCommand);

    const verifyCommand = vscode.commands.registerCommand('odavl.verify', async () => {
        await activateOnDemand(context);
        await runCLICommand('verify', workspaceRoot || '');
    });
    extensionDisposables.push(verifyCommand);

    const learnCommand = vscode.commands.registerCommand('odavl.learn', async () => {
        await activateOnDemand(context);
        await runCLICommand('learn', workspaceRoot || '');
    });
    extensionDisposables.push(learnCommand);

    // Register InsightsView
    const insights = new InsightsView(context);
    vscode.window.registerTreeDataProvider('odavl.insights', insights);
    if (typeof insights.dispose === 'function') {
        extensionDisposables.push(insights as vscode.Disposable);
    }
    const refreshInsightsCmd = vscode.commands.registerCommand('odavl.refreshInsights', () => insights.refresh());
    context.subscriptions.push(refreshInsightsCmd);
    extensionDisposables.push(refreshInsightsCmd);

    // Performance tracking
    const activationEnd = performance.now();
    const activationTime = activationEnd - activationStart;
    PerformanceMetrics.recordActivation(activationTime);

    // Set activation context and view context keys
    vscode.commands.executeCommand('setContext', 'odavl.activated', true);
    vscode.commands.executeCommand('setContext', 'odavl.hasWorkspace', !!workspaceRoot);
    vscode.commands.executeCommand('setContext', 'odavl.viewsEnabled', true);
    outputChannel.appendLine(`✅ ODAVL extension fully activated in ${activationTime.toFixed(2)}ms`);


    // Register all commands for disposal
    context.subscriptions.push(
        controlCommand,
        runCycleCommand,
        analyzeWorkspaceCommand,
        refreshIntelligenceCommand,
        openLogsCommand,
        refreshCommand,
        refreshDashboardCommand,
        refreshRecipesCommand,
        refreshActivityCommand,
        refreshConfigCommand,
        analyticsCommand,
        observeCommand,
        decideCommand,
        actCommand,
        verifyCommand,
        learnCommand
    );

    // Webview panel and message bridge are created by the `odavl.control` command
    // to ensure a single lifecycle and avoid duplicate panels.

    // --- Demo Mode Command ---
    const demoModeKey = 'odavl.demoMode';
    const setDemoMode = (on: boolean) => context.globalState.update(demoModeKey, on);


    const startDemoCommand = vscode.commands.registerCommand('odavl.startDemo', async () => {
        setDemoMode(true);
        if (!mainPanel) {
            vscode.window.showWarningMessage('ODAVL panel is not open.');
            return;
        }
        mainPanel.webview.postMessage({ type: 'status', phase: 'observe' });
        const phases = ['observe', 'decide', 'act', 'verify', 'learn'];
        for (const phase of phases) {
            mainPanel.webview.postMessage({ type: 'status', phase });
            await new Promise(r => setTimeout(r, 1000));
        }
        const demoResults = {
            successRate: 94,
            totalRuns: 12,
            avgDuration: '2m 45s',
            issues: { minor: 3, major: 1 },
            metrics: [
                { phase: 'Observe', duration: 15 },
                { phase: 'Decide', duration: 20 },
                { phase: 'Act', duration: 40 },
                { phase: 'Verify', duration: 25 },
                { phase: 'Learn', duration: 10 },
            ],
        };
        mainPanel.webview.postMessage({ type: 'cycleComplete', data: demoResults });
        vscode.window.showInformationMessage('🎬 ODAVL Demo Cycle Completed');
        setDemoMode(false);
    });
    context.subscriptions.push(startDemoCommand);
>>>>>>> Stashed changes
}

export function deactivate() {
    // Dispose all tracked disposables and providers
    for (const d of extensionDisposables) {
        try {
            d.dispose();
        } catch (err) {
            // Log error if needed
            console.warn('Error disposing extension disposable:', err);
        }
    }
    extensionDisposables = [];
    disposeLazyProviders();
}

function disposeLazyProviders() {
    disposeAllProviders();
    disposeControlDashboard();
    disposeDataService();
}

function disposeAllProviders() {
    if (!lazyServices.providers) return;
    const providers = lazyServices.providers;
    for (const key of Object.keys(providers) as Array<keyof typeof providers>) {
        const provider = providers[key];
        if (provider && typeof provider.dispose === 'function') {
            try {
                provider.dispose();
            } catch (err) {
                console.warn(`Error disposing provider ${key}:`, err);
            }
        }
    }
}

function disposeControlDashboard() {
    if (lazyServices.controlDashboard && typeof lazyServices.controlDashboard.dispose === 'function') {
        try {
            lazyServices.controlDashboard.dispose();
        } catch (err) {
            console.warn('Error disposing controlDashboard:', err);
        }
    }
}

function disposeDataService() {
    if (lazyServices.dataService && typeof lazyServices.dataService.dispose === 'function') {
        try {
            lazyServices.dataService.dispose();
        } catch (err) {
            console.warn('Error disposing dataService:', err);
        }
    }
}

// (Removed duplicate odavl.control registration; handled above)
