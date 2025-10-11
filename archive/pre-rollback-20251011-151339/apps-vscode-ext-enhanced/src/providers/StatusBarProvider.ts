/**
 * Enhanced Status Bar Provider for ODAVL Studio
 */

import * as vscode from 'vscode';
import { MetricsService } from '../services/MetricsService';
import { ConfigurationService } from '../services/ConfigurationService';
import { LoggingService } from '../services/LoggingService';

export class StatusBarProvider {
    private statusBarItem: vscode.StatusBarItem;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly metricsService: MetricsService,
        private readonly configService: ConfigurationService,
        private readonly loggingService: LoggingService
    ) {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.context.subscriptions.push(this.statusBarItem);
    }

    async initialize(): Promise<void> {
        await this.updateStatus();
        this.statusBarItem.show();
        this.loggingService.info('StatusBarProvider initialized');
    }

    async updateStatus(): Promise<void> {
        const metrics = this.metricsService.getCurrentMetrics();
        
        this.statusBarItem.text = `$(play-circle) ODAVL: ${metrics.cyclePhase}`;
        this.statusBarItem.tooltip = `Phase: ${metrics.cyclePhase} | Status: ${metrics.cycleStatus}`;
        this.statusBarItem.command = 'odavl.doctorMode';
        
        // Update color based on status
        switch (metrics.cycleStatus) {
            case 'success':
                this.statusBarItem.backgroundColor = undefined;
                break;
            case 'error':
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                break;
            case 'running':
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                break;
        }
    }
}