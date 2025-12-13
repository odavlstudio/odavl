/**
 * ODAVL Insight VS Code Extension v2.0
 * 
 * **Phase 6: VS Code Extension Upgrade**
 * 
 * Features:
 * - Local + Cloud analysis modes
 * - ODAVL ID authentication (Phase 3 integration)
 * - Plan-aware features (FREE/PRO/TEAM/ENTERPRISE)
 * - Issues panel with filtering and actions
 * - Status bar with account indicator
 * - Marketplace-ready architecture
 * 
 * Architecture:
 * - auth/ - Authentication manager (ODAVL ID + SecretStorage)
 * - api/ - Cloud API client (Phase 4 backend integration)
 * - services/ - Analysis service (local + cloud coordination)
 * - commands/ - Command handlers (sign-in, analyze, etc.)
 * - views/ - Tree views (issues, detectors, statistics)
 * - ui/ - UI components (status bar, panels)
 * 
 * Performance: <200ms activation (lazy loading)
 * 
 * **Phase 4.1.1 - VS Code UX P0 fixes (wave 1):**
 * - Remove notification spam for normal analyses (use status bar + Problems Panel instead)
 * - Remove blocking upsell modal for FREE users (allow analysis to proceed)
 * - Remove blocking welcome/auth modal on first run (non-blocking local-first experience)
 * This wave focuses ONLY on notifications and blocking modals.
 */

import * as vscode from 'vscode';
import { InsightError } from './core/errors';
import { ExtensionContextContainer } from './extension-context';

// Extension state (DI container)
let extensionContainer: ExtensionContextContainer;

/**
 * Get license manager instance
 * Phase 1.1 Cleanup: Re-export for compatibility with detectors-provider
 */
export function getLicenseManager() {
  if (!extensionContainer) {
    throw new Error('Extension not initialized. Extension may not be activated.');
  }
  return extensionContainer.getLicenseManager();
}

/**
 * Get extension container (for testing)
 */
export function getExtensionContainer(): ExtensionContextContainer | undefined {
  return extensionContainer;
}

/**
 * Phase 1.2: Check telemetry consent on first activation
 * 
 * Respects VS Code global telemetry setting and shows consent prompt.
 * Only prompts once - stores decision in extension configuration.
 */
async function checkTelemetryConsent(context: vscode.ExtensionContext): Promise<void> {
  // Check if VS Code telemetry is disabled globally
  const vscTelemetryLevel = vscode.env.telemetryLevel;
  if (vscTelemetryLevel === vscode.TelemetryLevel.Off) {
    // Respect global preference - don't even ask
    const config = vscode.workspace.getConfiguration('odavl.insight');
    await config.update('telemetry.enabled', false, vscode.ConfigurationTarget.Global);
    return;
  }
  
  // Check if we've already asked
  const hasAsked = context.globalState.get<boolean>('telemetry.consentAsked', false);
  if (hasAsked) {
    return; // User already made a choice
  }
  
  // Show consent prompt
  const answer = await vscode.window.showInformationMessage(
    '📊 Help improve ODAVL Insight by sending anonymous usage data?\n\n' +
    'We collect anonymous usage statistics to improve the extension. ' +
    'No personal information, workspace paths, or code is ever sent.',
    { modal: false },
    'Enable',
    'Disable'
  );
  
  // Store decision
  const enabled = answer === 'Enable';
  const config = vscode.workspace.getConfiguration('odavl.insight');
  await config.update('telemetry.enabled', enabled, vscode.ConfigurationTarget.Global);
  await context.globalState.update('telemetry.consentAsked', true);
  
  if (enabled) {
    vscode.window.showInformationMessage('✅ Thank you for helping improve ODAVL!');
  } else {
    vscode.window.showInformationMessage('Telemetry disabled. You can change this in settings.');
  }
}

/**
 * Extension activation
 * 
 * Optimized for fast startup:
 * 1. Initialize auth manager
 * 2. Register commands (lightweight)
 * 3. Restore auth state
 * 4. Lazy-load heavy services on first use
 * 
 * @param context Extension context
 */
export async function activate(context: vscode.ExtensionContext) {
  const startTime = Date.now();

  try {
    console.log('ODAVL Insight v2: Activating...');
    
    // Phase 1.2: Telemetry consent prompt (first activation only)
    await checkTelemetryConsent(context);
    
    // Initialize extension with DI container
    extensionContainer = await ExtensionContextContainer.create({ context });
    
    // Register all commands
    registerCommands(context);
    
    // Phase 4.1.1 - Removed blocking welcome modal
    // First-run experience is now non-blocking: local analysis works immediately
    const authState = await extensionContainer.authManager.getAuthState();
    const hasSeenWelcome = context.globalState.get('odavl.hasSeenWelcome', false);
    if (!hasSeenWelcome && !authState.isAuthenticated) {
      // Show passive hint in output channel only (no modal)
      extensionContainer.outputChannel.appendLine('Welcome to ODAVL Insight! Local analysis is ready.');
      extensionContainer.outputChannel.appendLine('Tip: Sign in via Command Palette (ODAVL: Sign In) for cloud features (optional)');
      context.globalState.update('odavl.hasSeenWelcome', true);
    }

    const activationTime = Date.now() - startTime;
    console.log(`ODAVL Insight v2: Activated in ${activationTime}ms`);
    extensionContainer.outputChannel.appendLine(`Extension activated in ${activationTime}ms`);
  } catch (error) {
    console.error('ODAVL Insight v2: Activation failed', error);
    
    // Phase 4.1.5: Attribute activation errors
    const insightError = InsightError.isInsightError(error)
      ? error
      : new InsightError('INSIGHT', 'Extension activation failed', {
          cause: error instanceof Error ? error : undefined
        });
    
    if (extensionContainer?.errorPresenter) {
      await extensionContainer.errorPresenter.present(insightError, 'Extension Activation');
    } else {
      // Fallback if error presenter not initialized
      vscode.window.showErrorMessage(
        `ODAVL Insight: ${insightError.message}`,
        'View Logs'
      );
    }
    
    throw error;
  }
}

/**
 * Register all extension commands
 */
function registerCommands(context: vscode.ExtensionContext) {
  // Auth commands
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl-insight.signIn', async () => {
      await extensionContainer.authManager.signIn();
    })
  );
  
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl-insight.signOut', async () => {
      await extensionContainer.authManager.signOut();
    })
  );
  
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl-insight.showAccountMenu', async () => {
      await extensionContainer.authManager.showAccountMenu();
    })
  );

  // Analysis commands
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl-insight.analyzeWorkspaceLocal', async () => {
      // Phase 4.1.6: Use unified entry point with state machine
      const issues = await extensionContainer.analysisService.runFullAnalysis({ 
        mode: 'local',
        trigger: 'command'
      });
      if (issues.length > 0) {
        extensionContainer.outputChannel.appendLine(`Local analysis complete: ${issues.length} issues found`);
      }
      // Phase 4.1.1: No toast notification - use status bar + Problems Panel for feedback
    })
  );
  
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl-insight.analyzeWorkspaceCloud', async () => {
      const authState = await extensionContainer.authManager.getAuthState();
      
      if (!authState.isAuthenticated) {
        const action = await vscode.window.showWarningMessage(
          'Cloud analysis requires sign-in',
          'Sign In',
          'Cancel'
        );
        
        if (action === 'Sign In') {
          await extensionContainer.authManager.signIn();
        }
        return;
      }
      
      // Phase 4.1.6: Use unified entry point with state machine
      const issues = await extensionContainer.analysisService.runFullAnalysis({ 
        mode: 'cloud',
        trigger: 'command'
      });
      
      if (issues.length > 0) {
        const analysisId = extensionContainer.analysisService.getCurrentAnalysisId();
        if (analysisId) {
          extensionContainer.outputChannel.appendLine(`Cloud analysis complete: ${issues.length} issues found (ID: ${analysisId})`);
          // Phase 4.1.1: No toast notification for cloud success - use status bar + Problems Panel
          // User can view in cloud via command palette or status bar if needed
        }
      }
    })
  );
  
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl-insight.analyzeWorkspace', async () => {
      // Smart analysis: local + cloud for authenticated users, local only otherwise
      const authState = await extensionContainer.authManager.getAuthState();
      const mode = authState.isAuthenticated ? 'both' : 'local';
      
      // Phase 4.1.6: Use unified entry point with state machine
      const issues = await extensionContainer.analysisService.runFullAnalysis({ 
        mode,
        trigger: 'command'
      });
      
      if (issues.length > 0) {
        extensionContainer.outputChannel.appendLine(`Analysis complete: ${issues.length} issues found`);
      }
      // Phase 4.1.1: No toast notification - use status bar + Problems Panel for feedback
    })
  );
  
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl-insight.clearDiagnostics', () => {
      extensionContainer.analysisService.clearDiagnostics();
      extensionContainer.outputChannel.appendLine('Diagnostics cleared');
      // Phase 4.1.1: No toast notification - user can see in Problems Panel that diagnostics are gone
    })
  );

  // Utility commands
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl-insight.showDashboard', async () => {
      const authState = await extensionContainer.authManager.getAuthState();
      
      if (authState.isAuthenticated) {
        vscode.env.openExternal(
          vscode.Uri.parse('https://cloud.odavl.studio/insight/projects')
        );
      } else {
        vscode.window.showInformationMessage(
          'Sign in to access Cloud Dashboard',
          'Sign In'
        ).then(action => {
          if (action === 'Sign In') {
            vscode.commands.executeCommand('odavl-insight.signIn');
          }
        });
      }
    })
  );
  
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl-insight.showUpgrade', async () => {
      const authState = await extensionContainer.authManager.getAuthState();
      
      const planName = authState.planId.replace('INSIGHT_', '');
      const message = authState.isAuthenticated
        ? `You're on the ${planName} plan`
        : 'Sign in to unlock cloud features';
      
      vscode.window.showInformationMessage(
        message,
        'View Plans',
        'Dismiss'
      ).then(action => {
        if (action === 'View Plans') {
          vscode.env.openExternal(
            vscode.Uri.parse('https://odavl.studio/pricing?from=vscode')
          );
        }
      });
    })
  );
}

/**
 * Phase 4.1.1: Removed showWelcomeMessage function
 * Welcome modal was blocking first-run experience.
 * Now using passive output channel message instead (see activate function).
 */

/**
 * Extension deactivation
 */
export function deactivate() {
  try {
    console.log('ODAVL Insight v2: Deactivating...');
    
    // Dispose extension container (disposes all services)
    extensionContainer?.dispose();
    
    console.log('ODAVL Insight v2: Deactivated successfully');
  } catch (error) {
    console.error('ODAVL Insight v2: Deactivation error:', error);
  }
}
