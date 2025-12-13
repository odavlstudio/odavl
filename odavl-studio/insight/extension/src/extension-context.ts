/**
 * Extension Context - Dependency Injection Container
 * 
 * Allows services to be instantiated with mocked dependencies for testing.
 * No behavior changes - just DI wrapper around existing code.
 * 
 * Phase 1: Extension Stability & Testing
 */

import * as vscode from 'vscode';
import { AuthManager, type AuthState } from './auth/auth-manager';
import type { InsightCloudClient } from '@odavl-studio/sdk/insight-cloud';
import { AnalysisService } from './services/analysis-service';
import { LicenseManager } from './license/license-manager';
import { InsightStatusBar } from './ui/status-bar';
import { initErrorPresenter, type ErrorPresenter } from './ui/error-presenter';
import { createConfigService, type ConfigService } from './core/config';

/**
 * Extension dependencies (for testing)
 */
export interface ExtensionDependencies {
  context: vscode.ExtensionContext;
  outputChannel?: vscode.OutputChannel;
  cloudClientFactory?: () => InsightCloudClient;
  authManagerFactory?: (context: vscode.ExtensionContext) => AuthManager;
  statusBarFactory?: () => InsightStatusBar;
}

/**
 * Extension context container
 * 
 * Holds all extension services and allows dependency injection for testing.
 */
export class ExtensionContextContainer {
  // Core services
  public authManager: AuthManager;
  public cloudClient: InsightCloudClient;
  public analysisService: AnalysisService;
  public licenseManager: LicenseManager;
  public statusBar: InsightStatusBar;
  public errorPresenter: ErrorPresenter;
  public configService: ConfigService;
  public outputChannel: vscode.OutputChannel;
  
  // Extension context
  public readonly vsCodeContext: vscode.ExtensionContext;
  
  private constructor(
    context: vscode.ExtensionContext,
    authManager: AuthManager,
    cloudClient: InsightCloudClient,
    analysisService: AnalysisService,
    licenseManager: LicenseManager,
    statusBar: InsightStatusBar,
    errorPresenter: ErrorPresenter,
    configService: ConfigService,
    outputChannel: vscode.OutputChannel
  ) {
    this.vsCodeContext = context;
    this.authManager = authManager;
    this.cloudClient = cloudClient;
    this.analysisService = analysisService;
    this.licenseManager = licenseManager;
    this.statusBar = statusBar;
    this.errorPresenter = errorPresenter;
    this.configService = configService;
    this.outputChannel = outputChannel;
  }
  
  /**
   * Create extension context with dependency injection
   * 
   * @param deps Extension dependencies
   * @param cloudClient Pre-configured cloud client (for testing)
   * @returns Initialized extension context
   */
  static async create(
    deps: ExtensionDependencies,
    cloudClient?: InsightCloudClient
  ): Promise<ExtensionContextContainer> {
    const { context } = deps;
    
    // Create output channel
    const outputChannel = deps.outputChannel || vscode.window.createOutputChannel('ODAVL Insight');
    context.subscriptions.push(outputChannel);
    
    // Initialize error presenter
    const errorPresenter = initErrorPresenter(outputChannel);
    
    // Initialize config service
    const configService = createConfigService(errorPresenter, outputChannel);
    
    // Initialize auth manager
    const authManagerFactory = deps.authManagerFactory || ((ctx) => new AuthManager(ctx));
    const authManager = authManagerFactory(context);
    context.subscriptions.push(authManager);
    
    // Initialize cloud client (use provided or create new)
    const cloudClientFactory = deps.cloudClientFactory;
    const client = cloudClient || (cloudClientFactory ? cloudClientFactory() : (await import('@odavl-studio/sdk/insight-cloud')).createInsightClient());
    
    // Restore auth state
    const authState = await authManager.initialize();
    
    // Update cloud client with auth token
    if (authState.isAuthenticated) {
      const accessToken = await authManager.getAccessToken();
      client.setAccessToken(accessToken);
    }
    
    // Initialize status bar
    const statusBarFactory = deps.statusBarFactory || (() => new InsightStatusBar());
    const statusBar = statusBarFactory();
    context.subscriptions.push(statusBar);
    
    // Set initial mode based on auth state
    if (authState.isAuthenticated) {
      statusBar.setMode('cloud');
    } else {
      statusBar.setMode('local');
    }
    
    // Initialize analysis service
    const analysisService = new AnalysisService(context, client, authState, statusBar, configService);
    context.subscriptions.push(analysisService);
    
    // Initialize license manager
    const licenseManager = new LicenseManager(context);
    context.subscriptions.push(licenseManager);
    
    // Listen for auth changes
    authManager.onAuthChange(async (newAuthState: AuthState) => {
      const accessToken = await authManager.getAccessToken();
      client.setAccessToken(accessToken);
      analysisService.updateAuthState(newAuthState);
      
      if (newAuthState.isAuthenticated) {
        statusBar.setMode('cloud');
      } else {
        statusBar.setMode('local');
      }
      
      outputChannel.appendLine(
        `Auth state changed: ${newAuthState.isAuthenticated ? 'Signed in' : 'Signed out'} (${newAuthState.planId})`
      );
    });
    
    return new ExtensionContextContainer(
      context,
      authManager,
      client,
      analysisService,
      licenseManager,
      statusBar,
      errorPresenter,
      configService,
      outputChannel
    );
  }
  
  /**
   * Get license manager (for compatibility)
   */
  getLicenseManager(): LicenseManager {
    return this.licenseManager;
  }
  
  /**
   * Get analysis service
   */
  getAnalysisService(): AnalysisService {
    return this.analysisService;
  }
  
  /**
   * Get auth manager
   */
  getAuthManager(): AuthManager {
    return this.authManager;
  }
  
  /**
   * Dispose all services
   */
  dispose(): void {
    // Services are registered in context.subscriptions, so they'll be disposed automatically
  }
}
