/**
 * Authentication Manager - Handle login, logout, token refresh
 */

import axios, { AxiosInstance } from 'axios';
import { CredentialStore, StoredCredentials } from './credentials';
import { AuthenticationError } from './errors';
import type { DeviceAuthResponse, TokenResponse, ApiKey } from './types';

export class AuthManager {
  private credentialStore: CredentialStore;
  private baseUrl: string;
  private httpClient: AxiosInstance;

  constructor(baseUrl: string = 'https://api.odavl.io') {
    this.baseUrl = baseUrl;
    this.credentialStore = new CredentialStore();
    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
    });
  }

  /**
   * Login via API Key
   */
  async loginWithApiKey(apiKey: string): Promise<void> {
    try {
      // Validate API key with server
      const response = await this.httpClient.post('/auth/validate', {
        apiKey,
      });

      if (!response.data.success) {
        throw new AuthenticationError('Invalid API key');
      }

      // Save credentials
      await this.credentialStore.save({
        apiKey,
        orgId: response.data.data.orgId,
        userId: response.data.data.userId,
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new AuthenticationError('Invalid API key');
      }
      throw error;
    }
  }

  /**
   * Login via Device Authorization Flow (OAuth)
   * 
   * Steps:
   * 1. Request device code
   * 2. Show user code to user
   * 3. Poll for authorization
   * 4. Save tokens
   */
  async loginWithDeviceFlow(): Promise<{
    userCode: string;
    verificationUri: string;
    expiresIn: number;
  }> {
    // Step 1: Request device code
    const deviceResponse = await this.httpClient.post<DeviceAuthResponse>(
      '/auth/device/code'
    );

    const {
      device_code,
      user_code,
      verification_uri,
      verification_uri_complete,
      expires_in,
      interval,
    } = deviceResponse.data;

    // Step 2: Return user code for display
    // CLI will show this to user and ask them to visit URL

    // Step 3: Start polling (in background)
    this.pollForDeviceAuthorization(device_code, interval, expires_in);

    return {
      userCode: user_code,
      verificationUri: verification_uri_complete || verification_uri,
      expiresIn: expires_in,
    };
  }

  /**
   * Poll for device authorization
   */
  private async pollForDeviceAuthorization(
    deviceCode: string,
    interval: number,
    expiresIn: number
  ): Promise<void> {
    const startTime = Date.now();
    const expiryTime = startTime + expiresIn * 1000;

    while (Date.now() < expiryTime) {
      try {
        const response = await this.httpClient.post<TokenResponse>(
          '/auth/device/token',
          { device_code: deviceCode }
        );

        // Success! Save tokens
        const { access_token, refresh_token, expires_in } = response.data;

        await this.credentialStore.save({
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: Date.now() + expires_in * 1000,
        });

        return;
      } catch (error: any) {
        if (error.response?.data?.error === 'authorization_pending') {
          // Not authorized yet, wait and retry
          await new Promise((resolve) => setTimeout(resolve, interval * 1000));
          continue;
        }

        if (error.response?.data?.error === 'slow_down') {
          // Increase interval
          interval += 5;
          await new Promise((resolve) => setTimeout(resolve, interval * 1000));
          continue;
        }

        // Other error, stop polling
        throw error;
      }
    }

    throw new AuthenticationError('Device authorization expired');
  }

  /**
   * Logout (clear credentials)
   */
  async logout(): Promise<void> {
    await this.credentialStore.clear();
  }

  /**
   * Check if user is logged in
   */
  async isAuthenticated(): Promise<boolean> {
    const apiKey = await this.credentialStore.getApiKey();
    const accessToken = await this.credentialStore.getAccessToken();
    
    return !!(apiKey || accessToken);
  }

  /**
   * Get current auth headers
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const apiKey = await this.credentialStore.getApiKey();
    if (apiKey) {
      return {
        'Authorization': `Bearer ${apiKey}`,
      };
    }

    const accessToken = await this.credentialStore.getAccessToken();
    if (accessToken) {
      return {
        'Authorization': `Bearer ${accessToken}`,
      };
    }

    throw new AuthenticationError('Not authenticated. Run: odavl login');
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<void> {
    const credentials = await this.credentialStore.load();
    
    if (!credentials?.refreshToken) {
      throw new AuthenticationError('No refresh token available');
    }

    try {
      const response = await this.httpClient.post<TokenResponse>(
        '/auth/refresh',
        { refresh_token: credentials.refreshToken }
      );

      const { access_token, refresh_token, expires_in } = response.data;

      await this.credentialStore.save({
        ...credentials,
        accessToken: access_token,
        refreshToken: refresh_token || credentials.refreshToken,
        expiresAt: Date.now() + expires_in * 1000,
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Refresh token expired, need to login again
        await this.credentialStore.clear();
        throw new AuthenticationError(
          'Session expired. Please login again: odavl login'
        );
      }
      throw error;
    }
  }
}
