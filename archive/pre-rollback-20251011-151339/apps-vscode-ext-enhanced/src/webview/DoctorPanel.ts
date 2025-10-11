/**
 * Enhanced Doctor Panel WebView for ODAVL Studio
 */

import * as vscode from 'vscode';
import { MetricsService } from '../services/MetricsService';
import { LoggingService } from '../services/LoggingService';

export class DoctorPanel {
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
            'odavlDoctor',
            'ODAVL Doctor Mode',
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

        this.loggingService.info('Doctor Panel opened');
    }

    private getWebviewContent(): string {
        const metrics = this.metricsService.getCurrentMetrics();
        
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ODAVL Doctor Mode</title>
            <style>
                body { font-family: var(--vscode-font-family); }
                .status { padding: 20px; }
                .metric { margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="status">
                <h2>ODAVL Status</h2>
                <div class="metric">Phase: ${metrics.cyclePhase}</div>
                <div class="metric">Status: ${metrics.cycleStatus}</div>
                <div class="metric">ESLint Warnings: ${metrics.eslintWarnings}</div>
                <div class="metric">TypeScript Errors: ${metrics.typeScriptErrors}</div>
            </div>
        </body>
        </html>`;
    }

    dispose(): void {
        this.panel?.dispose();
    }
}