import { registerWebviewMessageHandler, postWebviewMessage } from '../utils/webviewMessaging';
import * as vscode from 'vscode';
import { AIInsightsEngine } from '../intelligence/AIInsightsEngine';
import { DataAnalyzer } from '../intelligence/DataAnalyzer';
import { HistoryEntry, EvidenceFile, SystemMetrics } from '../types/ODAVLTypes';
import { Logger } from '../utils/Logger';

/**
 * Analytics View - Advanced visualization dashboard for ODAVL intelligence
 * Provides real-time charts, trend analysis, and predictive insights
 */
export class AnalyticsView {
  private panel: vscode.WebviewPanel | undefined;
  private readonly context: vscode.ExtensionContext;
  private readonly insights: AIInsightsEngine;
  private readonly analyzer: DataAnalyzer;
  private readonly logger = new Logger();

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.insights = new AIInsightsEngine();
    this.analyzer = new DataAnalyzer();
  }

  /**
   * Show analytics dashboard with intelligent visualizations
   */
  public show(): void {
    const perfEnabled = vscode.workspace.getConfiguration('odavl').get('enablePerfMetrics', false);
    let t0: number | undefined;
    if (perfEnabled) t0 = performance.now();
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
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
      }
    );

    this.panel.webview.html = this.generateHtmlContent(this.panel.webview);
    this.panel.onDidDispose(() => { this.panel = undefined; });

    // Handle messages from webview for interactive features
    if (this.panel.webview) {
      const _ = registerWebviewMessageHandler(this.panel.webview, async (message: unknown) => {
        try {
          if (typeof message === 'object' && message !== null && 'command' in message) {
            const msg = message as { command: string; metric?: string };
            switch (msg.command) {
              case 'requestForecast':
                this.sendForecastData(msg.metric ?? '');
                break;
              case 'requestTrends':
                this.sendTrendData();
                break;
            }
          }
        } catch (err) {
          vscode.window.showErrorMessage('AnalyticsView: Error handling webview message.');
          console.error('AnalyticsView webview message error:', err);
        }
      });
    }
    if (perfEnabled && t0 !== undefined) {
      const t1 = performance.now();
      this.logger.info(`[Perf] AnalyticsView.show: ${(t1 - t0).toFixed(2)}ms`);
    }
  }

  /**
   * Update dashboard with fresh data
   */
  public updateData(history: unknown[], evidence: unknown[], metrics: unknown[]): void {
    this.insights.initialize(history as HistoryEntry[]);
    this.analyzer.initialize(evidence as EvidenceFile[], metrics as SystemMetrics[]);

    if (this.panel) {
      postWebviewMessage(this.panel.webview, {
        command: 'updateCharts',
        data: this.generateChartData()
      });
    }
  }

  private generateHtmlContent(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
    <html>
    <head>
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline';">
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

        function clearCanvas(ctx) {
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        function drawLineChart(ctx, labels, data) {
          clearCanvas(ctx);
          const w = ctx.canvas.width, h = ctx.canvas.height;
          const max = Math.max(...data, 1);
          const stepX = w / Math.max(labels.length - 1, 1);
          ctx.strokeStyle = '#4FC3F7';
          ctx.beginPath();
          data.forEach((v, i) => {
            const x = i * stepX;
            const y = h - (v / max) * (h - 20) - 10;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          });
          ctx.stroke();
        }
        function drawBarChart(ctx, labels, data) {
          clearCanvas(ctx);
          const w = ctx.canvas.width, h = ctx.canvas.height;
          const max = Math.max(...data, 1);
          const barW = w / (labels.length * 1.5 || 1);
          data.forEach((v, i) => {
            const x = i * barW * 1.5 + barW * 0.25;
            const barH = (v / max) * (h - 20);
            ctx.fillStyle = '#81C784';
            ctx.fillRect(x, h - barH - 10, barW, barH);
          });
        }

        let quality = { labels: [], datasets: [{ label: 'Quality', data: [] }] };
        let trends = { labels: [], datasets: [{ label: 'Performance', data: [] }] };

        function render() {
          drawLineChart(qualityCtx, quality.labels, quality.datasets[0].data);
          drawBarChart(trendCtx, trends.labels, trends.datasets[0].data);
        }

        window.addEventListener('message', event => {
          if (event.data.command === 'updateCharts') {
            quality = event.data.data.quality;
            trends = event.data.data.trends;
            render();
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
