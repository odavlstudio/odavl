/**
 * Enhanced Compliance Panel WebView for ODAVL Studio
 */

import * as vscode from 'vscode';
import { DiagnosticsService } from '../services/DiagnosticsService';
import { LoggingService } from '../services/LoggingService';

export class CompliancePanel {
    private panel: vscode.WebviewPanel | undefined;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly diagnosticsService: DiagnosticsService,
        private readonly loggingService: LoggingService
    ) {}

    show(): void {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'odavlCompliance',
            'ODAVL Compliance',
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

        this.loggingService.info('Compliance Panel opened');
    }

    private getWebviewContent(): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-case=1.0">
            <title>ODAVL Compliance</title>
        </head>
        <body>
            <h2>ODAVL Compliance Dashboard</h2>
            <p>Compliance monitoring content will be implemented here.</p>
        </body>
        </html>`;
    }

    dispose(): void {
        this.panel?.dispose();
    }
}