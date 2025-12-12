/**
 * Onboarding API Service
 * 
 * Handles onboarding flow integration with backend APIs
 */

export interface SignupPayload {
  email: string;
  password: string;
}

export interface SignupResponse {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

export interface CreateOrganizationPayload {
  name: string;
  userId: string;
}

export interface CreateOrganizationResponse {
  orgId: string;
  name: string;
}

export interface CreateProjectPayload {
  name: string;
  repository?: string;
  orgId: string;
}

export interface CreateProjectResponse {
  projectId: string;
  name: string;
}

export interface SendInvitesPayload {
  emails: string[];
  orgId: string;
  role: 'admin' | 'member' | 'viewer';
}

export interface SendInvitesResponse {
  sentCount: number;
  failedEmails: string[];
}

/**
 * Onboarding API Client
 */
export class OnboardingAPI {
  private baseUrl: string;
  private accessToken?: string;

  constructor(baseUrl: string = 'http://localhost:8080/api/v1') {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Step 1: User signup
   */
  async signup(payload: SignupPayload): Promise<SignupResponse> {
    const response = await this.request<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Store access token for subsequent requests
    this.setAccessToken(response.accessToken);

    return response;
  }

  /**
   * Step 2: Create organization
   */
  async createOrganization(
    payload: CreateOrganizationPayload
  ): Promise<CreateOrganizationResponse> {
    return this.request<CreateOrganizationResponse>('/organizations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Step 3: Create project
   */
  async createProject(
    payload: CreateProjectPayload
  ): Promise<CreateProjectResponse> {
    return this.request<CreateProjectResponse>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Step 4: Send team invites
   */
  async sendInvites(
    payload: SendInvitesPayload
  ): Promise<SendInvitesResponse> {
    return this.request<SendInvitesResponse>('/invitations/bulk', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Trigger first scan (optional)
   */
  async triggerFirstScan(projectId: string): Promise<{ runId: string }> {
    return this.request<{ runId: string }>('/insight/run', {
      method: 'POST',
      body: JSON.stringify({ projectId, detectors: ['typescript', 'security'] }),
    });
  }
}

/**
 * Complete onboarding flow
 */
export async function completeOnboarding(
  api: OnboardingAPI,
  data: {
    email: string;
    password: string;
    organizationName: string;
    projectName: string;
    projectRepo?: string;
    invites?: string[];
  }
): Promise<{
  userId: string;
  orgId: string;
  projectId: string;
  invitesSent: number;
}> {
  // Step 1: Signup
  const signupResponse = await api.signup({
    email: data.email,
    password: data.password,
  });

  // Step 2: Create organization
  const orgResponse = await api.createOrganization({
    name: data.organizationName,
    userId: signupResponse.userId,
  });

  // Step 3: Create project
  const projectResponse = await api.createProject({
    name: data.projectName,
    repository: data.projectRepo,
    orgId: orgResponse.orgId,
  });

  // Step 4: Send invites (if any)
  let invitesSent = 0;
  if (data.invites && data.invites.length > 0) {
    const invitesResponse = await api.sendInvites({
      emails: data.invites,
      orgId: orgResponse.orgId,
      role: 'member',
    });
    invitesSent = invitesResponse.sentCount;
  }

  return {
    userId: signupResponse.userId,
    orgId: orgResponse.orgId,
    projectId: projectResponse.projectId,
    invitesSent,
  };
}

export default OnboardingAPI;
