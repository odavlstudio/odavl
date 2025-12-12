/**
 * @fileoverview Azure AD (Microsoft Entra ID) Connector
 * OAuth2 integration with Microsoft Graph API for user/group sync
 */

import { OAuthConfig, SSOIntegration } from './sso-integration';

export interface AzureADConfig extends OAuthConfig {
  tenantId: string;
  scopes?: string[];
}

export interface AzureUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
  groups?: string[];
}

export interface AzureGroup {
  id: string;
  displayName: string;
  description?: string;
  members?: string[];
}

export class AzureADConnector {
  private config: AzureADConfig;
  private static readonly GRAPH_API = 'https://graph.microsoft.com/v1.0';

  constructor(config: Partial<AzureADConfig>) {
    this.config = {
      ...config,
      authorizationUrl: `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize`,
      tokenUrl: `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
      userInfoUrl: `${AzureADConnector.GRAPH_API}/me`,
      scope: config.scopes || ['openid', 'profile', 'email', 'User.Read', 'Group.Read.All'],
      usePKCE: true,
    } as AzureADConfig;
  }

  /**
   * Get authorization URL for OAuth2 flow
   */
  getAuthorizationUrl(): { url: string; codeVerifier: string } {
    return SSOIntegration.initOAuth(this.config);
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCode(code: string, codeVerifier: string): Promise<string> {
    const tokens = await SSOIntegration.exchangeCodeForToken(code, this.config, codeVerifier);
    return tokens.accessToken;
  }

  /**
   * Get user profile from Microsoft Graph
   */
  async getUserProfile(accessToken: string): Promise<AzureUser> {
    const response = await fetch(`${AzureADConnector.GRAPH_API}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      displayName: data.displayName,
      mail: data.mail,
      userPrincipalName: data.userPrincipalName,
      jobTitle: data.jobTitle,
      department: data.department,
    };
  }

  /**
   * Get user's group memberships
   */
  async getUserGroups(accessToken: string): Promise<string[]> {
    const response = await fetch(`${AzureADConnector.GRAPH_API}/me/memberOf`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user groups: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value.map((group: { id: string }) => group.id);
  }

  /**
   * Sync user and groups from Azure AD
   */
  async syncUser(accessToken: string): Promise<AzureUser> {
    const [profile, groups] = await Promise.all([
      this.getUserProfile(accessToken),
      this.getUserGroups(accessToken),
    ]);

    return { ...profile, groups };
  }

  /**
   * Get all users (requires admin consent for User.Read.All)
   */
  async listUsers(accessToken: string, filter?: string): Promise<AzureUser[]> {
    const params = new URLSearchParams();
    if (filter) params.append('$filter', filter);

    const response = await fetch(`${AzureADConnector.GRAPH_API}/users?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to list users: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value.map((user: any) => ({
      id: user.id,
      displayName: user.displayName,
      mail: user.mail,
      userPrincipalName: user.userPrincipalName,
      jobTitle: user.jobTitle,
      department: user.department,
    }));
  }

  /**
   * Get group details
   */
  async getGroup(accessToken: string, groupId: string): Promise<AzureGroup> {
    const response = await fetch(`${AzureADConnector.GRAPH_API}/groups/${groupId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch group: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      displayName: data.displayName,
      description: data.description,
    };
  }

  /**
   * Get group members
   */
  async getGroupMembers(accessToken: string, groupId: string): Promise<string[]> {
    const response = await fetch(`${AzureADConnector.GRAPH_API}/groups/${groupId}/members`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch group members: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value.map((member: { id: string }) => member.id);
  }

  /**
   * Incremental sync using delta queries
   */
  async syncUsersDelta(accessToken: string, deltaLink?: string): Promise<{
    users: AzureUser[];
    deltaLink: string;
  }> {
    const url = deltaLink || `${AzureADConnector.GRAPH_API}/users/delta`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to sync users: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      users: data.value.map((user: any) => ({
        id: user.id,
        displayName: user.displayName,
        mail: user.mail,
        userPrincipalName: user.userPrincipalName,
        jobTitle: user.jobTitle,
        department: user.department,
      })),
      deltaLink: data['@odata.deltaLink'] || deltaLink || '',
    };
  }
}
