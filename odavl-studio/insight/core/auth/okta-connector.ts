/**
 * @fileoverview Okta Connector
 * OIDC integration with SCIM 2.0 provisioning
 */

import { OAuthConfig, SSOIntegration } from './sso-integration';

export interface OktaConfig extends OAuthConfig {
  domain: string; // e.g., 'dev-123456.okta.com'
  scopes?: string[];
  apiToken?: string; // For SCIM operations
}

export interface OktaUser {
  id: string;
  status: 'ACTIVE' | 'PROVISIONED' | 'DEPROVISIONED' | 'SUSPENDED';
  profile: {
    email: string;
    firstName: string;
    lastName: string;
    login: string;
    displayName?: string;
  };
  groups?: string[];
}

export interface OktaGroup {
  id: string;
  profile: {
    name: string;
    description?: string;
  };
  members?: string[];
}

export interface SCIMUser {
  schemas: string[];
  id?: string;
  userName: string;
  name: {
    givenName: string;
    familyName: string;
  };
  emails: Array<{ value: string; primary: boolean }>;
  active: boolean;
}

export class OktaConnector {
  private config: OktaConfig;
  private static readonly OKTA_API = '/api/v1';
  private static readonly SCIM_API = '/api/scim/v2';

  constructor(config: Partial<OktaConfig>) {
    const domain = config.domain || '';
    this.config = {
      ...config,
      domain,
      authorizationUrl: `https://${domain}/oauth2/v1/authorize`,
      tokenUrl: `https://${domain}/oauth2/v1/token`,
      userInfoUrl: `https://${domain}/oauth2/v1/userinfo`,
      scope: config.scopes || ['openid', 'profile', 'email', 'groups'],
      usePKCE: true,
    } as OktaConfig;
  }

  /**
   * Get authorization URL
   */
  getAuthorizationUrl(): { url: string; codeVerifier: string } {
    return SSOIntegration.initOAuth(this.config);
  }

  /**
   * Exchange code for tokens
   */
  async exchangeCode(code: string, codeVerifier: string): Promise<string> {
    const tokens = await SSOIntegration.exchangeCodeForToken(code, this.config, codeVerifier);
    return tokens.accessToken;
  }

  /**
   * Get user profile
   */
  async getUserProfile(accessToken: string): Promise<OktaUser> {
    const response = await fetch(this.config.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.sub,
      status: 'ACTIVE',
      profile: {
        email: data.email,
        firstName: data.given_name,
        lastName: data.family_name,
        login: data.preferred_username,
        displayName: data.name,
      },
      groups: data.groups,
    };
  }

  /**
   * List all users (requires API token)
   */
  async listUsers(filter?: string, limit = 200): Promise<OktaUser[]> {
    if (!this.config.apiToken) {
      throw new Error('API token required for user listing');
    }

    const params = new URLSearchParams({ limit: limit.toString() });
    if (filter) params.append('filter', filter);

    const response = await fetch(`https://${this.config.domain}${OktaConnector.OKTA_API}/users?${params.toString()}`, {
      headers: { Authorization: `SSWS ${this.config.apiToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to list users: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<OktaUser> {
    if (!this.config.apiToken) {
      throw new Error('API token required');
    }

    const response = await fetch(`https://${this.config.domain}${OktaConnector.OKTA_API}/users/${userId}`, {
      headers: { Authorization: `SSWS ${this.config.apiToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get user's groups
   */
  async getUserGroups(userId: string): Promise<OktaGroup[]> {
    if (!this.config.apiToken) {
      throw new Error('API token required');
    }

    const response = await fetch(`https://${this.config.domain}${OktaConnector.OKTA_API}/users/${userId}/groups`, {
      headers: { Authorization: `SSWS ${this.config.apiToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user groups: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * SCIM: Create user
   */
  async createUserSCIM(user: SCIMUser): Promise<SCIMUser> {
    if (!this.config.apiToken) {
      throw new Error('API token required');
    }

    const response = await fetch(`https://${this.config.domain}${OktaConnector.SCIM_API}/Users`, {
      method: 'POST',
      headers: {
        Authorization: `SSWS ${this.config.apiToken}`,
        'Content-Type': 'application/scim+json',
      },
      body: JSON.stringify({
        ...user,
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * SCIM: Update user
   */
  async updateUserSCIM(userId: string, updates: Partial<SCIMUser>): Promise<SCIMUser> {
    if (!this.config.apiToken) {
      throw new Error('API token required');
    }

    const response = await fetch(`https://${this.config.domain}${OktaConnector.SCIM_API}/Users/${userId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `SSWS ${this.config.apiToken}`,
        'Content-Type': 'application/scim+json',
      },
      body: JSON.stringify({
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
        Operations: Object.entries(updates).map(([key, value]) => ({
          op: 'replace',
          path: key,
          value,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update user: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * SCIM: Delete user (deprovision)
   */
  async deleteUserSCIM(userId: string): Promise<void> {
    if (!this.config.apiToken) {
      throw new Error('API token required');
    }

    const response = await fetch(`https://${this.config.domain}${OktaConnector.SCIM_API}/Users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `SSWS ${this.config.apiToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.statusText}`);
    }
  }

  /**
   * SCIM: Bulk operations
   */
  async bulkOperationsSCIM(operations: Array<{
    method: 'POST' | 'PATCH' | 'DELETE';
    path: string;
    data?: any;
  }>): Promise<any> {
    if (!this.config.apiToken) {
      throw new Error('API token required');
    }

    const response = await fetch(`https://${this.config.domain}${OktaConnector.SCIM_API}/Bulk`, {
      method: 'POST',
      headers: {
        Authorization: `SSWS ${this.config.apiToken}`,
        'Content-Type': 'application/scim+json',
      },
      body: JSON.stringify({
        schemas: ['urn:ietf:params:scim:api:messages:2.0:BulkRequest'],
        Operations: operations.map((op, idx) => ({
          bulkId: `bulk-${idx}`,
          method: op.method,
          path: op.path,
          data: op.data,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Bulk operation failed: ${response.statusText}`);
    }

    return response.json();
  }
}
