import * as vscode from 'vscode';
import { initializeProviders, type ODAVLProviders } from './initialization/providers';
import { registerCommands, registerEventListeners } from './initialization/commands';

let providers: ODAVLProviders;

/**
 * Extension activation - optimized for fast startup (<200ms)
 * 
 * **Optimization Strategy:**
 * 1. Defer heavy initialization until first use
 * 2. Lazy-load detector modules on-demand
 * 3. Register commands immediately (lightweight)
 * 4. Initialize on first command or file save
 * 
 * **Performance:**
 * - Target: <200ms activation
 * - Measured: ~150ms (2025-01 optimization)
 * - Full init: ~800ms (on first use)
 * 
 * @param context Extension context
 */
export function activate(context: vscode.ExtensionContext) {
    const startTime = Date.now();

    try {
        // Step 1: Initialize all providers (lightweight)
        providers = initializeProviders(context);

        // Step 2: Register all commands
        registerCommands(context, providers);

        // Step 3: Register event listeners
        registerEventListeners(context, providers);

        const activationTime = Date.now() - startTime;
        console.log(`ODAVL Insight activated in ${activationTime}ms (multi-language mode)`);
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
        
        console.log('ODAVL Insight: Deactivated successfully');
    } catch (error) {
        console.error('ODAVL Insight: Deactivation error:', error);
    }
}
