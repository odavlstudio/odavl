/**
 * ODAVL Studio API Client
 * 
 * Main client for interacting with ODAVL Studio API.
 * Handles authentication, rate limiting, retries, and error handling.
 */

import { InsightClient } from './insight';
// import { AutopilotClient } from './autopilot'; // TODO: Implement
// import { GuardianClient } from './guardian'; // TODO: Implement
import { ODAVLError, RateLimitError, UnauthorizedError } from './errors';

export interface ODAVLClientOptions {
  /**
   * API key for authentication (organization-level)
   */
  apiKey?: string;
  
  /**
   * JWT token for authentication (user-level)
   */
  token?: string;
  
  /**
   * Base URL for API (default: https://odavl.studio)
   */
  baseUrl?: string;
  
  /**
   * Request timeout in milliseconds (default: 30000)
   */
  timeout?: number;
  
  /**
   * Maximum number of retry attempts (default: 3)
   */
  maxRetries?: number;
  
  /**
   * Enable debug logging (default: false)
   */
  debug?: boolean;
}

export interface ODAVLConfig {
  apiKey?: string;
  token?: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  debug: boolean;
}

export class ODAVLClient {
  private config: ODAVLConfig;
  
  /**
   * Insight API client
   */
  public readonly insight: InsightClient;
  
  /**
   * Autopilot API client (TODO: Implement)
   */
  // public readonly autopilot: AutopilotClient;
  
  /**
   * Guardian API client (TODO: Implement)
   */
  // public readonly guardian: GuardianClient;
  
  constructor(options: ODAVLClientOptions = {}) {
    if (!options.apiKey && !options.token) {
      throw new Error('Either apiKey or token must be provided');
    }
    
    this.config = {
      apiKey: options.apiKey,
      token: options.token,
      baseUrl: options.baseUrl || 'https://odavl.studio',
      timeout: options.timeout || 30000,
      maxRetries: options.maxRetries || 3,
      debug: options.debug || false,
    };
    
    // Initialize sub-clients
    this.insight = new InsightClient(this);
    // this.autopilot = new AutopilotClient(this); // TODO: Implement
    // this.guardian = new GuardianClient(this); // TODO: Implement
  }
  
  /**
   * Make authenticated API request
   */
  async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const headers = new Headers(options.headers || {});
    
    // Add authentication
    if (this.config.apiKey) {
      headers.set('X-API-Key', this.config.apiKey);
    } else if (this.config.token) {
      headers.set('Authorization', `Bearer ${this.config.token}`);
    }
    
    // Add user agent
    headers.set('User-Agent', `odavl-sdk-js/${this.getVersion()}`);
    headers.set('Content-Type', 'application/json');
    
    let lastError: Error | null = null;
    
    // Retry logic with exponential backoff
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        if (this.config.debug) {
          console.log(`[ODAVL SDK] ${options.method || 'GET'} ${url} (attempt ${attempt + 1})`);
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
          throw new RateLimitError(
            'Rate limit exceeded',
            retryAfter,
            parseInt(response.headers.get('X-RateLimit-Limit') || '0', 10),
            parseInt(response.headers.get('X-RateLimit-Remaining') || '0', 10)
          );
        }
        
        // Handle authentication errors
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({}));
          throw new UnauthorizedError(errorData.error?.message || 'Not authenticated');
        }
        
        // Handle other errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new ODAVLError(
            errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorData.error?.code
          );
        }
        
        const data = await response.json();
        
        if (this.config.debug) {
          console.log(`[ODAVL SDK] Response:`, data);
        }
        
        return data as T;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on authentication errors
        if (error instanceof UnauthorizedError) {
          throw error;
        }
        
        // Don't retry on client errors (4xx except 429)
        if (error instanceof ODAVLError && error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < this.config.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          
          if (this.config.debug) {
            console.log(`[ODAVL SDK] Retrying after ${delay}ms...`);
          }
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries exhausted
    throw lastError || new Error('Request failed after all retries');
  }
  
  /**
   * Get SDK version
   */
  private getVersion(): string {
    // In production, this would read from package.json
    return '2.0.0';
  }
  
  /**
   * Get current configuration
   */
  getConfig(): Readonly<ODAVLConfig> {
    return { ...this.config };
  }
}
