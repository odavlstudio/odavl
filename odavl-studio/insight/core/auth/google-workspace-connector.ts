/**
 * @fileoverview Google Workspace Connector
 * OAuth2 integration with Google APIs for user/group sync
 */

import { OAuthConfig, SSOIntegration } from './sso-integration';

export interface GoogleWorkspaceConfig extends OAuthConfig {
  scopes?: string[];
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  photoUrl?: string;
  domain?: string;
  groups?: string[];
}

export interface GoogleGroup {
  id: string;
  email: string;
  name: string;
  description?: string;
  members?: string[];
}

export class GoogleWorkspaceConnector {
  private config: GoogleWorkspaceConfig;
  private static readonly ADMIN_API = 'https://admin.googleapis.com/admin/directory/v1';
  private static readonly OAUTH_API = 'https://www.googleapis.com/oauth2/v2';

  constructor(config: Partial<GoogleWorkspaceConfig>) {
    this.config = {
      ...config,
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: `${GoogleWorkspaceConnector.OAUTH_API}/userinfo`,
      scope: config.scopes || [
        'openid',
        'profile',
        'email',
        'https://www.googleapis.com/auth/admin.directory.user.readonly',
        'https://www.googleapis.com/auth/admin.directory.group.readonly',
      ],
      usePKCE: true,
    } as GoogleWorkspaceConfig;
  }

  /**
   * Get authorization URL with offline access
   */
  getAuthorizationUrl(): { url: string; codeVerifier: string } {
    const { url, codeVerifier } = SSOIntegration.initOAuth(this.config);
    // Add access_type=offline for refresh token
    return { url: `${url}&access_type=offline&prompt=consent`, codeVerifier };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string, codeVerifier: string): Promise<{
    accessToken: string;
    refreshToken?: string;
  }> {
    const tokens = await SSOIntegration.exchangeCodeForToken(code, this.config, codeVerifier);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Get user profile
   */
  async getUserProfile(accessToken: string): Promise<GoogleUser> {
    const response = await fetch(this.config.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      givenName: data.given_name,
      familyName: data.family_name,
      photoUrl: data.picture,
      domain: data.hd, // Hosted domain
    };
  }

  /**
   * Get user's group memberships
   */
  async getUserGroups(accessToken: string, userEmail: string): Promise<string[]> {
    const response = await fetch(`${GoogleWorkspaceConnector.ADMIN_API}/groups?userKey=${userEmail}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user groups: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.groups || []).map((group: { id: string }) => group.id);
  }

  /**
   * Sync user with groups
   */
  async syncUser(accessToken: string): Promise<GoogleUser> {
    const profile = await this.getUserProfile(accessToken);
    const groups = await this.getUserGroups(accessToken, profile.email);
    return { ...profile, groups };
  }

  /**
   * List all users in domain (requires admin)
   */
  async listUsers(accessToken: string, domain: string, query?: string): Promise<GoogleUser[]> {
    const params = new URLSearchParams({ domain });
    if (query) params.append('query', query);

    const response = await fetch(`${GoogleWorkspaceConnector.ADMIN_API}/users?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to list users: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.users || []).map((user: any) => ({
      id: user.id,
      email: user.primaryEmail,
      name: user.name.fullName,
      givenName: user.name.givenName,
      familyName: user.name.familyName,
    }));
  }

  /**
   * Get group details
   */
  async getGroup(accessToken: string, groupId: string): Promise<GoogleGroup> {
    const response = await fetch(`${GoogleWorkspaceConnector.ADMIN_API}/groups/${groupId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch group: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      description: data.description,
    };
  }

  /**
   * Get group members
   */
  async getGroupMembers(accessToken: string, groupId: string): Promise<string[]> {
    const response = await fetch(`${GoogleWorkspaceConnector.ADMIN_API}/groups/${groupId}/members`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch group members: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.members || []).map((member: { email: string }) => member.email);
  }

  /**
   * List all groups in domain
   */
  async listGroups(accessToken: string, domain: string): Promise<GoogleGroup[]> {
    const response = await fetch(`${GoogleWorkspaceConnector.ADMIN_API}/groups?domain=${domain}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to list groups: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.groups || []).map((group: any) => ({
      id: group.id,
      email: group.email,
      name: group.name,
      description: group.description,
    }));
  }
}
