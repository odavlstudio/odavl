/**
 * Phase 2.2: Production-Grade HTTP Client
 * 
 * Features:
 * - Automatic auth injection (Bearer token)
 * - Retry logic with exponential backoff (429, 502, 503, 504)
 * - Timeout support
 * - Error normalization
 * - Debug logging mode
 * - Token refresh on 401
 * 
 * Security:
 * - All tokens via Authorization header (never in URL)
 * - HTTPS only for production
 * - Request/response sanitization in debug logs
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';

// Environment configuration
const API_BASE_URL = process.env.ODAVL_API_URL || 'https://api.odavl.com';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  debug?: boolean;
  onTokenRefresh?: (newToken: string) => Promise<void>;
}

/**
 * HTTP request options
 */
export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  requiresAuth?: boolean;
  skipRetry?: boolean;
}

/**
 * Normalized API error
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Network error (timeout, connection refused, etc.)
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Production-grade HTTP client with retry, auth, and error handling
 */
export class HttpClient {
  private config: Required<HttpClientConfig>;
  private tokenCache: string | null = null;

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || API_BASE_URL,
      timeout: config.timeout || DEFAULT_TIMEOUT,
      maxRetries: config.maxRetries || MAX_RETRIES,
      debug: config.debug ?? false,
      onTokenRefresh: config.onTokenRefresh || (async () => {}),
    };
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null): void {
    this.tokenCache = token;
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Core request method with retry logic
   */
  private async request<T>(endpoint: string, options: HttpRequestOptions): Promise<T> {
    const method = options.method || 'GET';
    const url = `${this.config.baseUrl}${endpoint}`;
    const timeout = options.timeout || this.config.timeout;
    const requiresAuth = options.requiresAuth ?? true;

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': `ODAVL-CLI/2.0 (${os.platform()}; ${os.arch()})`,
      ...options.headers,
    };

    // Add auth if required
    if (requiresAuth && this.tokenCache) {
      headers['Authorization'] = `Bearer ${this.tokenCache}`;
    }

    // Build request body
    const body = options.body !== undefined ? JSON.stringify(options.body) : undefined;

    // Log request (sanitized)
    if (this.config.debug) {
      this.debugLog('REQUEST', {
        method,
        url,
        headers: this.sanitizeHeaders(headers),
        bodySize: body?.length || 0,
      });
    }

    // Retry logic
    let lastError: Error | null = null;
    const maxAttempts = options.skipRetry ? 1 : this.config.maxRetries;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const response = await fetch(url, {
            method,
            headers,
            body,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // Log response
          if (this.config.debug) {
            const responseHeaders: Record<string, string> = {};
            response.headers.forEach((value, key) => {
              responseHeaders[key] = value;
            });
            this.debugLog('RESPONSE', {
              status: response.status,
              statusText: response.statusText,
              headers: this.sanitizeHeaders(responseHeaders),
            });
          }

          // Handle 401 Unauthorized (token refresh)
          if (response.status === 401 && requiresAuth && attempt === 0) {
            if (this.config.debug) {
              this.debugLog('AUTH', 'Token expired, attempting refresh...');
            }

            try {
              await this.handleTokenRefresh();
              // Retry with new token (recursion with attempt tracking)
              return this.request<T>(endpoint, { ...options, skipRetry: true });
            } catch (refreshError) {
              throw new ApiError(
                'Authentication failed. Please login again with: odavl auth login',
                401,
                'TOKEN_EXPIRED'
              );
            }
          }

          // Handle rate limiting (429)
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const backoffMs = retryAfter
              ? parseInt(retryAfter, 10) * 1000
              : this.calculateBackoff(attempt);

            if (attempt < maxAttempts - 1) {
              if (this.config.debug) {
                this.debugLog('RETRY', `Rate limited (429), retrying in ${backoffMs}ms...`);
              }
              await this.sleep(backoffMs);
              continue;
            }
          }

          // Handle server errors (502, 503, 504) with retry
          if ([502, 503, 504].includes(response.status)) {
            if (attempt < maxAttempts - 1) {
              const backoffMs = this.calculateBackoff(attempt);
              if (this.config.debug) {
                this.debugLog('RETRY', `Server error (${response.status}), retrying in ${backoffMs}ms...`);
              }
              await this.sleep(backoffMs);
              continue;
            }
          }

          // Parse response body
          const contentType = response.headers.get('Content-Type') || '';
          let data: any;

          if (contentType.includes('application/json')) {
            const text = await response.text();
            data = text ? JSON.parse(text) : null;
          } else {
            data = await response.text();
          }

          // Handle error responses
          if (!response.ok) {
            throw new ApiError(
              data?.message || `HTTP ${response.status}: ${response.statusText}`,
              response.status,
              data?.error,
              data
            );
          }

          return data as T;
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error: any) {
        lastError = error;

        // Don't retry on client errors (4xx except 429) or ApiErrors
        if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
          throw error;
        }

        // Handle network errors (timeout, connection refused, etc.)
        if (error.name === 'AbortError') {
          lastError = new NetworkError(`Request timeout after ${timeout}ms`, error);
        } else if (error.code === 'ECONNREFUSED') {
          lastError = new NetworkError('Connection refused. Is the API server running?', error);
        } else if (error.code === 'ENOTFOUND') {
          lastError = new NetworkError(`DNS lookup failed: ${this.config.baseUrl}`, error);
        }

        // Retry on network errors
        if (attempt < maxAttempts - 1 && !options.skipRetry) {
          const backoffMs = this.calculateBackoff(attempt);
          if (this.config.debug) {
            this.debugLog('RETRY', `Network error, retrying in ${backoffMs}ms... (${lastError.message})`);
          }
          await this.sleep(backoffMs);
          continue;
        }
      }
    }

    // All retries exhausted
    throw lastError || new NetworkError('Request failed after all retries');
  }

  /**
   * Handle token refresh
   */
  private async handleTokenRefresh(): Promise<void> {
    // Load stored token
    const credentialsPath = path.join(os.homedir(), '.odavl', 'credentials.enc');
    try {
      const { AuthStorage } = await import('./auth-storage.js');
      const authStorage = new AuthStorage();
      const token = await authStorage.loadToken();

      if (!token || !token.refreshToken) {
        throw new Error('No refresh token available');
      }

      // Request new token
      const response = await this.post<{ accessToken: string; refreshToken: string }>(
        '/api/cli/auth/refresh',
        { refreshToken: token.refreshToken },
        { requiresAuth: false, skipRetry: true }
      );

      // Update stored token
      const newToken = {
        ...token,
        token: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      };

      await authStorage.saveToken(newToken);
      this.setToken(response.accessToken);

      // Notify callback
      await this.config.onTokenRefresh(response.accessToken);
    } catch (error: any) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Calculate exponential backoff
   */
  private calculateBackoff(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, ...
    return Math.min(INITIAL_BACKOFF * Math.pow(2, attempt), 30000); // Max 30s
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Debug logging
   */
  private debugLog(category: string, data: any): void {
    if (!this.config.debug) return;

    console.log(chalk.gray(`[HTTP ${category}]`), typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  }

  /**
   * Sanitize headers for logging (remove sensitive data)
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };

    if (sanitized['Authorization']) {
      const auth = sanitized['Authorization'];
      if (auth.startsWith('Bearer ')) {
        const token = auth.substring(7);
        sanitized['Authorization'] = `Bearer ${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
      }
    }

    return sanitized;
  }
}

/**
 * Singleton HTTP client instance
 */
let clientInstance: HttpClient | null = null;

/**
 * Get or create HTTP client instance
 */
export function getHttpClient(config?: HttpClientConfig): HttpClient {
  if (!clientInstance || config) {
    clientInstance = new HttpClient(config);
  }
  return clientInstance;
}

/**
 * Reset HTTP client (for testing)
 */
export function resetHttpClient(): void {
  clientInstance = null;
}
