/**
 * Multi-Tenant Types
 */
interface Organization {
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
interface OrganizationMember {
    id: string;
    organizationId: string;
    userId: string;
    role: MemberRole;
    permissions?: Record<string, boolean>;
    status: MemberStatus;
    joinedAt: Date;
    updatedAt: Date;
}
interface OrganizationInvitation {
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
interface Project {
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
interface Webhook {
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
interface WebhookDelivery {
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
declare enum SubscriptionPlan {
    FREE = "FREE",
    STARTER = "STARTER",
    PROFESSIONAL = "PROFESSIONAL",
    ENTERPRISE = "ENTERPRISE"
}
declare enum PlanStatus {
    ACTIVE = "ACTIVE",
    PAST_DUE = "PAST_DUE",
    CANCELED = "CANCELED",
    TRIALING = "TRIALING"
}
declare enum MemberRole {
    OWNER = "OWNER",
    ADMIN = "ADMIN",
    MEMBER = "MEMBER",
    VIEWER = "VIEWER"
}
declare enum MemberStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    INVITED = "INVITED"
}
declare enum InvitationStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    EXPIRED = "EXPIRED",
    CANCELED = "CANCELED"
}
declare enum ProjectStatus {
    ACTIVE = "ACTIVE",
    ARCHIVED = "ARCHIVED",
    DELETED = "DELETED"
}
declare enum DeliveryStatus {
    PENDING = "PENDING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    RETRYING = "RETRYING"
}
declare const PLAN_LIMITS: Record<SubscriptionPlan, {
    maxMembers: number;
    maxProjects: number;
    maxApiCalls: number;
    maxStorage: number;
    features: string[];
}>;
declare const PERMISSIONS: {
    readonly 'org:update': "Update organization settings";
    readonly 'org:delete': "Delete organization";
    readonly 'org:billing': "Manage billing and subscriptions";
    readonly 'members:invite': "Invite new members";
    readonly 'members:remove': "Remove members";
    readonly 'members:update': "Update member roles";
    readonly 'projects:create': "Create new projects";
    readonly 'projects:read': "View projects";
    readonly 'projects:update': "Update projects";
    readonly 'projects:delete': "Delete projects";
    readonly 'apikeys:create': "Create API keys";
    readonly 'apikeys:read': "View API keys";
    readonly 'apikeys:revoke': "Revoke API keys";
    readonly 'webhooks:create': "Create webhooks";
    readonly 'webhooks:read': "View webhooks";
    readonly 'webhooks:update': "Update webhooks";
    readonly 'webhooks:delete': "Delete webhooks";
    readonly 'analytics:read': "View usage analytics";
};
declare const ROLE_PERMISSIONS: Record<MemberRole, (keyof typeof PERMISSIONS)[]>;
declare const WEBHOOK_EVENTS: {
    readonly 'insight.analysis.started': "Insight analysis started";
    readonly 'insight.analysis.completed': "Insight analysis completed";
    readonly 'insight.analysis.failed': "Insight analysis failed";
    readonly 'autopilot.run.started': "Autopilot run started";
    readonly 'autopilot.run.completed': "Autopilot run completed";
    readonly 'autopilot.run.failed': "Autopilot run failed";
    readonly 'autopilot.improvement.applied': "Autopilot improvement applied";
    readonly 'guardian.test.started': "Guardian test started";
    readonly 'guardian.test.completed': "Guardian test completed";
    readonly 'guardian.test.failed': "Guardian test failed";
    readonly 'guardian.gate.passed': "Quality gate passed";
    readonly 'guardian.gate.failed': "Quality gate failed";
    readonly 'org.member.joined': "Member joined organization";
    readonly 'org.member.left': "Member left organization";
    readonly 'org.member.role_changed': "Member role changed";
    readonly 'project.created': "Project created";
    readonly 'project.updated': "Project updated";
    readonly 'project.deleted': "Project deleted";
    readonly 'usage.limit.warning': "Usage limit warning (80%)";
    readonly 'usage.limit.exceeded': "Usage limit exceeded";
};

export { DeliveryStatus, InvitationStatus, MemberRole, MemberStatus, type Organization, type OrganizationInvitation, type OrganizationMember, PERMISSIONS, PLAN_LIMITS, PlanStatus, type Project, ProjectStatus, ROLE_PERMISSIONS, SubscriptionPlan, WEBHOOK_EVENTS, type Webhook, type WebhookDelivery };
