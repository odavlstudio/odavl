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
 */

import * as vscode from 'vscode';
import { AuthManager } from './auth/auth-manager';
import { createInsightClient, type InsightCloudClient } from '@odavl-studio/sdk/insight-cloud';
import { AnalysisService } from './services/analysis-service';

// Extension state
let authManager: AuthManager;
let cloudClient: InsightCloudClient;
let analysisService: AnalysisService;
let outputChannel: vscode.OutputChannel;

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

    // Create output channel
    outputChannel = vscode.window.createOutputChannel('ODAVL Insight');
    context.subscriptions.push(outputChannel);
    
    // Step 1: Initialize auth manager
    authManager = new AuthManager(context);
    context.subscriptions.push(authManager);
    
    // Step 2: Initialize cloud client (unauthenticated initially)
    cloudClient = createInsightClient();
    
    // Step 3: Restore auth state (async, non-blocking)
    const authStatePromise = authManager.initialize();
    
    // Step 4: Register all commands immediately (lightweight)
    registerCommands(context);
    
    // Step 5: Wait for auth state and initialize analysis service
    const authState = await authStatePromise;
    
    // Update cloud client with auth token
    if (authState.isAuthenticated) {
      const accessToken = await authManager.getAccessToken();
      cloudClient.setAccessToken(accessToken);
    }
    
    // Initialize analysis service
    analysisService = new AnalysisService(context, cloudClient, authState);
    context.subscriptions.push(analysisService);
    
    // Step 6: Listen for auth changes
    authManager.onAuthChange(async (newAuthState) => {
      // Update cloud client token
      const accessToken = await authManager.getAccessToken();
      cloudClient.setAccessToken(accessToken);
      
      // Update analysis service auth state
      analysisService.updateAuthState(newAuthState);
      
      outputChannel.appendLine(
        `Auth state changed: ${newAuthState.isAuthenticated ? 'Signed in' : 'Signed out'} (${newAuthState.planId})`
      );
    });
    
    // Step 7: Show welcome message for new users
    const hasSeenWelcome = context.globalState.get('odavl.hasSeenWelcome', false);
    if (!hasSeenWelcome && !authState.isAuthenticated) {
      showWelcomeMessage(context);
    }

    const activationTime = Date.now() - startTime;
    console.log(`ODAVL Insight v2: Activated in ${activationTime}ms`);
    outputChannel.appendLine(`Extension activated in ${activationTime}ms`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('ODAVL Insight v2: Activation failed', error);
    vscode.window.showErrorMessage(
      `ODAVL Insight: Failed to activate extension. ${errorMsg}`,
      'View Logs'
    ).then(selection => {
      if (selection === 'View Logs') {
        outputChannel.show();
      }
    });
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
      await authManager.signIn();
    })
  );
  
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl-insight.signOut', async () => {
      await authManager.signOut();
    })
  );
  
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl-insight.showAccountMenu', async () => {
      await authManager.showAccountMenu();
    })
  );

  // Analysis commands
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl-insight.analyzeWorkspaceLocal', async () => {
      outputChannel.appendLine('Starting local analysis...');
      const issues = await analysisService.analyzeWorkspace({ mode: 'local' });
      vscode.window.showInformationMessage(`Local analysis: ${issues.length} issues found`);
    })
  );
  
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl-insight.analyzeWorkspaceCloud', async () => {
      const authState = await authManager.getAuthState();
      
      if (!authState.isAuthenticated) {
        const action = await vscode.window.showWarningMessage(
          'Cloud analysis requires sign-in',
          'Sign In',
          'Cancel'
        );
        
        if (action === 'Sign In') {
          await authManager.signIn();
        }
        return;
      }
      
      outputChannel.appendLine('Starting cloud analysis...');
      const issues = await analysisService.analyzeWorkspace({ mode: 'cloud' });
      
      if (issues.length > 0) {
        const analysisId = analysisService.getCurrentAnalysisId();
        if (analysisId) {
          vscode.window.showInformationMessage(
            `Cloud analysis: ${issues.length} issues found`,
            'View in Cloud'
          ).then(action => {
            if (action === 'View in Cloud') {
              vscode.env.openExternal(
                vscode.Uri.parse(`https://cloud.odavl.studio/insight/analyses/${analysisId}`)
              );
            }
          });
        }
      }
    })
  );
  
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl-insight.analyzeWorkspace', async () => {
      // Smart analysis: local + cloud for authenticated users, local only otherwise
      const authState = await authManager.getAuthState();
      const mode = authState.isAuthenticated ? 'both' : 'local';
      
      outputChannel.appendLine(`Starting ${mode} analysis...`);
      const issues = await analysisService.analyzeWorkspace({ mode });
      
      vscode.window.showInformationMessage(`Analysis complete: ${issues.length} issues found`);
    })
  );
  
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl-insight.clearDiagnostics', () => {
      analysisService.clearDiagnostics();
      vscode.window.showInformationMessage('Diagnostics cleared');
    })
  );

  // Utility commands
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl-insight.showDashboard', async () => {
      const authState = await authManager.getAuthState();
      
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
      const authState = await authManager.getAuthState();
      
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
 * Show welcome message for new users
 */
function showWelcomeMessage(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage(
    'Welcome to ODAVL Insight! 👋',
    'Sign In',
    'Try Local Analysis',
    'Learn More'
  ).then(action => {
    if (action === 'Sign In') {
      vscode.commands.executeCommand('odavl-insight.signIn');
    } else if (action === 'Try Local Analysis') {
      vscode.commands.executeCommand('odavl-insight.analyzeWorkspaceLocal');
    } else if (action === 'Learn More') {
      vscode.env.openExternal(vscode.Uri.parse('https://odavl.studio/docs/vscode-extension'));
    }
    
    context.globalState.update('odavl.hasSeenWelcome', true);
  });
}

/**
 * Extension deactivation
 */
export function deactivate() {
  try {
    console.log('ODAVL Insight v2: Deactivating...');
    
    // Dispose services
    analysisService?.dispose();
    authManager?.dispose();
    outputChannel?.dispose();
    
    console.log('ODAVL Insight v2: Deactivated successfully');
  } catch (error) {
    console.error('ODAVL Insight v2: Deactivation error:', error);
  }
}
