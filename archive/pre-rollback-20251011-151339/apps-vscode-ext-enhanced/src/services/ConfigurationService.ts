/**
 * Enhanced Configuration Service for ODAVL Studio
 * 
 * Manages VS Code settings, workspace configuration, and ODAVL-specific
 * configuration with type safety and validation.
 */

import * as vscode from 'vscode';
import { LoggingService } from './LoggingService';

export interface OdavlConfiguration {
    autoRefresh: boolean;
    refreshInterval: number;
    hasShownWelcome: boolean;
    enableTelemetry: boolean;
    enableDiagnostics: boolean;
    maxReportsToKeep: number;
    doctorModeTheme: 'light' | 'dark' | 'auto';
    notifications: {
        showSuccess: boolean;
        showWarnings: boolean;
        showErrors: boolean;
    };
    performance: {
        enableProfiling: boolean;
        maxExecutionTime: number;
    };
}

const DEFAULT_CONFIG: OdavlConfiguration = {
    autoRefresh: true,
    refreshInterval: 30000,
    hasShownWelcome: false,
    enableTelemetry: true,
    enableDiagnostics: true,
    maxReportsToKeep: 100,
    doctorModeTheme: 'auto',
    notifications: {
        showSuccess: true,
        showWarnings: true,
        showErrors: true
    },
    performance: {
        enableProfiling: false,
        maxExecutionTime: 30000
    }
};

export class ConfigurationService {
    private currentConfig: OdavlConfiguration;
    private configWatcher: vscode.Disposable | undefined;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly loggingService: LoggingService
    ) {
        this.currentConfig = { ...DEFAULT_CONFIG };
    }

    async initialize(): Promise<void> {
        await this.loadConfiguration();
        this.setupConfigurationWatcher();
        this.loggingService.info('ConfigurationService initialized');
    }

    private async loadConfiguration(): Promise<void> {
        const workspaceConfig = vscode.workspace.getConfiguration('odavl');
        const globalState = this.context.globalState;

        // Merge configurations with priority: workspace > global state > defaults
        this.currentConfig = {
            ...DEFAULT_CONFIG,
            ...globalState.get<Partial<OdavlConfiguration>>('config', {}),
            autoRefresh: workspaceConfig.get('autoRefresh', DEFAULT_CONFIG.autoRefresh),
            refreshInterval: workspaceConfig.get('refreshInterval', DEFAULT_CONFIG.refreshInterval),
            enableTelemetry: workspaceConfig.get('enableTelemetry', DEFAULT_CONFIG.enableTelemetry),
            enableDiagnostics: workspaceConfig.get('enableDiagnostics', DEFAULT_CONFIG.enableDiagnostics),
            maxReportsToKeep: workspaceConfig.get('maxReportsToKeep', DEFAULT_CONFIG.maxReportsToKeep),
            doctorModeTheme: workspaceConfig.get('doctorModeTheme', DEFAULT_CONFIG.doctorModeTheme),
            notifications: {
                ...DEFAULT_CONFIG.notifications,
                ...workspaceConfig.get('notifications', {})
            },
            performance: {
                ...DEFAULT_CONFIG.performance,
                ...workspaceConfig.get('performance', {})
            }
        };

        this.loggingService.debug('Configuration loaded', { config: this.currentConfig });
    }

    private setupConfigurationWatcher(): void {
        this.configWatcher = vscode.workspace.onDidChangeConfiguration(async (event) => {
            if (event.affectsConfiguration('odavl')) {
                this.loggingService.info('Configuration changed, reloading...');
                await this.loadConfiguration();
            }
        });

        this.context.subscriptions.push(this.configWatcher);
    }

    getConfiguration(): OdavlConfiguration {
        return { ...this.currentConfig };
    }

    async updateConfiguration(updates: Partial<OdavlConfiguration>): Promise<void> {
        this.currentConfig = { ...this.currentConfig, ...updates };
        
        // Save to global state
        await this.context.globalState.update('config', this.currentConfig);
        
        this.loggingService.info('Configuration updated', { updates });
    }

    async updateWorkspaceConfiguration(key: string, value: any): Promise<void> {
        const config = vscode.workspace.getConfiguration('odavl');
        await config.update(key, value, vscode.ConfigurationTarget.Workspace);
        
        this.loggingService.info('Workspace configuration updated', { key, value });
    }

    async reload(): Promise<void> {
        await this.loadConfiguration();
        this.loggingService.info('Configuration reloaded');
    }

    async saveConfiguration(): Promise<void> {
        await this.context.globalState.update('config', this.currentConfig);
        this.loggingService.debug('Configuration saved to global state');
    }

    validateConfiguration(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (this.currentConfig.refreshInterval < 1000) {
            errors.push('refreshInterval must be at least 1000ms');
        }

        if (this.currentConfig.maxReportsToKeep < 1) {
            errors.push('maxReportsToKeep must be at least 1');
        }

        if (this.currentConfig.performance.maxExecutionTime < 1000) {
            errors.push('performance.maxExecutionTime must be at least 1000ms');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}