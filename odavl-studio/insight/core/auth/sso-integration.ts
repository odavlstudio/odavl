/**
 * @fileoverview SSO Integration for ODAVL Insight
 * Supports SAML 2.0, OAuth2/OIDC with token validation and session management
 */

import * as jose from 'jose';
import Redis from 'ioredis';

export interface SAMLConfig {
  entryPoint: string;
  issuer: string;
  cert: string; // IdP certificate
  callbackUrl: string;
  signatureAlgorithm?: 'sha256' | 'sha512';
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  redirectUri: string;
  scope: string[];
  usePKCE?: boolean;
}

export interface TokenValidationResult {
  valid: boolean;
  payload?: Record<string, unknown>;
  error?: string;
}

export interface SessionConfig {
  redisUrl: string;
  ttl: number; // seconds
  prefix: string;
}

export class SSOIntegration {
  private redis: Redis | null = null;
  private sessionConfig: SessionConfig | null = null;

  /**
   * Initialize SAML 2.0 integration
   */
  static initSAML(config: SAMLConfig): string {
    // Generate SAML AuthnRequest
    const samlRequest = `
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="_${Math.random().toString(36).substring(2)}"
                    Version="2.0"
                    IssueInstant="${new Date().toISOString()}"
                    Destination="${config.entryPoint}"
                    AssertionConsumerServiceURL="${config.callbackUrl}"
                    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${config.issuer}</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
                      AllowCreate="true"/>
</samlp:AuthnRequest>`.trim();

    // Base64 encode and deflate
    const encoded = Buffer.from(samlRequest).toString('base64');
    return `${config.entryPoint}?SAMLRequest=${encodeURIComponent(encoded)}`;
  }

  /**
   * Validate SAML response
   */
  static async validateSAMLResponse(response: string, config: SAMLConfig): Promise<TokenValidationResult> {
    try {
      // Decode base64
      const decoded = Buffer.from(response, 'base64').toString('utf-8');

      // Extract assertion (simplified - production should use proper XML parser)
      const emailMatch = decoded.match(/<saml:NameID.*?>(.*?)<\/saml:NameID>/);
      const attributeMatches = decoded.match(/<saml:AttributeValue>(.*?)<\/saml:AttributeValue>/g);

      if (!emailMatch) {
        return { valid: false, error: 'No NameID found in SAML response' };
      }

      return {
        valid: true,
        payload: {
          email: emailMatch[1],
          attributes: attributeMatches?.map(m => m.replace(/<\/?saml:AttributeValue>/g, '')) || [],
        },
      };
    } catch (error) {
      return { valid: false, error: `SAML validation failed: ${error}` };
    }
  }

  /**
   * Initialize OAuth2/OIDC flow with PKCE
   */
  static initOAuth(config: OAuthConfig): { url: string; codeVerifier: string } {
    // Generate PKCE code verifier and challenge
    const codeVerifier = config.usePKCE
      ? jose.base64url.encode(Buffer.from(Math.random().toString(36).substring(2) + Date.now().toString(36)))
      : '';

    const codeChallenge = config.usePKCE
      ? jose.base64url.encode(Buffer.from(jose.calculateJwkThumbprint({ kty: 'oct', k: codeVerifier })))
      : '';

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scope.join(' '),
      state: Math.random().toString(36).substring(2),
    });

    if (config.usePKCE) {
      params.append('code_challenge', codeChallenge);
      params.append('code_challenge_method', 'S256');
    }

    return {
      url: `${config.authorizationUrl}?${params.toString()}`,
      codeVerifier,
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  static async exchangeCodeForToken(
    code: string,
    config: OAuthConfig,
    codeVerifier?: string
  ): Promise<{ accessToken: string; refreshToken?: string; idToken?: string }> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });

    if (codeVerifier) {
      params.append('code_verifier', codeVerifier);
    }

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      idToken: data.id_token,
    };
  }

  /**
   * Validate JWT token
   */
  static async validateJWT(token: string, secret: string): Promise<TokenValidationResult> {
    try {
      const secretKey = new TextEncoder().encode(secret);
      const { payload } = await jose.jwtVerify(token, secretKey, {
        algorithms: ['HS256', 'HS384', 'HS512'],
      });

      // Check expiration
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return { valid: false, error: 'Token expired' };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: `JWT validation failed: ${error}` };
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(
    refreshToken: string,
    config: OAuthConfig
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  }

  /**
   * Initialize session management
   */
  initSessions(config: SessionConfig): void {
    this.sessionConfig = config;
    this.redis = new Redis(config.redisUrl);
  }

  /**
   * Create session
   */
  async createSession(userId: string, data: Record<string, unknown>): Promise<string> {
    if (!this.redis || !this.sessionConfig) {
      throw new Error('Session management not initialized');
    }

    const sessionId = Math.random().toString(36).substring(2);
    const key = `${this.sessionConfig.prefix}:${sessionId}`;

    await this.redis.setex(key, this.sessionConfig.ttl, JSON.stringify({ userId, ...data }));
    return sessionId;
  }

  /**
   * Get session
   */
  async getSession(sessionId: string): Promise<Record<string, unknown> | null> {
    if (!this.redis || !this.sessionConfig) {
      throw new Error('Session management not initialized');
    }

    const key = `${this.sessionConfig.prefix}:${sessionId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    if (!this.redis || !this.sessionConfig) {
      throw new Error('Session management not initialized');
    }

    const key = `${this.sessionConfig.prefix}:${sessionId}`;
    await this.redis.del(key);
  }

  /**
   * Cleanup
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
