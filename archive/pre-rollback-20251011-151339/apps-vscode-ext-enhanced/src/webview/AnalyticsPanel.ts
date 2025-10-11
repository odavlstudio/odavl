/**
 * Enhanced Analytics Panel WebView for ODAVL Studio
 */

import * as vscode from 'vscode';
import { MetricsService } from '../services/MetricsService';
import { LoggingService } from '../services/LoggingService';

export class AnalyticsPanel {
    private panel: vscode.WebviewPanel | undefined;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly metricsService: MetricsService,
        private readonly loggingService: LoggingService
    ) {}

    show(): void {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'odavlAnalytics',
            'ODAVL Analytics',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = this.getWebviewContent();
        
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

        this.loggingService.info('Analytics Panel opened');
    }

    private getWebviewContent(): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ODAVL Analytics</title>
        </head>
        <body>
            <h2>ODAVL Analytics Dashboard</h2>
            <p>Analytics content will be implemented here.</p>
        </body>
        </html>`;
    }

    dispose(): void {
        this.panel?.dispose();
    }
}