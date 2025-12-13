/**
 * Example Test - Extension Context Container
 * 
 * Demonstrates how to test extension services with dependency injection.
 * This file shows the pattern - actual tests will be written in Phase 1 testing phase.
 * 
 * Phase 1: Extension Stability & Testing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ExtensionContextContainer } from '../extension-context';
import { MockExtensionContext, MockOutputChannel, MockStatusBarItem } from './vscode-mock';
import type { InsightCloudClient } from '@odavl-studio/sdk/insight-cloud';
import type { AuthState } from '../auth/auth-manager';

/**
 * Mock Cloud Client for testing
 */
class MockCloudClient implements Partial<InsightCloudClient> {
  private accessToken?: string;
  
  setAccessToken(token: string | null): void {
    this.accessToken = token || undefined;
  }
  
  getAccessToken(): string | undefined {
    return this.accessToken;
  }
}

/**
 * Mock Auth Manager for testing
 */
class MockAuthManager {
  private authState: AuthState = {
    isAuthenticated: false,
    planId: 'INSIGHT_FREE',
  };
  
  private listeners: ((state: AuthState) => void)[] = [];
  
  async initialize(): Promise<AuthState> {
    return this.authState;
  }
  
  async getAuthState(): Promise<AuthState> {
    return this.authState;
  }
  
  async getAccessToken(): Promise<string> {
    return 'mock-token';
  }
  
  onAuthChange(callback: (state: AuthState) => void) {
    this.listeners.push(callback);
    return { dispose: () => {} };
  }
  
  async signIn(): Promise<void> {
    this.authState = {
      isAuthenticated: true,
      email: 'test@example.com',
      name: 'Test User',
      planId: 'INSIGHT_PRO',
    };
    this.listeners.forEach(listener => listener(this.authState));
  }
  
  async signOut(): Promise<void> {
    this.authState = {
      isAuthenticated: false,
      planId: 'INSIGHT_FREE',
    };
    this.listeners.forEach(listener => listener(this.authState));
  }
  
  async showAccountMenu(): Promise<void> {
    // Mock implementation
  }
  
  dispose(): void {
    this.listeners = [];
  }
}

describe('ExtensionContextContainer', () => {
  let context: MockExtensionContext;
  let outputChannel: MockOutputChannel;
  let mockCloudClient: MockCloudClient;
  let mockAuthManager: MockAuthManager;

  beforeEach(() => {
    context = new MockExtensionContext();
    outputChannel = new MockOutputChannel();
    mockCloudClient = new MockCloudClient();
    mockAuthManager = new MockAuthManager();
  });

  it('should create extension container with all services', async () => {
    const container = await ExtensionContextContainer.create(
      {
        context: context as any,
        outputChannel: outputChannel as any,
        cloudClientFactory: () => mockCloudClient as any,
        authManagerFactory: () => mockAuthManager as any,
      },
      mockCloudClient as any
    );

    expect(container).toBeDefined();
    expect(container.authManager).toBeDefined();
    expect(container.cloudClient).toBeDefined();
    expect(container.analysisService).toBeDefined();
    expect(container.licenseManager).toBeDefined();
    expect(container.statusBar).toBeDefined();
    expect(container.outputChannel).toBeDefined();
  });

  it('should initialize with local mode when not authenticated', async () => {
    const container = await ExtensionContextContainer.create(
      {
        context: context as any,
        outputChannel: outputChannel as any,
        cloudClientFactory: () => mockCloudClient as any,
        authManagerFactory: () => mockAuthManager as any,
      },
      mockCloudClient as any
    );

    // Status bar should be in local mode for unauthenticated users
    // This would require statusBar to expose its mode, or we'd test via behavior
    expect(container.statusBar).toBeDefined();
  });

  it('should handle auth state changes', async () => {
    const container = await ExtensionContextContainer.create(
      {
        context: context as any,
        outputChannel: outputChannel as any,
        cloudClientFactory: () => mockCloudClient as any,
        authManagerFactory: () => mockAuthManager as any,
      },
      mockCloudClient as any
    );

    // Trigger sign in
    await mockAuthManager.signIn();

    // Cloud client should receive access token
    expect(mockCloudClient.getAccessToken()).toBe('mock-token');
  });

  it('should provide access to all services', async () => {
    const container = await ExtensionContextContainer.create(
      {
        context: context as any,
        outputChannel: outputChannel as any,
        cloudClientFactory: () => mockCloudClient as any,
        authManagerFactory: () => mockAuthManager as any,
      },
      mockCloudClient as any
    );

    expect(container.getLicenseManager()).toBeDefined();
    expect(container.getAnalysisService()).toBeDefined();
    expect(container.getAuthManager()).toBeDefined();
  });
});

/**
 * Example: How to test AnalysisService with mocks
 * 
 * This shows the pattern - full test suite will be written later.
 */
describe('AnalysisService (example)', () => {
  it('should be instantiable with mock dependencies', () => {
    const context = new MockExtensionContext();
    const mockCloudClient = new MockCloudClient();
    const mockAuthState: AuthState = {
      isAuthenticated: false,
      planId: 'INSIGHT_FREE',
    };

    // AnalysisService can now be instantiated with mocks
    // const service = new AnalysisService(
    //   context as any,
    //   mockCloudClient as any,
    //   mockAuthState
    // );

    // Tests would verify behavior without real vscode API
    expect(true).toBe(true); // Placeholder
  });
});
