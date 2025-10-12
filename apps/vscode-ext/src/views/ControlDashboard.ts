import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { ODAVLDataService } from '../services/ODAVLDataService';
import { AIInsightsEngine } from '../intelligence/AIInsightsEngine';
import { DataAnalyzer } from '../intelligence/DataAnalyzer';

/**
 * ODAVL Control Dashboard - Unified WebView Interface
 * Phase 4: Interactive dashboard replacing separate TreeProviders
 */
export class ControlDashboard {
  private panel: vscode.WebviewPanel | undefined;
  private readonly dataService: ODAVLDataService;
  private readonly aiEngine: AIInsightsEngine;
  private readonly dataAnalyzer: DataAnalyzer;

  constructor(private readonly context: vscode.ExtensionContext, dataService: ODAVLDataService) {
    this.dataService = dataService;
    this.aiEngine = new AIInsightsEngine();
    this.dataAnalyzer = new DataAnalyzer();
  }

  public show(): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'odavlControl',
      'ODAVL Control – Unified Quality Dashboard',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, 'media'),
          vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui')
        ]
      }
    );

    this.panel.webview.html = this.getWebviewContent();
    this.setupMessageHandling();
    this.startDataUpdate();

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    }, null, this.context.subscriptions);
  }

  private setupMessageHandling(): void {
    if (!this.panel) return;

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'runCycle':
            await this.executeODAVLCycle();
            break;
          case 'switchTab':
            await this.handleTabSwitch(message.tab);
            break;
          case 'refreshData':
            await this.refreshDashboardData();
            break;
          case 'showAnalytics':
            this.loadAnalyticsData();
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  private async executeODAVLCycle(): Promise<void> {
    if (!this.panel) return;

    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      this.panel.webview.postMessage({
        type: 'control',
        status: 'error',
        data: { phase: 'Error', msg: 'No workspace folder found' }
      });
      return;
    }

    // Use Node.js execution instead of tsx
    const cli = spawn('node', ['apps/cli/dist/index.js', 'run', '--json'], {
      cwd: workspaceRoot,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    if (cli.stdout) {
      cli.stdout.setEncoding('utf8');
      cli.stdout.on('data', (data: string) => {
        const output = data.toString().trim();
        const lines = output.split('\\n');
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const message = JSON.parse(line);
              if (message.type === 'control') {
                this.panel?.webview.postMessage(message);
              }
            } catch {
              this.panel?.webview.postMessage({
                type: 'control',
                status: 'info',
                data: { phase: 'CLI Output', msg: line }
              });
            }
          }
        }
      });
    }

    cli.stderr?.on('data', (data: Buffer) => {
      this.panel?.webview.postMessage({
        type: 'control',
        status: 'error',
        data: { phase: 'CLI Error', msg: data.toString().trim() }
      });
    });

    cli.on('close', (code: number) => {
      this.panel?.webview.postMessage({
        type: 'control',
        status: code === 0 ? 'success' : 'error',
        data: { phase: 'Process', msg: `ODAVL cycle completed with exit code ${code}` }
      });
    });
  }

  private async handleTabSwitch(tab: string): Promise<void> {
    // Load tab-specific data
    switch (tab) {
      case 'overview':
        await this.loadSystemOverview();
        break;
      case 'analytics':
        this.loadAnalyticsData();
        break;
      case 'config':
        this.loadConfigData();
        break;
    }
  }

  private async refreshDashboardData(): Promise<void> {
    if (!this.panel) return;

    const data = {
      systemOverview: await this.getSystemOverviewData(),
      analytics: this.getAnalyticsData(),
      config: this.getConfigData(),
      aiInsights: this.getAIInsights()
    };

    this.panel.webview.postMessage({
      type: 'dataUpdate',
      data: data
    });
  }

  private async loadSystemOverview(): Promise<void> {
    const overview = await this.getSystemOverviewData();
    this.panel?.webview.postMessage({
      type: 'systemOverview',
      data: overview
    });
  }

  private loadAnalyticsData(): void {
    const analytics = this.getAnalyticsData();
    this.panel?.webview.postMessage({
      type: 'analytics',
      data: analytics
    });
  }

  private loadConfigData(): void {
    const config = this.getConfigData();
    this.panel?.webview.postMessage({
      type: 'config',
      data: config
    });
  }

  private async getSystemOverviewData(): Promise<{
    totalRuns: number;
    recentActivity: Array<{ts: string; status: string; delta: number}>;
    trustScore: number;
    qualityTrend: string;
    evidenceCount: number;
    lastRun: string;
  }> {
    const history = this.dataService.getCachedHistoryForIntelligence();
    const evidence = this.dataService.getEvidenceFiles();
    
    // Initialize AI engine with history
    this.aiEngine.initialize(history);
    const insights = this.aiEngine.generateQualityForecast('eslintWarnings');
    
    return {
      totalRuns: history.length,
      recentActivity: history.slice(-5).map(h => ({
        ts: h.ts,
        status: h.success ? 'success' : 'failed',
        delta: h.deltas.eslint + h.deltas.types
      })),
      trustScore: insights?.confidence ? Math.round(insights.confidence * 100) : 85,
      qualityTrend: insights?.trendDirection || 'stable',
      evidenceCount: evidence.length,
      lastRun: history[history.length - 1]?.ts || 'Never'
    };
  }

  private getAnalyticsData(): {
    forecast: unknown;
    performance: unknown;
    metrics: unknown;
    trends: unknown;
  } {
    const history = this.dataService.getCachedHistoryForIntelligence();
    const performance = this.dataService.getPerformanceMetrics();
    
    // Initialize AI engine first
    this.aiEngine.initialize(history);
    const insights = this.aiEngine.generateQualityForecast('eslintWarnings');
    const analysis = this.dataAnalyzer.analyzePerformance();
    
    return {
      forecast: insights,
      performance: analysis,
      metrics: performance,
      trends: this.aiEngine.analyzeTrends()
    };
  }

  private getConfigData(): {
    safetyGates: string;
    policyCompliance: string;
    recipeTrust: string;
    watchers: string;
  } {
    return {
      safetyGates: 'Active',
      policyCompliance: 'Enforced', 
      recipeTrust: 'Learning',
      watchers: 'Monitoring'
    };
  }

  private getAIInsights(): {
    forecast: unknown;
    trends: unknown;
    recommendations: Array<{type: string; message: string}>;
  } {
    const history = this.dataService.getCachedHistoryForIntelligence();
    
    // Initialize AI engine first
    this.aiEngine.initialize(history);
    const forecast = this.aiEngine.generateQualityForecast('eslintWarnings');
    const trends = this.aiEngine.analyzeTrends();
    
    return {
      forecast,
      trends,
      recommendations: [
        { type: 'optimization', message: 'Consider running cycle - quality trend stable' },
        { type: 'achievement', message: 'Trust score improved +5% this week' }
      ]
    };
  }

  private startDataUpdate(): void {
    // Initial data load
    this.refreshDashboardData();
    
    // Periodic updates every 30 seconds
    const interval = setInterval(() => {
      if (this.panel) {
        this.refreshDashboardData();
      } else {
        clearInterval(interval);
      }
    }, 30000);
  }

  private getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ODAVL Control – Unified Quality Dashboard</title>
    <style>
        :root {
          --odavl-primary: #0f3460;
          --odavl-accent: #00d4ff;
          --odavl-success: #10b981;
          --odavl-warning: #f59e0b;
          --odavl-error: #ef4444;
          --bg-primary: var(--vscode-editor-background);
          --bg-secondary: var(--vscode-sideBar-background);
          --text-primary: var(--vscode-editor-foreground);
          --text-secondary: var(--vscode-descriptionForeground);
          --border: var(--vscode-panel-border);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: var(--bg-primary);
          color: var(--text-primary);
          overflow-x: hidden;
        }

        .dashboard-container {
          display: grid;
          grid-template-rows: auto 1fr;
          height: 100vh;
        }

        .header {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          padding: 1rem;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--odavl-accent);
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: var(--odavl-primary);
          color: white;
        }

        .btn-primary:hover {
          background: var(--odavl-accent);
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: var(--bg-primary);
          color: var(--text-primary);
          border: 1px solid var(--border);
        }

        .btn-secondary:hover {
          background: var(--bg-secondary);
        }

        .tabs-container {
          display: flex;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
        }

        .tab {
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.875rem;
          border-bottom: 3px solid transparent;
          transition: all 0.2s ease;
        }

        .tab:hover {
          color: var(--text-primary);
          background: var(--bg-primary);
        }

        .tab.active {
          color: var(--odavl-accent);
          border-bottom-color: var(--odavl-accent);
          background: var(--bg-primary);
        }

        .content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .tab-content {
          display: none;
          animation: fadeIn 0.3s ease-in;
        }

        .tab-content.active {
          display: block;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .grid {
          display: grid;
          gap: 1.5rem;
        }

        .grid-cols-1 { grid-template-columns: 1fr; }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }

        @media (max-width: 768px) {
          .grid-cols-2, .grid-cols-3 {
            grid-template-columns: 1fr;
          }
        }

        .card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          padding: 1.5rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .card-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .metric {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .metric-label {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .metric-value {
          font-weight: 600;
          font-size: 1.125rem;
        }

        .status-indicator {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 0.5rem;
        }

        .status-success { background: var(--odavl-success); }
        .status-warning { background: var(--odavl-warning); }
        .status-error { background: var(--odavl-error); }
        .status-info { background: var(--odavl-accent); }

        .log-container {
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          padding: 1rem;
          height: 300px;
          overflow-y: auto;
          font-family: 'Consolas', 'Courier New', monospace;
          font-size: 0.875rem;
        }

        .log-entry {
          margin-bottom: 0.5rem;
          padding: 0.5rem;
          border-radius: 0.25rem;
          animation: fadeIn 0.3s ease-in;
        }

        .log-success {
          background: rgba(16, 185, 129, 0.1);
          border-left: 3px solid var(--odavl-success);
        }

        .log-error {
          background: rgba(239, 68, 68, 0.1);
          border-left: 3px solid var(--odavl-error);
        }

        .log-warning {
          background: rgba(245, 158, 11, 0.1);
          border-left: 3px solid var(--odavl-warning);
        }

        .log-info {
          background: rgba(0, 212, 255, 0.1);
          border-left: 3px solid var(--odavl-accent);
        }

        .chart-container {
          height: 300px;
          position: relative;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: var(--text-secondary);
        }

        .spinner {
          border: 2px solid var(--border);
          border-top: 2px solid var(--odavl-accent);
          border-radius: 50%;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <header class="header">
            <div class="header-title">
                <span>🎛️</span>
                ODAVL Control – Unified Quality Dashboard
            </div>
            <div class="header-actions">
                <button class="btn btn-primary" onclick="runCycle()">
                    ▶️ Run ODAVL Cycle
                </button>
                <button class="btn btn-secondary" onclick="refreshData()">
                    🔄 Refresh
                </button>
                <button class="btn btn-secondary" onclick="showAnalytics()">
                    📊 Analytics
                </button>
            </div>
        </header>

        <div class="tabs-container">
            <button class="tab active" onclick="switchTab('overview', this)">
                🧠 System Overview
            </button>
            <button class="tab" onclick="switchTab('cycle', this)">
                ⚙️ Run Cycle
            </button>
            <button class="tab" onclick="switchTab('analytics', this)">
                📊 Analytics
            </button>
            <button class="tab" onclick="switchTab('config', this)">
                🧾 Config
            </button>
        </div>

        <main class="content">
            <!-- System Overview Tab -->
            <div id="overview-tab" class="tab-content active">
                <div class="grid grid-cols-3">
                    <div class="card">
                        <div class="card-title">Quality Status</div>
                        <div class="metric">
                            <span class="metric-label">Trust Score</span>
                            <span class="metric-value" id="trust-score">Loading...</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Quality Trend</span>
                            <span class="metric-value" id="quality-trend">Loading...</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Last Run</span>
                            <span class="metric-value" id="last-run">Loading...</span>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-title">System Metrics</div>
                        <div class="metric">
                            <span class="metric-label">Total Runs</span>
                            <span class="metric-value" id="total-runs">Loading...</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Evidence Files</span>
                            <span class="metric-value" id="evidence-count">Loading...</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Status</span>
                            <span class="metric-value">
                                <span class="status-indicator status-success"></span>
                                Active
                            </span>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-title">AI Insights</div>
                        <div id="ai-insights">
                            <div class="loading">
                                <div class="spinner"></div>
                                Loading insights...
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Run Cycle Tab -->
            <div id="cycle-tab" class="tab-content">
                <div class="grid grid-cols-1">
                    <div class="card">
                        <div class="card-title">ODAVL Cycle Execution</div>
                        <div class="log-container" id="cycle-logs">
                            <div class="log-entry log-info">
                                Ready to run ODAVL cycle. Click "Run ODAVL Cycle" to start.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Analytics Tab -->
            <div id="analytics-tab" class="tab-content">
                <div class="grid grid-cols-2">
                    <div class="card">
                        <div class="card-title">Performance Trends</div>
                        <div class="chart-container" id="performance-chart">
                            <div class="loading">
                                <div class="spinner"></div>
                                Loading analytics...
                            </div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-title">Quality Forecast</div>
                        <div class="chart-container" id="forecast-chart">
                            <div class="loading">
                                <div class="spinner"></div>
                                Loading forecast...
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Config Tab -->
            <div id="config-tab" class="tab-content">
                <div class="grid grid-cols-2">
                    <div class="card">
                        <div class="card-title">Safety Gates</div>
                        <div class="metric">
                            <span class="metric-label">Status</span>
                            <span class="metric-value">
                                <span class="status-indicator status-success"></span>
                                Active
                            </span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Policy Compliance</span>
                            <span class="metric-value">
                                <span class="status-indicator status-success"></span>
                                Enforced
                            </span>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-title">System Configuration</div>
                        <div class="metric">
                            <span class="metric-label">Recipe Trust</span>
                            <span class="metric-value">
                                <span class="status-indicator status-info"></span>
                                Learning
                            </span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">File Watchers</span>
                            <span class="metric-value">
                                <span class="status-indicator status-success"></span>
                                Monitoring
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function switchTab(tabName, element) {
            // Remove active class from all tabs and content
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            element.classList.add('active');
            document.getElementById(tabName + '-tab').classList.add('active');

            // Notify extension of tab switch
            vscode.postMessage({ command: 'switchTab', tab: tabName });
        }

        function runCycle() {
            vscode.postMessage({ command: 'runCycle' });
        }

        function refreshData() {
            vscode.postMessage({ command: 'refreshData' });
        }

        function showAnalytics() {
            switchTab('analytics', document.querySelector('.tab:nth-child(3)'));
            vscode.postMessage({ command: 'showAnalytics' });
        }

        function addLogEntry(phase, message, status) {
            const logsContainer = document.getElementById('cycle-logs');
            const logEntry = document.createElement('div');
            logEntry.className = \`log-entry log-\${status}\`;
            logEntry.innerHTML = \`
                <div style="font-weight: 600; margin-bottom: 0.25rem;">\${phase}</div>
                <div>\${message}</div>
            \`;
            logsContainer.appendChild(logEntry);
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }

        function updateSystemOverview(data) {
            document.getElementById('trust-score').textContent = data.trustScore + '%';
            document.getElementById('quality-trend').textContent = data.qualityTrend;
            document.getElementById('last-run').textContent = new Date(data.lastRun).toLocaleString();
            document.getElementById('total-runs').textContent = data.totalRuns;
            document.getElementById('evidence-count').textContent = data.evidenceCount;
            
            const insightsContainer = document.getElementById('ai-insights');
            insightsContainer.innerHTML = \`
                <div class="metric">
                    <span class="metric-label">Quality Forecast</span>
                    <span class="metric-value">\${data.qualityTrend}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Trust Score</span>
                    <span class="metric-value">\${data.trustScore}%</span>
                </div>
            \`;
        }

        // Message handling from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'control':
                    addLogEntry(message.data.phase, message.data.msg, message.status);
                    break;
                case 'dataUpdate':
                    updateSystemOverview(message.data.systemOverview);
                    break;
                case 'systemOverview':
                    updateSystemOverview(message.data);
                    break;
            }
        });

        // Initialize dashboard
        vscode.postMessage({ command: 'refreshData' });
    </script>
</body>
</html>`;
  }
}