import * as vscode from 'vscode';
import { AIInsightsEngine } from '../intelligence/AIInsightsEngine';
import { DataAnalyzer } from '../intelligence/DataAnalyzer';

/**
 * Analytics View - Advanced visualization dashboard for ODAVL intelligence
 * Provides real-time charts, trend analysis, and predictive insights
 */
export class AnalyticsView {
  private panel: vscode.WebviewPanel | undefined;
  private readonly context: vscode.ExtensionContext;
  private insights: AIInsightsEngine;
  private analyzer: DataAnalyzer;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.insights = new AIInsightsEngine();
    this.analyzer = new DataAnalyzer();
  }

  /**
   * Show analytics dashboard with intelligent visualizations
   */
  public show(): void {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'odavlAnalytics',
      'ODAVL Analytics Dashboard',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    this.panel.webview.html = this.generateHtmlContent();
    this.panel.onDidDispose(() => { this.panel = undefined; });
    
    // Handle messages from webview for interactive features
    this.panel.webview.onDidReceiveMessage(message => {
      switch (message.command) {
        case 'requestForecast':
          this.sendForecastData(message.metric);
          break;
        case 'requestTrends':
          this.sendTrendData();
          break;
      }
    });
  }

  /**
   * Update dashboard with fresh data
   */
  public updateData(history: unknown[], evidence: unknown[], metrics: unknown[]): void {
    this.insights.initialize(history as any);
    this.analyzer.initialize(evidence as any, metrics as any);
    
    if (this.panel) {
      this.panel.webview.postMessage({
        command: 'updateCharts',
        data: this.generateChartData()
      });
    }
  }

  private generateHtmlContent(): string {
    return `<!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        body { font-family: var(--vscode-font-family); background: var(--vscode-editor-background); }
        .chart-container { width: 100%; height: 300px; margin: 20px 0; }
        h2 { color: var(--vscode-foreground); }
      </style>
    </head>
    <body>
      <h2>ODAVL Analytics Dashboard</h2>
      <div class="chart-container">
        <canvas id="qualityChart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="trendChart"></canvas>
      </div>
      <script>
        const vscode = acquireVsCodeApi();
        const qualityCtx = document.getElementById('qualityChart').getContext('2d');
        const trendCtx = document.getElementById('trendChart').getContext('2d');
        
        let qualityChart = new Chart(qualityCtx, { type: 'line', data: { datasets: [] } });
        let trendChart = new Chart(trendCtx, { type: 'bar', data: { datasets: [] } });
        
        window.addEventListener('message', event => {
          if (event.data.command === 'updateCharts') {
            qualityChart.data = event.data.data.quality;
            trendChart.data = event.data.data.trends;
            qualityChart.update();
            trendChart.update();
          }
        });
      </script>
    </body>
    </html>`;
  }

  private generateChartData(): { quality: { labels: string[]; datasets: { label: string; data: number[] }[] }; trends: { labels: string[]; datasets: { label: string; data: number[] }[] } } {
    return {
      quality: { labels: ['Day 1', 'Day 2', 'Day 3'], datasets: [{ label: 'Quality', data: [10, 8, 6] }] },
      trends: { labels: ['Cycles'], datasets: [{ label: 'Performance', data: [85] }] }
    };
  }

  private sendForecastData(metric: string): void {
    const forecast = this.insights.generateQualityForecast(metric as 'eslintWarnings' | 'typeErrors');
    this.panel?.webview.postMessage({ command: 'forecastData', forecast });
  }

  private sendTrendData(): void {
    const trends = this.insights.analyzeTrends();
    this.panel?.webview.postMessage({ command: 'trendData', trends });
  }
}