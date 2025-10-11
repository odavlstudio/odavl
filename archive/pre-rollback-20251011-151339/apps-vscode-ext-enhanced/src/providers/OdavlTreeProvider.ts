/**
 * Enhanced ODAVL Tree Provider for VS Code Explorer
 */

import * as vscode from 'vscode';
import { MetricsService } from '../services/MetricsService';
import { ConfigurationService } from '../services/ConfigurationService';
import { LoggingService } from '../services/LoggingService';

type TreeDataChangeEvent = OdavlTreeItem | undefined | null | void;

export class OdavlTreeItem extends vscode.TreeItem {
    constructor(
        label: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        contextValue?: string,
        command?: vscode.Command,
        iconPath?: vscode.ThemeIcon | vscode.Uri,
        description?: string | boolean
    ) {
        super(label, collapsibleState);
        if (contextValue) {
            this.contextValue = contextValue;
        }
        if (command) {
            this.command = command;
        }
        if (iconPath) {
            this.iconPath = iconPath;
        }
        if (description !== undefined) {
            this.description = description;
        }
    }
}

export class OdavlTreeProvider implements vscode.TreeDataProvider<OdavlTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeDataChangeEvent> = new vscode.EventEmitter<TreeDataChangeEvent>();
    readonly onDidChangeTreeData: vscode.Event<TreeDataChangeEvent> = this._onDidChangeTreeData.event;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly metricsService: MetricsService,
        private readonly configService: ConfigurationService,
        private readonly loggingService: LoggingService
    ) {}

    async initialize(): Promise<void> {
        this.loggingService.info('OdavlTreeProvider initialized');
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: OdavlTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: OdavlTreeItem): Thenable<OdavlTreeItem[]> {
        if (!element) {
            return Promise.resolve(this.getRootItems());
        }
        return Promise.resolve([]);
    }

    private getRootItems(): OdavlTreeItem[] {
        const metrics = this.metricsService.getCurrentMetrics();
        
        return [
            new OdavlTreeItem(
                'ODAVL Cycle',
                vscode.TreeItemCollapsibleState.Expanded,
                'odavl-cycle',
                undefined,
                new vscode.ThemeIcon('play-circle'),
                `Status: ${metrics.cycleStatus}`
            ),
            new OdavlTreeItem(
                'Current Phase',
                vscode.TreeItemCollapsibleState.None,
                'odavl-phase',
                undefined,
                new vscode.ThemeIcon('clock'),
                metrics.cyclePhase
            ),
            new OdavlTreeItem(
                'Metrics',
                vscode.TreeItemCollapsibleState.Expanded,
                'odavl-metrics',
                undefined,
                new vscode.ThemeIcon('graph'),
                `Warnings: ${metrics.eslintWarnings}, Errors: ${metrics.typeScriptErrors}`
            )
        ];
    }
}