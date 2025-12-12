/**
 * Auth Manager - ODAVL ID Integration for VS Code Extension
 * 
 * Manages authentication using Phase 3 ODAVL ID with VS Code SecretStorage.
 * Implements device code flow for secure browser-based sign-in.
 * 
 * Flow:
 * 1. User clicks "Sign In" command
 * 2. Device code requested from ODAVL backend
 * 3. Browser opens with user code
 * 4. Extension polls for authorization
 * 5. Tokens stored in VS Code SecretStorage
 * 6. Session validated on extension activation
 */

import * as vscode from 'vscode';
import type { OdavlSession, OdavlTokenPayload, InsightPlanId } from '@odavl-studio/auth';

/**
 * Secret storage keys
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'odavl.accessToken',
  REFRESH_TOKEN: 'odavl.refreshToken',
  USER_EMAIL: 'odavl.userEmail',
  USER_NAME: 'odavl.userName',
  PLAN_ID: 'odavl.planId',
} as const;

/**
 * ODAVL backend URLs (environment-based)
 */
const BACKEND_URLS = {
  production: 'https://cloud.odavl.studio',
  development: 'http://localhost:3000',
} as const;

/**
 * Get backend URL based on environment
 */
function getBackendUrl(): string {
  // TODO: Add configuration setting for backend URL
  return BACKEND_URLS.production;
}

/**
 * Device code response from backend
 */
interface DeviceCodeResponse {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete?: string;
  expiresIn: number;
  interval: number;
}

/**
 * Token response after successful authorization
 */
interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    insightPlanId?: InsightPlanId;
  };
}

/**
 * Auth state for extension
 */
export interface AuthState {
  isAuthenticated: boolean;
  email?: string;
  name?: string;
  planId: InsightPlanId;
}

/**
 * Auth Manager - Handles ODAVL ID authentication
 */
export class AuthManager {
  private context: vscode.ExtensionContext;
  private statusBarItem: vscode.StatusBarItem;
  private onAuthChangeEmitter = new vscode.EventEmitter<AuthState>();
  
  /**
   * Event fired when auth state changes
   */
  readonly onAuthChange = this.onAuthChangeEmitter.event;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    
    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'odavl-insight.showAccountMenu';
    context.subscriptions.push(this.statusBarItem);
  }

  /**
   * Initialize auth state on extension activation
   * Validates stored tokens and updates UI
   */
  async initialize(): Promise<AuthState> {
    const state = await this.getAuthState();
    this.updateStatusBar(state);
    return state;
  }

  /**
   * Get current auth state
   */
  async getAuthState(): Promise<AuthState> {
    const accessToken = await this.context.secrets.get(STORAGE_KEYS.ACCESS_TOKEN);
    
    if (!accessToken) {
      return {
        isAuthenticated: false,
        planId: 'INSIGHT_FREE',
      };
    }

    // Validate token (decode JWT payload)
    try {
      const payload = this.decodeToken(accessToken);
      
      // Check if token is expired
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        // Try to refresh
        const refreshed = await this.refreshTokens();
        if (!refreshed) {
          await this.clearTokens();
          return {
            isAuthenticated: false,
            planId: 'INSIGHT_FREE',
          };
        }
        
        // Get new state after refresh
        return this.getAuthState();
      }

      const email = await this.context.secrets.get(STORAGE_KEYS.USER_EMAIL);
      const name = await this.context.secrets.get(STORAGE_KEYS.USER_NAME);
      const planId = (await this.context.secrets.get(STORAGE_KEYS.PLAN_ID)) as InsightPlanId || 'INSIGHT_FREE';

      return {
        isAuthenticated: true,
        email,
        name,
        planId,
      };
    } catch (error) {
      console.error('Failed to decode token:', error);
      await this.clearTokens();
      return {
        isAuthenticated: false,
        planId: 'INSIGHT_FREE',
      };
    }
  }

  /**
   * Sign in with device code flow
   */
  async signIn(): Promise<boolean> {
    try {
      // Step 1: Request device code from backend
      const deviceCode = await this.requestDeviceCode();
      
      if (!deviceCode) {
        vscode.window.showErrorMessage('Failed to initiate sign-in. Please try again.');
        return false;
      }

      // Step 2: Show user code and open browser
      const opened = await this.showDeviceCodePrompt(deviceCode);
      
      if (!opened) {
        return false;
      }

      // Step 3: Poll for authorization
      const tokens = await this.pollForAuthorization(deviceCode);
      
      if (!tokens) {
        vscode.window.showWarningMessage('Sign-in was cancelled or timed out.');
        return false;
      }

      // Step 4: Store tokens
      await this.storeTokens(tokens);

      // Step 5: Update UI
      const state = await this.getAuthState();
      this.updateStatusBar(state);
      this.onAuthChangeEmitter.fire(state);

      vscode.window.showInformationMessage(
        `✅ Signed in as ${tokens.user.name} (${tokens.user.insightPlanId || 'FREE'})`
      );

      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Sign-in failed: ${errorMsg}`);
      return false;
    }
  }

  /**
   * Sign out and clear tokens
   */
  async signOut(): Promise<void> {
    await this.clearTokens();
    
    const state = await this.getAuthState();
    this.updateStatusBar(state);
    this.onAuthChangeEmitter.fire(state);
    
    vscode.window.showInformationMessage('Signed out successfully');
  }

  /**
   * Get access token for API requests
   */
  async getAccessToken(): Promise<string | undefined> {
    const state = await this.getAuthState();
    
    if (!state.isAuthenticated) {
      return undefined;
    }
    
    return await this.context.secrets.get(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Request device code from backend
   */
  private async requestDeviceCode(): Promise<DeviceCodeResponse | null> {
    try {
      const response = await fetch(`${getBackendUrl()}/api/auth/device-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: 'odavl-vscode-extension',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to request device code:', error);
      return null;
    }
  }

  /**
   * Show device code prompt and open browser
   */
  private async showDeviceCodePrompt(deviceCode: DeviceCodeResponse): Promise<boolean> {
    const action = await vscode.window.showInformationMessage(
      `Sign in with your ODAVL account\n\nYour code: ${deviceCode.userCode}`,
      { modal: true },
      'Open Browser',
      'Cancel'
    );

    if (action === 'Open Browser') {
      const uri = deviceCode.verificationUriComplete || deviceCode.verificationUri;
      await vscode.env.openExternal(vscode.Uri.parse(uri));
      return true;
    }

    return false;
  }

  /**
   * Poll for authorization completion
   */
  private async pollForAuthorization(
    deviceCode: DeviceCodeResponse
  ): Promise<TokenResponse | null> {
    const startTime = Date.now();
    const expiresAt = startTime + deviceCode.expiresIn * 1000;
    let interval = deviceCode.interval * 1000;

    return await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Waiting for authorization...',
        cancellable: true,
      },
      async (progress, token) => {
        while (Date.now() < expiresAt) {
          // Check if user cancelled
          if (token.isCancellationRequested) {
            return null;
          }

          // Poll backend
          try {
            const response = await fetch(`${getBackendUrl()}/api/auth/device-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                deviceCode: deviceCode.deviceCode,
              }),
            });

            if (response.ok) {
              // Success! User authorized
              return await response.json();
            }

            const errorData = await response.json();
            
            if (errorData.error === 'slow_down') {
              // Increase interval
              interval += 1000;
            } else if (errorData.error === 'access_denied') {
              vscode.window.showWarningMessage('Authorization was denied');
              return null;
            } else if (errorData.error === 'expired_token') {
              vscode.window.showWarningMessage('Authorization code expired');
              return null;
            }
            
            // 'authorization_pending' - continue polling
          } catch (error) {
            console.error('Polling error:', error);
          }

          // Wait before next poll
          await new Promise((resolve) => setTimeout(resolve, interval));
        }

        return null; // Timeout
      }
    );
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshTokens(): Promise<boolean> {
    try {
      const refreshToken = await this.context.secrets.get(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${getBackendUrl()}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const tokens: TokenResponse = await response.json();
      await this.storeTokens(tokens);

      return true;
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      return false;
    }
  }

  /**
   * Store tokens in SecretStorage
   */
  private async storeTokens(tokens: TokenResponse): Promise<void> {
    await this.context.secrets.store(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    await this.context.secrets.store(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    await this.context.secrets.store(STORAGE_KEYS.USER_EMAIL, tokens.user.email);
    await this.context.secrets.store(STORAGE_KEYS.USER_NAME, tokens.user.name);
    await this.context.secrets.store(
      STORAGE_KEYS.PLAN_ID,
      tokens.user.insightPlanId || 'INSIGHT_FREE'
    );
  }

  /**
   * Clear all tokens from SecretStorage
   */
  private async clearTokens(): Promise<void> {
    await this.context.secrets.delete(STORAGE_KEYS.ACCESS_TOKEN);
    await this.context.secrets.delete(STORAGE_KEYS.REFRESH_TOKEN);
    await this.context.secrets.delete(STORAGE_KEYS.USER_EMAIL);
    await this.context.secrets.delete(STORAGE_KEYS.USER_NAME);
    await this.context.secrets.delete(STORAGE_KEYS.PLAN_ID);
  }

  /**
   * Decode JWT token (simple decode, no verification)
   */
  private decodeToken(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  }

  /**
   * Update status bar with auth state
   */
  private updateStatusBar(state: AuthState): void {
    if (state.isAuthenticated) {
      const planEmoji = {
        INSIGHT_FREE: '🆓',
        INSIGHT_PRO: '⭐',
        INSIGHT_TEAM: '👥',
        INSIGHT_ENTERPRISE: '👑',
      }[state.planId];

      const planName = state.planId.replace('INSIGHT_', '');

      this.statusBarItem.text = `${planEmoji} ${state.name || state.email}`;
      this.statusBarItem.tooltip = `ODAVL Insight ${planName}\nClick to manage account`;
    } else {
      this.statusBarItem.text = '$(account) Sign In';
      this.statusBarItem.tooltip = 'Sign in to ODAVL Insight Cloud';
    }

    this.statusBarItem.show();
  }

  /**
   * Show account menu
   */
  async showAccountMenu(): Promise<void> {
    const state = await this.getAuthState();

    if (!state.isAuthenticated) {
      const action = await vscode.window.showQuickPick(
        [
          {
            label: '$(sign-in) Sign In',
            description: 'Sign in with your ODAVL account',
            action: 'signin',
          },
          {
            label: '$(question) Learn More',
            description: 'Visit ODAVL website',
            action: 'learn',
          },
        ],
        {
          placeHolder: 'ODAVL Insight - Not signed in',
        }
      );

      if (action?.action === 'signin') {
        await this.signIn();
      } else if (action?.action === 'learn') {
        await vscode.env.openExternal(vscode.Uri.parse('https://odavl.studio'));
      }
    } else {
      const planName = state.planId.replace('INSIGHT_', '');
      const items = [
        {
          label: `$(account) ${state.name || state.email}`,
          description: `Plan: ${planName}`,
          action: 'profile',
        },
        {
          label: '$(cloud) Open Cloud Dashboard',
          description: 'View your projects and analyses',
          action: 'dashboard',
        },
      ];

      // Add upgrade option for FREE users
      if (state.planId === 'INSIGHT_FREE') {
        items.push({
          label: '$(star) Upgrade to PRO',
          description: 'Unlock advanced features',
          action: 'upgrade',
        });
      }

      items.push({
        label: '$(sign-out) Sign Out',
        description: 'Clear authentication',
        action: 'signout',
      });

      const action = await vscode.window.showQuickPick(items, {
        placeHolder: `Signed in as ${state.email}`,
      });

      if (action?.action === 'signout') {
        await this.signOut();
      } else if (action?.action === 'dashboard') {
        await vscode.env.openExternal(
          vscode.Uri.parse(`${getBackendUrl()}/insight/projects`)
        );
      } else if (action?.action === 'upgrade') {
        await vscode.env.openExternal(
          vscode.Uri.parse('https://odavl.studio/pricing?from=vscode')
        );
      } else if (action?.action === 'profile') {
        await vscode.env.openExternal(
          vscode.Uri.parse(`${getBackendUrl()}/dashboard/profile`)
        );
      }
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.statusBarItem.dispose();
    this.onAuthChangeEmitter.dispose();
  }
}
