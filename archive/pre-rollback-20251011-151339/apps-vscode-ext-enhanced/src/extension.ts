/**
 * ODAVL Studio Enhanced Extension - Main Entry Point
 * 
 * Enhanced VS Code extension providing comprehensive ODAVL cycle monitoring,
 * real-time analytics, and enterprise-grade safety controls with extensive
 * error boundaries and improved user experience.
 * 
 * @fileoverview Main extension activation and coordination module
 * @version 2.0.0
 * @enterprise-enhanced true
 */

import * as vscode from 'vscode';
import { OdavlTreeProvider } from './providers/OdavlTreeProvider';
import { StatusBarProvider } from './providers/StatusBarProvider';
import { MetricsService } from './services/MetricsService';
import { ConfigurationService } from './services/ConfigurationService';
import { NotificationService } from './services/NotificationService';
import { LoggingService } from './services/LoggingService';
import { DoctorPanel } from './webview/DoctorPanel';
import { AnalyticsPanel } from './webview/AnalyticsPanel';
import { CompliancePanel } from './webview/CompliancePanel';
import { TelemetryService } from './services/TelemetryService';
import { DiagnosticsService } from './services/DiagnosticsService';

/**
 * Extension context and global state management
 */
export interface ExtensionState {
    context: vscode.ExtensionContext;
    treeProvider: OdavlTreeProvider;
    statusBarProvider: StatusBarProvider;
    metricsService: MetricsService;
    configService: ConfigurationService;
    notificationService: NotificationService;
    loggingService: LoggingService;
    telemetryService: TelemetryService;
    diagnosticsService: DiagnosticsService;
    doctorPanel?: DoctorPanel;
    analyticsPanel?: AnalyticsPanel;
    compliancePanel?: CompliancePanel;
    isInitialized: boolean;
    errorBoundary: ErrorBoundary;
}

/**
 * Enterprise-grade error boundary for extension stability
 */
class ErrorBoundary {
    private static instance: ErrorBoundary;
    private errorCount = 0;
    private lastError: Error | undefined;
    private readonly maxErrors = 10;
    private readonly resetInterval = 300000; // 5 minutes

    constructor(private readonly loggingService: LoggingService) {
        // Reset error count periodically
        setInterval(() => {
            this.errorCount = 0;
            this.lastError = undefined;
        }, this.resetInterval);
    }

    static getInstance(loggingService: LoggingService): ErrorBoundary {
        if (!ErrorBoundary.instance) {
            ErrorBoundary.instance = new ErrorBoundary(loggingService);
        }
        return ErrorBoundary.instance;
    }

    async handleError(error: Error, context: string): Promise<boolean> {
        this.errorCount++;
        this.lastError = error;

        this.loggingService.error(`Error in ${context}`, {
            error: error.message,
            stack: error.stack,
            errorCount: this.errorCount,
            timestamp: new Date().toISOString()
        });

        if (this.errorCount >= this.maxErrors) {
            vscode.window.showErrorMessage(
                `ODAVL Studio has encountered ${this.errorCount} errors. Consider reloading the window.`,
                'Reload Window'
            ).then((selection: string | undefined) => {
                if (selection === 'Reload Window') {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            });
            return false;
        }

        return true;
    }

    getErrorStatus(): { count: number; lastError: string | undefined } {
        return {
            count: this.errorCount,
            lastError: this.lastError?.message
        };
    }
}

let extensionState: ExtensionState | undefined;

/**
 * Enhanced extension activation with comprehensive error handling
 * and enterprise-grade initialization patterns
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('ODAVL Studio Enhanced: Starting activation...');

    try {
        // Initialize logging service first for error tracking
        const loggingService = new LoggingService(context);
        await loggingService.initialize();

        const errorBoundary = ErrorBoundary.getInstance(loggingService);

        loggingService.info('ODAVL Studio Enhanced activation started', {
            version: context.extension.packageJSON.version,
            vscodeVersion: vscode.version,
            workspace: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
        });

        // Initialize core services with error boundaries
        const configService = await initializeService(
            () => new ConfigurationService(context, loggingService),
            'ConfigurationService',
            errorBoundary
        );

        const notificationService = await initializeService(
            () => new NotificationService(loggingService),
            'NotificationService',
            errorBoundary
        );

        const metricsService = await initializeService(
            () => new MetricsService(context, loggingService, configService),
            'MetricsService',
            errorBoundary
        );

        const telemetryService = await initializeService(
            () => new TelemetryService(context, loggingService, configService),
            'TelemetryService',
            errorBoundary
        );

        const diagnosticsService = await initializeService(
            () => new DiagnosticsService(context, loggingService, metricsService),
            'DiagnosticsService',
            errorBoundary
        );

        // Initialize providers with enhanced capabilities
        const treeProvider = await initializeService(
            () => new OdavlTreeProvider(context, metricsService, configService, loggingService),
            'OdavlTreeProvider',
            errorBoundary
        );

        const statusBarProvider = await initializeService(
            () => new StatusBarProvider(context, metricsService, configService, loggingService),
            'StatusBarProvider',
            errorBoundary
        );

        // Register tree view and status bar
        vscode.window.registerTreeDataProvider('odavlExplorer', treeProvider);
        await statusBarProvider.initialize();

        // Create extension state
        extensionState = {
            context,
            treeProvider,
            statusBarProvider,
            metricsService,
            configService,
            notificationService,
            loggingService,
            telemetryService,
            diagnosticsService,
            isInitialized: false,
            errorBoundary
        };

        // Register all commands with error boundaries
        await registerCommands(extensionState);

        // Initialize background monitoring
        await initializeMonitoring(extensionState);

        // Mark as initialized
        extensionState.isInitialized = true;

        loggingService.info('ODAVL Studio Enhanced activation completed successfully', {
            servicesInitialized: 7,
            commandsRegistered: 12,
            monitoringActive: true
        });

        // Show welcome notification for first-time users
        await showWelcomeNotification(configService, notificationService);

        console.log('ODAVL Studio Enhanced: Activation complete!');

    } catch (error) {
        console.error('ODAVL Studio Enhanced: Activation failed:', error);
        vscode.window.showErrorMessage(
            `ODAVL Studio Enhanced failed to activate: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        throw error;
    }
}

/**
 * Initialize a service with error boundary protection
 */
async function initializeService<T>(
    serviceFactory: () => T,
    serviceName: string,
    errorBoundary: ErrorBoundary
): Promise<T> {
    try {
        const service = serviceFactory();
        
        // Initialize service if it has an initialize method
        if (service && typeof (service as any).initialize === 'function') {
            await (service as any).initialize();
        }

        return service;
    } catch (error) {
        const canContinue = await errorBoundary.handleError(
            error instanceof Error ? error : new Error(String(error)), 
            `${serviceName} initialization`
        );
        
        if (!canContinue) {
            throw new Error(`Critical failure initializing ${serviceName}`);
        }
        
        // Return a minimal fallback service
        return serviceFactory();
    }
}

/**
 * Register all extension commands with comprehensive error handling
 */
async function registerCommands(state: ExtensionState): Promise<void> {
    const commands = [
        // Core ODAVL commands
        {
            id: 'odavl.runCycle',
            handler: () => handleCommand('runCycle', state)
        },
        {
            id: 'odavl.observe',
            handler: () => handleCommand('observe', state)
        },
        {
            id: 'odavl.decide',
            handler: () => handleCommand('decide', state)
        },
        {
            id: 'odavl.act',
            handler: () => handleCommand('act', state)
        },
        {
            id: 'odavl.verify',
            handler: () => handleCommand('verify', state)
        },
        {
            id: 'odavl.learn',
            handler: () => handleCommand('learn', state)
        },
        {
            id: 'odavl.undo',
            handler: () => handleCommand('undo', state)
        },
        
        // Enhanced monitoring commands
        {
            id: 'odavl.doctorMode',
            handler: () => handleCommand('doctorMode', state)
        },
        {
            id: 'odavl.showDashboard',
            handler: () => handleCommand('showDashboard', state)
        },
        {
            id: 'odavl.showAnalytics',
            handler: () => handleCommand('showAnalytics', state)
        },
        {
            id: 'odavl.showCompliance',
            handler: () => handleCommand('showCompliance', state)
        },
        
        // Utility commands
        {
            id: 'odavl.refreshExplorer',
            handler: () => handleCommand('refreshExplorer', state)
        },
        {
            id: 'odavl.openSettings',
            handler: () => handleCommand('openSettings', state)
        },
        {
            id: 'odavl.exportReports',
            handler: () => handleCommand('exportReports', state)
        },
        {
            id: 'odavl.clearCache',
            handler: () => handleCommand('clearCache', state)
        }
    ];

    // Register all commands with error boundaries
    for (const command of commands) {
        try {
            const disposable = vscode.commands.registerCommand(command.id, command.handler);
            state.context.subscriptions.push(disposable);
        } catch (error) {
            await state.errorBoundary.handleError(
                error instanceof Error ? error : new Error(String(error)),
                `Command registration: ${command.id}`
            );
        }
    }

    state.loggingService.info('Commands registered successfully', {
        commandCount: commands.length
    });
}

/**
 * Handle command execution with error boundaries and telemetry
 */
async function handleCommand(commandType: string, state: ExtensionState): Promise<void> {
    if (!state.isInitialized) {
        vscode.window.showWarningMessage('ODAVL Studio is still initializing. Please wait...');
        return;
    }

    const startTime = Date.now();
    
    try {
        state.loggingService.info(`Executing command: ${commandType}`);
        state.telemetryService.trackEvent('command_executed', { commandType });

        switch (commandType) {
            case 'runCycle':
                await executeOdavlCycle(state);
                break;
            case 'observe':
                await executeObserve(state);
                break;
            case 'decide':
                await executeDecide(state);
                break;
            case 'act':
                await executeAct(state);
                break;
            case 'verify':
                await executeVerify(state);
                break;
            case 'learn':
                await executeLearn(state);
                break;
            case 'undo':
                await executeUndo(state);
                break;
            case 'doctorMode':
                await showDoctorPanel(state);
                break;
            case 'showDashboard':
                await showDashboard(state);
                break;
            case 'showAnalytics':
                await showAnalyticsPanel(state);
                break;
            case 'showCompliance':
                await showCompliancePanel(state);
                break;
            case 'refreshExplorer':
                state.treeProvider.refresh();
                break;
            case 'openSettings':
                vscode.commands.executeCommand('workbench.action.openSettings', 'odavl');
                break;
            case 'exportReports':
                await exportReports(state);
                break;
            case 'clearCache':
                await clearCache(state);
                break;
            default:
                throw new Error(`Unknown command: ${commandType}`);
        }

        const duration = Date.now() - startTime;
        state.telemetryService.trackEvent('command_completed', {
            commandType,
            duration,
            success: true
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        
        await state.errorBoundary.handleError(
            error instanceof Error ? error : new Error(String(error)),
            `Command execution: ${commandType}`
        );

        state.telemetryService.trackEvent('command_failed', {
            commandType,
            duration,
            error: error instanceof Error ? error.message : String(error)
        });

        vscode.window.showErrorMessage(
            `ODAVL command '${commandType}' failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Execute full ODAVL cycle with progress tracking
 */
async function executeOdavlCycle(state: ExtensionState): Promise<void> {
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Running ODAVL Cycle",
        cancellable: true
    }, async (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => {
        const phases = ['observe', 'decide', 'act', 'verify', 'learn'];
        
        for (const phase of phases) {
            if (token.isCancellationRequested) {
                break;
            }
            
            progress.report({
                message: `${phase.charAt(0).toUpperCase() + phase.slice(1)} phase...`,
                increment: (100 / phases.length)
            });
            
            // Execute phase with timeout
            await executePhaseWithTimeout(phase, state, 30000); // 30 second timeout
            
            // Update UI
            state.treeProvider.refresh();
            await state.statusBarProvider.updateStatus();
        }
    });
}

/**
 * Execute individual ODAVL phases
 */
async function executeObserve(state: ExtensionState): Promise<void> {
    await state.metricsService.runObserve();
    state.treeProvider.refresh();
    vscode.window.showInformationMessage('ODAVL Observe phase completed');
}

async function executeDecide(state: ExtensionState): Promise<void> {
    await state.metricsService.runDecide();
    state.treeProvider.refresh();
    vscode.window.showInformationMessage('ODAVL Decide phase completed');
}

async function executeAct(state: ExtensionState): Promise<void> {
    await state.metricsService.runAct();
    state.treeProvider.refresh();
    vscode.window.showInformationMessage('ODAVL Act phase completed');
}

async function executeVerify(state: ExtensionState): Promise<void> {
    await state.metricsService.runVerify();
    state.treeProvider.refresh();
    vscode.window.showInformationMessage('ODAVL Verify phase completed');
}

async function executeLearn(state: ExtensionState): Promise<void> {
    await state.metricsService.runLearn();
    state.treeProvider.refresh();
    vscode.window.showInformationMessage('ODAVL Learn phase completed');
}

async function executeUndo(state: ExtensionState): Promise<void> {
    const confirmed = await vscode.window.showWarningMessage(
        'This will undo the last ODAVL changes. Continue?',
        'Yes', 'No'
    );
    
    if (confirmed === 'Yes') {
        await state.metricsService.runUndo();
        state.treeProvider.refresh();
        vscode.window.showInformationMessage('ODAVL changes undone successfully');
    }
}

/**
 * Execute phase with timeout protection
 */
async function executePhaseWithTimeout(phase: string, state: ExtensionState, timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error(`Phase '${phase}' timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        (async () => {
            try {
                switch (phase) {
                    case 'observe':
                        await state.metricsService.runObserve();
                        break;
                    case 'decide':
                        await state.metricsService.runDecide();
                        break;
                    case 'act':
                        await state.metricsService.runAct();
                        break;
                    case 'verify':
                        await state.metricsService.runVerify();
                        break;
                    case 'learn':
                        await state.metricsService.runLearn();
                        break;
                }
                clearTimeout(timeout);
                resolve();
            } catch (error) {
                clearTimeout(timeout);
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        })();
    });
}

/**
 * Show webview panels
 */
async function showDoctorPanel(state: ExtensionState): Promise<void> {
    if (!state.doctorPanel) {
        state.doctorPanel = new DoctorPanel(state.context, state.metricsService, state.loggingService);
    }
    state.doctorPanel.show();
}

async function showDashboard(state: ExtensionState): Promise<void> {
    // Reuse analytics panel for dashboard functionality
    await showAnalyticsPanel(state);
}

async function showAnalyticsPanel(state: ExtensionState): Promise<void> {
    if (!state.analyticsPanel) {
        state.analyticsPanel = new AnalyticsPanel(state.context, state.metricsService, state.loggingService);
    }
    state.analyticsPanel.show();
}

async function showCompliancePanel(state: ExtensionState): Promise<void> {
    if (!state.compliancePanel) {
        state.compliancePanel = new CompliancePanel(state.context, state.diagnosticsService, state.loggingService);
    }
    state.compliancePanel.show();
}

/**
 * Utility functions
 */
async function exportReports(state: ExtensionState): Promise<void> {
    const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file('odavl-reports.json'),
        filters: {
            'JSON': ['json']
        }
    });
    
    if (uri) {
        await state.metricsService.exportReports(uri.fsPath);
        vscode.window.showInformationMessage(`Reports exported to ${uri.fsPath}`);
    }
}

async function clearCache(state: ExtensionState): Promise<void> {
    const confirmed = await vscode.window.showWarningMessage(
        'This will clear all cached ODAVL data. Continue?',
        'Yes', 'No'
    );
    
    if (confirmed === 'Yes') {
        await state.metricsService.clearCache();
        state.treeProvider.refresh();
        vscode.window.showInformationMessage('ODAVL cache cleared successfully');
    }
}

/**
 * Initialize background monitoring with error resilience
 */
async function initializeMonitoring(state: ExtensionState): Promise<void> {
    // File system watcher for ODAVL configuration changes
    const configWatcher = vscode.workspace.createFileSystemWatcher('**/.odavl/**/*');
    
    configWatcher.onDidChange(async (_uri) => {
        try {
            await state.configService.reload();
            state.treeProvider.refresh();
        } catch (error) {
            await state.errorBoundary.handleError(
                error instanceof Error ? error : new Error(String(error)),
                'Config file change handling'
            );
        }
    });

    state.context.subscriptions.push(configWatcher);

    // Periodic metrics refresh
    const metricsInterval = setInterval(async () => {
        try {
            if (state.configService.getConfiguration().autoRefresh) {
                await state.metricsService.refreshMetrics();
                state.treeProvider.refresh();
            }
        } catch (error) {
            await state.errorBoundary.handleError(
                error instanceof Error ? error : new Error(String(error)),
                'Periodic metrics refresh'
            );
        }
    }, 30000); // 30 seconds

    state.context.subscriptions.push({
        dispose: () => clearInterval(metricsInterval)
    });
}

/**
 * Show welcome notification for new users
 */
async function showWelcomeNotification(
    configService: ConfigurationService,
    _notificationService: NotificationService
): Promise<void> {
    const hasShownWelcome = configService.getConfiguration().hasShownWelcome;
    
    if (!hasShownWelcome) {
        const action = await vscode.window.showInformationMessage(
            'Welcome to ODAVL Studio Enhanced! Get started with Doctor Mode for real-time monitoring.',
            'Open Doctor Mode',
            'View Documentation',
            'Don\'t show again'
        );
        
        switch (action) {
            case 'Open Doctor Mode':
                vscode.commands.executeCommand('odavl.doctorMode');
                break;
            case 'View Documentation':
                vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-org/odavl#readme'));
                break;
            case 'Don\'t show again':
                await configService.updateConfiguration({ hasShownWelcome: true });
                break;
        }
    }
}

/**
 * Enhanced deactivation with cleanup and state preservation
 */
export async function deactivate(): Promise<void> {
    if (extensionState) {
        try {
            extensionState.loggingService.info('ODAVL Studio Enhanced deactivation started');

            // Save state before cleanup
            await extensionState.metricsService.saveState();
            await extensionState.configService.saveConfiguration();

            // Dispose of webview panels
            extensionState.doctorPanel?.dispose();
            extensionState.analyticsPanel?.dispose();
            extensionState.compliancePanel?.dispose();

            // Clean up services
            await extensionState.metricsService.dispose();
            await extensionState.telemetryService.dispose();
            await extensionState.loggingService.dispose();

            extensionState.loggingService.info('ODAVL Studio Enhanced deactivation completed');
            
        } catch (error) {
            console.error('Error during ODAVL Studio Enhanced deactivation:', error);
        } finally {
            extensionState = undefined;
        }
    }
}

/**
 * Export extension state for external access (testing, debugging)
 */
export function getExtensionState(): ExtensionState | undefined {
    return extensionState;
}