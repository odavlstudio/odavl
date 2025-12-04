/**
 * Multi-Tenant Types
 */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  plan: SubscriptionPlan;
  planStatus: PlanStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  maxMembers: number;
  maxProjects: number;
  maxApiCalls: number;
  maxStorage: bigint;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: MemberRole;
  permissions?: Record<string, boolean>;
  status: MemberStatus;
  joinedAt: Date;
  updatedAt: Date;
}

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: MemberRole;
  token: string;
  status: InvitationStatus;
  invitedById: string;
  acceptedAt?: Date;
  acceptedById?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  settings?: Record<string, any>;
  workspacePath?: string;
  lastSyncAt?: Date;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Webhook {
  id: string;
  organizationId: string;
  url: string;
  events: string[];
  secret: string;
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  lastCalledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, any>;
  statusCode?: number;
  responseBody?: string;
  responseTime?: number;
  status: DeliveryStatus;
  attempts: number;
  nextRetryAt?: Date;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum PlanStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  TRIALING = 'TRIALING',
}

export enum MemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INVITED = 'INVITED',
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

// Plan limits configuration
export const PLAN_LIMITS: Record<SubscriptionPlan, {
  maxMembers: number;
  maxProjects: number;
  maxApiCalls: number;
  maxStorage: number; // bytes
  features: string[];
}> = {
  [SubscriptionPlan.FREE]: {
    maxMembers: 1,
    maxProjects: 3,
    maxApiCalls: 1000,
    maxStorage: 1 * 1024 * 1024 * 1024, // 1GB
    features: ['basic_analysis', 'local_storage'],
  },
  [SubscriptionPlan.STARTER]: {
    maxMembers: 5,
    maxProjects: 20,
    maxApiCalls: 50000,
    maxStorage: 10 * 1024 * 1024 * 1024, // 10GB
    features: ['basic_analysis', 'cloud_storage', 'email_notifications', 'priority_support'],
  },
  [SubscriptionPlan.PROFESSIONAL]: {
    maxMembers: 25,
    maxProjects: 100,
    maxApiCalls: 500000,
    maxStorage: 100 * 1024 * 1024 * 1024, // 100GB
    features: ['advanced_analysis', 'cloud_storage', 'email_notifications', 'webhooks', 'sso', 'priority_support', 'custom_branding'],
  },
  [SubscriptionPlan.ENTERPRISE]: {
    maxMembers: -1, // unlimited
    maxProjects: -1, // unlimited
    maxApiCalls: -1, // unlimited
    maxStorage: -1, // unlimited
    features: ['all_features', 'dedicated_support', 'sla', 'on_premise'],
  },
};

// Permission definitions
export const PERMISSIONS = {
  // Organization management
  'org:update': 'Update organization settings',
  'org:delete': 'Delete organization',
  'org:billing': 'Manage billing and subscriptions',
  
  // Member management
  'members:invite': 'Invite new members',
  'members:remove': 'Remove members',
  'members:update': 'Update member roles',
  
  // Project management
  'projects:create': 'Create new projects',
  'projects:read': 'View projects',
  'projects:update': 'Update projects',
  'projects:delete': 'Delete projects',
  
  // API keys
  'apikeys:create': 'Create API keys',
  'apikeys:read': 'View API keys',
  'apikeys:revoke': 'Revoke API keys',
  
  // Webhooks
  'webhooks:create': 'Create webhooks',
  'webhooks:read': 'View webhooks',
  'webhooks:update': 'Update webhooks',
  'webhooks:delete': 'Delete webhooks',
  
  // Usage analytics
  'analytics:read': 'View usage analytics',
} as const;

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<MemberRole, (keyof typeof PERMISSIONS)[]> = {
  [MemberRole.OWNER]: Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[],
  
  [MemberRole.ADMIN]: [
    'org:update',
    'members:invite',
    'members:remove',
    'members:update',
    'projects:create',
    'projects:read',
    'projects:update',
    'projects:delete',
    'apikeys:create',
    'apikeys:read',
    'apikeys:revoke',
    'webhooks:create',
    'webhooks:read',
    'webhooks:update',
    'webhooks:delete',
    'analytics:read',
  ],
  
  [MemberRole.MEMBER]: [
    'projects:create',
    'projects:read',
    'projects:update',
    'apikeys:create',
    'apikeys:read',
    'webhooks:read',
    'analytics:read',
  ],
  
  [MemberRole.VIEWER]: [
    'projects:read',
    'apikeys:read',
    'webhooks:read',
    'analytics:read',
  ],
};

// Webhook events
export const WEBHOOK_EVENTS = {
  // Insight events
  'insight.analysis.started': 'Insight analysis started',
  'insight.analysis.completed': 'Insight analysis completed',
  'insight.analysis.failed': 'Insight analysis failed',
  
  // Autopilot events
  'autopilot.run.started': 'Autopilot run started',
  'autopilot.run.completed': 'Autopilot run completed',
  'autopilot.run.failed': 'Autopilot run failed',
  'autopilot.improvement.applied': 'Autopilot improvement applied',
  
  // Guardian events
  'guardian.test.started': 'Guardian test started',
  'guardian.test.completed': 'Guardian test completed',
  'guardian.test.failed': 'Guardian test failed',
  'guardian.gate.passed': 'Quality gate passed',
  'guardian.gate.failed': 'Quality gate failed',
  
  // Organization events
  'org.member.joined': 'Member joined organization',
  'org.member.left': 'Member left organization',
  'org.member.role_changed': 'Member role changed',
  
  // Project events
  'project.created': 'Project created',
  'project.updated': 'Project updated',
  'project.deleted': 'Project deleted',
  
  // Usage events
  'usage.limit.warning': 'Usage limit warning (80%)',
  'usage.limit.exceeded': 'Usage limit exceeded',
} as const;
