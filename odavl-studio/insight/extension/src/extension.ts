import * as vscode from 'vscode';
import { initializeProviders, type ODAVLProviders } from './initialization/providers';
import { registerCommands, registerEventListeners } from './initialization/commands';
import { LicenseManager, SubscriptionTier } from './license/license-manager.js';
import { DetectorRegistry } from './detector-registry.js';
import { BrainService } from './services/brain-service';
import { BrainDiagnosticsProvider } from './diagnostics/brain-diagnostics';
import { registerBrainCommands } from './commands/brain-analyze';
import { InsightAnalysisProvider } from './diagnostics/insight-sdk-provider';
import { InsightStatusBar } from './ui/status-bar';
import { InsightHoverProvider } from './ui/hover-provider';
import { configureInsightTelemetry, trackInsightEvent, InsightTelemetryClient } from '@odavl-studio/telemetry';

let providers: ODAVLProviders;
let licenseManager: LicenseManager;
let statusBarItem: vscode.StatusBarItem;
let brainService: BrainService;
let brainDiagnostics: BrainDiagnosticsProvider;
let insightProvider: InsightAnalysisProvider;
let insightStatusBar: InsightStatusBar;
let insightHoverProvider: InsightHoverProvider;

/**
 * Extension activation - optimized for fast startup (<200ms) with tier enforcement
 * 
 * **Optimization Strategy:**
 * 1. Defer heavy initialization until first use
 * 2. Lazy-load detector modules on-demand
 * 3. Register commands immediately (lightweight)
 * 4. Initialize on first command or file save
 * 5. **NEW**: License check and tier-based feature gating
 * 
 * **Performance:**
 * - Target: <200ms activation
 * - Measured: ~150ms (2025-01 optimization)
 * - Full init: ~800ms (on first use)
 * 
 * @param context Extension context
 */
export async function activate(context: vscode.ExtensionContext) {
    const startTime = Date.now();

    try {
        // Step 1: Initialize License Manager
        licenseManager = new LicenseManager(context);
        
        // Step 2: Check License (async but don't block activation)
        const licensePromise = licenseManager.checkLicense();
        
        // Step 2b: Initialize Telemetry
        const config = vscode.workspace.getConfiguration('odavl');
        const telemetryEnabled = config.get<boolean>('telemetry.enabled', true);
        
        // Get user email from license (if available)
        licensePromise.then(license => {
            const userId = license.email 
                ? InsightTelemetryClient.hashUserId(license.email)
                : 'anonymous';
            
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            
            configureInsightTelemetry({
                enabled: telemetryEnabled,
                userId,
                sessionId: InsightTelemetryClient.generateSessionId(),
                workspaceRoot,
                logLocally: true,
            });
        }).catch(() => {
            // Telemetry initialization failed, continue without it
        });
        
        // Step 3: Create Status Bar Item
        statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        statusBarItem.command = 'odavl-insight.showLicenseInfo';
        context.subscriptions.push(statusBarItem);

        // Step 4: Initialize all providers (lightweight)
        providers = initializeProviders(context);

        // Step 5: Register all commands
        registerCommands(context, providers);
        
        // Step 6: Register license-specific commands
        registerLicenseCommands(context);

        // Step 7: Initialize Insight SDK Provider (Wave 5)
        insightProvider = new InsightAnalysisProvider(context);
        insightStatusBar = new InsightStatusBar();
        insightHoverProvider = new InsightHoverProvider();
        
        // Wire up callbacks
        insightProvider.setIssueCountCallback((count) => {
            insightStatusBar.setIssueCount(count);
        });
        
        insightProvider.setDiagnosticsUpdatedCallback((uri, diagnostics) => {
            insightHoverProvider.updateDiagnostics(uri, diagnostics);
        });
        
        context.subscriptions.push(insightStatusBar);
        
        // Register hover provider for TypeScript/JavaScript
        context.subscriptions.push(
            vscode.languages.registerHoverProvider(
                ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
                insightHoverProvider
            )
        );
        
        // Register Insight SDK commands
        context.subscriptions.push(
            vscode.commands.registerCommand('odavl-insight.analyzeWorkspace', async () => {
                // Track extension scan triggered
                await trackInsightEvent('insight.extension_scan_triggered', {
                    trigger: 'command_palette',
                    workspaceType: vscode.workspace.workspaceFolders?.length === 1 ? 'single' : 'multi',
                }, {
                    userId: 'from-config', // Set during telemetry init
                    planId: 'INSIGHT_FREE', // TODO: Get from license
                    source: 'vscode',
                });
                
                insightStatusBar.setAnalyzing(true);
                await insightProvider.analyzeWorkspaceWithSDK();
                insightStatusBar.setAnalyzing(false);
            })
        );
        
        context.subscriptions.push(
            vscode.commands.registerCommand('odavl-insight.clearDiagnostics', () => {
                insightProvider.clearDiagnostics();
                insightStatusBar.setIssueCount(0);
            })
        );
        
        // Wave 6: Register Autopilot fix command
        const outputChannel = vscode.window.createOutputChannel('ODAVL Autopilot');
        const { AutopilotFixProvider } = await import('./commands/autopilot-fix');
        const autopilotProvider = new AutopilotFixProvider(outputChannel);
        
        context.subscriptions.push(outputChannel);
        context.subscriptions.push(
            vscode.commands.registerCommand('odavl-insight.autopilotFixIssues', async () => {
                await autopilotProvider.runAutopilotFix();
            })
        );
        
        // Auto-analyze on file save (Insight SDK)
        vscode.workspace.onDidSaveTextDocument(async (doc) => {
            if (doc.uri.scheme === 'file') {
                // Track extension scan triggered (auto-save)
                await trackInsightEvent('insight.extension_scan_triggered', {
                    trigger: 'auto_save',
                    workspaceType: vscode.workspace.workspaceFolders?.length === 1 ? 'single' : 'multi',
                }, {
                    userId: 'from-config',
                    planId: 'INSIGHT_FREE',
                    source: 'vscode',
                });
                
                await insightProvider.analyzeFileOnSave(doc);
            }
        }, null, context.subscriptions);

        // Step 8: Initialize Brain Service (Phase Ω-P1)
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (workspaceRoot) {
            brainService = new BrainService(workspaceRoot);
            brainDiagnostics = new BrainDiagnosticsProvider();
            
            // Register Brain commands
            await registerBrainCommands(context, brainService);
            
            // Auto-analyze on file save (Brain)
            vscode.workspace.onDidSaveTextDocument(async (doc) => {
                if (doc.uri.scheme === 'file') {
                    const result = await brainService.getDeploymentConfidence({
                        changedFiles: [doc.uri.fsPath]
                    });
                    await brainDiagnostics.updateDiagnostics(doc, result);
                }
            }, null, context.subscriptions);
            
            context.subscriptions.push(brainDiagnostics);
        }

        // Step 9: Register event listeners
        registerEventListeners(context, providers);

        // Step 10: Update UI with license info (non-blocking)
        licensePromise.then(license => {
            updateStatusBar(license);
            
            // Show upgrade prompt if FREE tier
            if (license.tier === SubscriptionTier.FREE) {
                const availableCount = DetectorRegistry.getDetectorCountByTier(SubscriptionTier.FREE);
                const proCount = DetectorRegistry.getDetectorCountByTier(SubscriptionTier.PRO);
                
                vscode.window.showInformationMessage(
                    `ODAVL Insight FREE: ${availableCount} detectors available. Upgrade to PRO for ${proCount} detectors + ML predictions.`,
                    'Learn More',
                    'Dismiss'
                ).then(action => {
                    if (action === 'Learn More') {
                        vscode.env.openExternal(vscode.Uri.parse('https://odavl.studio/pricing'));
                    }
                });
            }
        }).catch(err => {
            console.error('License check failed:', err);
            updateStatusBar({
                tier: SubscriptionTier.FREE,
                email: undefined
            });
        });

        const activationTime = Date.now() - startTime;
        console.log(`ODAVL Insight activated in ${activationTime}ms (multi-language mode with license check)`);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('ODAVL Insight: Activation failed', error);
        vscode.window.showErrorMessage(
            `ODAVL Insight: Failed to activate extension. ${errorMsg}`,
            'View Logs'
        ).then(selection => {
            if (selection === 'View Logs') {
                vscode.commands.executeCommand('workbench.action.toggleDevTools');
            }
        });
        throw error;
    }
}

/**
 * Register license-specific commands
 */
function registerLicenseCommands(context: vscode.ExtensionContext) {
    // Show license info
    context.subscriptions.push(
        vscode.commands.registerCommand('odavl-insight.showLicenseInfo', async () => {
            const license = await licenseManager.checkLicense();
            const available = DetectorRegistry.getAvailableDetectors(license.tier);
            const locked = DetectorRegistry.getLockedDetectors(license.tier);

            const message = `**ODAVL Insight ${license.tier}**\n\n` +
                `✅ Available Detectors: ${available.length}\n` +
                `🔒 Locked Detectors: ${locked.length}\n\n` +
                (license.email ? `📧 Licensed to: ${license.email}\n` : '') +
                (license.expiresAt ? `📅 Expires: ${license.expiresAt.toLocaleDateString()}\n` : '') +
                `\n**Available:**\n${available.map(d => `  • ${d.name}`).join('\n')}` +
                (locked.length > 0 ? `\n\n**Locked (Upgrade Required):**\n${locked.map(d => `  🔒 ${d.name} (${d.requiredTier})`).join('\n')}` : '');

            vscode.window.showInformationMessage(
                message,
                { modal: true },
                'Upgrade',
                'Close'
            ).then(action => {
                if (action === 'Upgrade') {
                    vscode.env.openExternal(vscode.Uri.parse('https://odavl.studio/upgrade?from=vscode'));
                }
            });
        })
    );

    // Enter license key
    context.subscriptions.push(
        vscode.commands.registerCommand('odavl-insight.enterLicenseKey', async () => {
            const licenseKey = await vscode.window.showInputBox({
                prompt: 'Enter your ODAVL Insight license key',
                placeHolder: 'PRO-email@example.com-1733529600-abc123',
                ignoreFocusOut: true,
                password: false
            });

            if (licenseKey) {
                try {
                    await licenseManager.saveLicenseKey(licenseKey);
                    const license = await licenseManager.checkLicense();
                    updateStatusBar(license);
                    
                    vscode.window.showInformationMessage(
                        `Welcome to ODAVL Insight ${license.tier}! 🎉`,
                        'View Features'
                    ).then(action => {
                        if (action === 'View Features') {
                            vscode.commands.executeCommand('odavl-insight.showLicenseInfo');
                        }
                    });
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to save license: ${error}`);
                }
            }
        })
    );

    // Show upgrade prompt (called when clicking locked features)
    context.subscriptions.push(
        vscode.commands.registerCommand('odavl.showUpgradePrompt', async () => {
            const license = await licenseManager.checkLicense();
            const currentTier = license.tier;
            
            let message = '';
            let upgradeUrl = '';
            
            if (currentTier === SubscriptionTier.FREE) {
                message = '🔒 This detector requires PRO or ENTERPRISE tier.\n\n' +
                         'PRO: $29/month - 13 detectors, 10 projects, 1000 analyses/month\n' +
                         'ENTERPRISE: $299/month - 16+ detectors, unlimited projects';
                upgradeUrl = 'https://odavl.studio/upgrade?from=free&feature=detector';
            } else if (currentTier === SubscriptionTier.PRO) {
                message = '🔒 This detector requires ENTERPRISE tier.\n\n' +
                         'ENTERPRISE: $299/month - 16+ detectors, unlimited projects, custom rules, audit logs';
                upgradeUrl = 'https://odavl.studio/upgrade?from=pro&feature=detector';
            }
            
            if (message) {
                vscode.window.showInformationMessage(
                    message,
                    'Upgrade Now',
                    'Compare Plans',
                    'Not Now'
                ).then(action => {
                    if (action === 'Upgrade Now') {
                        vscode.env.openExternal(vscode.Uri.parse(upgradeUrl));
                    } else if (action === 'Compare Plans') {
                        vscode.env.openExternal(vscode.Uri.parse('https://odavl.studio/pricing'));
                    }
                });
            }
        })
    );
}

/**
 * Update status bar with license info
 */
function updateStatusBar(license: { tier: SubscriptionTier; email?: string }) {
    const tierEmoji: Record<SubscriptionTier, string> = {
        [SubscriptionTier.FREE]: '🆓',
        [SubscriptionTier.PRO]: '⭐',
        [SubscriptionTier.ENTERPRISE]: '👑'
    };

    const tierColor: Record<SubscriptionTier, string> = {
        [SubscriptionTier.FREE]: '#999999',
        [SubscriptionTier.PRO]: '#FFD700',
        [SubscriptionTier.ENTERPRISE]: '#FF6B35'
    };

    statusBarItem.text = `${tierEmoji[license.tier]} ODAVL Insight ${license.tier}`;
    statusBarItem.tooltip = license.tier === SubscriptionTier.FREE
        ? 'Click to upgrade to PRO for advanced detectors'
        : `ODAVL Insight ${license.tier}${license.email ? ` (${license.email})` : ''}`;
    statusBarItem.backgroundColor = undefined; // Use default
    statusBarItem.show();
}

/**
 * Get License Manager (for use in other modules)
 */
export function getLicenseManager(): LicenseManager {
    if (!licenseManager) {
        throw new Error('License Manager not initialized - extension not activated');
    }
    return licenseManager;
}

/**
 * Extension deactivation - cleanup
 */
export function deactivate() {
    try {
        console.log('ODAVL Insight: Deactivating...');
        
        if (!providers) {
            return;
        }

        // Dispose providers
        providers.issuesExplorer?.dispose?.();
        providers.detectorsProvider?.dispose?.();
        providers.statisticsProvider?.dispose?.();
        providers.dashboardProvider?.dispose?.();
        
        // Dispose diagnostics
        providers.diagnosticCollection?.clear();
        providers.diagnosticCollection?.dispose();
        providers.multiLanguageDiagnostics?.dispose();
        
        // Dispose status bar
        providers.languageStatusBar?.dispose();
        statusBarItem?.dispose();
        
        console.log('ODAVL Insight: Deactivated successfully');
    } catch (error) {
        console.error('ODAVL Insight: Deactivation error:', error);
    }
}
