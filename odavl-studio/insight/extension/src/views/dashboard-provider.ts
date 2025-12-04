import * as vscode from 'vscode';

export class DashboardProvider {
  private panel: vscode.WebviewPanel | undefined;
  private diagnosticCollection: vscode.DiagnosticCollection;
  private disposables: vscode.Disposable[] = [];
  private updateDebounceTimer: NodeJS.Timeout | undefined;

  constructor(private context: vscode.ExtensionContext, diagnostics: vscode.DiagnosticCollection) {
    this.diagnosticCollection = diagnostics;
  }

  show(): void {
    try {
      if (this.panel) {
        this.panel.reveal();
      } else {
        this.panel = vscode.window.createWebviewPanel(
          'odavlDashboard',
          'ODAVL Insight Dashboard',
          vscode.ViewColumn.One,
          {
            enableScripts: true,
            retainContextWhenHidden: true
          }
        );

        this.panel.webview.html = this.getHtmlContent();
        
        // Track panel disposal
        this.panel.onDidDispose(() => {
          this.panel = undefined;
          // Clear any pending updates
          if (this.updateDebounceTimer) {
            clearTimeout(this.updateDebounceTimer);
            this.updateDebounceTimer = undefined;
          }
        });

        // Update on diagnostic changes with debouncing
        const diagnosticsListener = vscode.languages.onDidChangeDiagnostics(() => {
          this.debouncedUpdate();
        });
        this.disposables.push(diagnosticsListener);
      }
    } catch (error) {
      console.error('ODAVL: Failed to show dashboard', error);
      vscode.window.showErrorMessage('ODAVL Insight: Failed to open dashboard. Please try again.');
    }
  }

  private debouncedUpdate(): void {
    if (this.updateDebounceTimer) {
      clearTimeout(this.updateDebounceTimer);
    }
    this.updateDebounceTimer = setTimeout(() => {
      try {
        if (this.panel) {
          this.panel.webview.postMessage({
            command: 'update',
            data: this.getStatistics()
          });
        }
      } catch (error) {
        console.error('ODAVL: Failed to update dashboard', error);
      }
    }, 500); // 500ms debounce
  }

  private getStatistics() {
    try {
      const stats = {
        total: 0,
        errors: 0,
        warnings: 0,
        info: 0,
        bySource: {} as Record<string, number>,
        byFile: [] as { file: string; count: number }[],
        highConfidence: 0,
        files: 0
      };

      const fileMap = new Map<string, number>();

    this.diagnosticCollection.forEach((uri, diagnostics) => {
      const odavlDiagnostics = diagnostics.filter(d => d.source?.startsWith('ODAVL'));
      
      if (odavlDiagnostics.length > 0) {
        const fileName = vscode.workspace.asRelativePath(uri);
        fileMap.set(fileName, (fileMap.get(fileName) || 0) + odavlDiagnostics.length);
        
        odavlDiagnostics.forEach(d => {
          stats.total++;
          
          if (d.severity === vscode.DiagnosticSeverity.Error) {
            stats.errors++;
          } else if (d.severity === vscode.DiagnosticSeverity.Warning) {
            stats.warnings++;
          } else {
            stats.info++;
          }

          const source = d.source || 'ODAVL';
          stats.bySource[source] = (stats.bySource[source] || 0) + 1;

          const match = d.message.match(/confidence[:\s]+(\d+)%/i);
          if (match && parseInt(match[1]) > 90) {
            stats.highConfidence++;
          }
        });
      }
    });

    stats.files = fileMap.size;
    stats.byFile = Array.from(fileMap.entries())
      .map(([file, count]) => ({ file, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
    } catch (error) {
      console.error('ODAVL: Failed to calculate dashboard statistics', error);
      return {
        total: 0,
        errors: 0,
        warnings: 0,
        info: 0,
        bySource: {},
        byFile: [],
        highConfidence: 0,
        files: 0
      };
    }
  }

  private getHtmlContent(): string {
    try {
      const stats = this.getStatistics();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ODAVL Insight Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 20px;
    }
    
    h1 {
      font-size: 24px;
      margin-bottom: 20px;
      color: var(--vscode-textLink-foreground);
    }
    
    .dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .card {
      background: var(--vscode-editor-inactiveSelectionBackground);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      padding: 20px;
    }
    
    .card h2 {
      font-size: 14px;
      text-transform: uppercase;
      opacity: 0.7;
      margin-bottom: 10px;
    }
    
    .card .value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .card.errors .value { color: var(--vscode-errorForeground); }
    .card.warnings .value { color: var(--vscode-warningForeground); }
    .card.info .value { color: var(--vscode-textLink-foreground); }
    .card.total .value { color: var(--vscode-foreground); }
    
    .chart-section {
      margin-top: 30px;
    }
    
    .chart-section h2 {
      font-size: 18px;
      margin-bottom: 15px;
    }
    
    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .bar {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .bar-label {
      min-width: 200px;
      font-size: 13px;
    }
    
    .bar-visual {
      flex: 1;
      height: 24px;
      background: var(--vscode-progressBar-background);
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }
    
    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
    }
    
    .bar-value {
      min-width: 40px;
      text-align: right;
      font-weight: bold;
    }
    
    .source-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    
    .source-item {
      background: var(--vscode-editor-inactiveSelectionBackground);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 12px;
      text-align: center;
    }
    
    .source-item .name {
      font-size: 12px;
      opacity: 0.7;
      margin-bottom: 5px;
    }
    
    .source-item .count {
      font-size: 24px;
      font-weight: bold;
      color: var(--vscode-textLink-foreground);
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      opacity: 0.5;
    }
    
    .empty-state svg {
      width: 100px;
      height: 100px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <h1>📊 ODAVL Insight Dashboard</h1>
  
  ${stats.total > 0 ? `
  <div class="dashboard">
    <div class="card total">
      <h2>Total Issues</h2>
      <div class="value">${stats.total}</div>
      <div>Across ${stats.files} files</div>
    </div>
    
    <div class="card errors">
      <h2>Errors</h2>
      <div class="value">${stats.errors}</div>
      <div>${((stats.errors / stats.total) * 100).toFixed(1)}% of total</div>
    </div>
    
    <div class="card warnings">
      <h2>Warnings</h2>
      <div class="value">${stats.warnings}</div>
      <div>${((stats.warnings / stats.total) * 100).toFixed(1)}% of total</div>
    </div>
    
    <div class="card info">
      <h2>Info & Hints</h2>
      <div class="value">${stats.info}</div>
      <div>${((stats.info / stats.total) * 100).toFixed(1)}% of total</div>
    </div>
  </div>

  ${stats.byFile.length > 0 ? `
  <div class="chart-section">
    <h2>🔥 Most Problematic Files</h2>
    <div class="bar-chart">
      ${stats.byFile.map(item => {
        const percentage = (item.count / Math.max(...stats.byFile.map(f => f.count))) * 100;
        return `
          <div class="bar">
            <div class="bar-label">${item.file}</div>
            <div class="bar-visual">
              <div class="bar-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="bar-value">${item.count}</div>
          </div>
        `;
      }).join('')}
    </div>
  </div>
  ` : ''}

  ${Object.keys(stats.bySource).length > 0 ? `
  <div class="chart-section">
    <h2>🔍 Issues by Detector</h2>
    <div class="source-grid">
      ${Object.entries(stats.bySource).map(([source, count]) => `
        <div class="source-item">
          <div class="name">${source.replace('ODAVL/', '')}</div>
          <div class="count">${count}</div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <div class="chart-section">
    <h2>🎯 High Confidence Issues</h2>
    <div class="card">
      <div class="value">${stats.highConfidence}</div>
      <div>${((stats.highConfidence / stats.total) * 100).toFixed(1)}% have >90% confidence</div>
    </div>
  </div>
  ` : `
  <div class="empty-state">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <h2>No Issues Found! ✨</h2>
    <p>Your code is looking great!</p>
  </div>
  `}

  <script>
    const vscode = acquireVsCodeApi();
    
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'update') {
        // Reload page with new data
        location.reload();
      }
    });
  </script>
</body>
</html>`;
    } catch (error) {
      console.error('ODAVL: Failed to generate dashboard HTML', error);
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Error</title>
</head>
<body>
  <h1>Failed to load dashboard</h1>
  <p>An error occurred while generating the dashboard. Please try refreshing.</p>
</body>
</html>`;
    }
  }

  dispose(): void {
    try {
      // Clear debounce timer
      if (this.updateDebounceTimer) {
        clearTimeout(this.updateDebounceTimer);
        this.updateDebounceTimer = undefined;
      }
      
      // Dispose webview panel
      if (this.panel) {
        this.panel.dispose();
        this.panel = undefined;
      }
      
      // Dispose event listeners
      this.disposables.forEach(d => d.dispose());
      this.disposables = [];
    } catch (error) {
      console.error('ODAVL: Failed to dispose dashboard provider', error);
    }
  }
}
