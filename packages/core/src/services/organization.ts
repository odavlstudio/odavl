/**
 * Organization Service
 */

import { prisma } from '@/lib/prisma';
import type {
  Organization,
  OrganizationMember,
  MemberRole,
  SubscriptionPlan,
  PlanStatus,
} from '@odavl/types/multi-tenant';
import { PLAN_LIMITS } from '@odavl/types/multi-tenant';

export class OrganizationService {
  /**
   * Create new organization
   */
  async createOrganization(data: {
    name: string;
    slug: string;
    description?: string;
    ownerId: string;
    plan?: SubscriptionPlan;
  }): Promise<Organization> {
    const plan = data.plan || 'FREE';
    const limits = PLAN_LIMITS[plan];

    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        plan,
        planStatus: 'ACTIVE',
        maxMembers: limits.maxMembers,
        maxProjects: limits.maxProjects,
        maxApiCalls: limits.maxApiCalls,
        maxStorage: BigInt(limits.maxStorage),
        members: {
          create: {
            userId: data.ownerId,
            role: 'OWNER',
            status: 'ACTIVE',
          },
        },
      },
      include: {
        members: true,
      },
    });

    return organization as any;
  }

  /**
   * Get organization by ID
   */
  async getOrganization(id: string): Promise<Organization | null> {
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        projects: {
          where: {
            status: 'ACTIVE',
          },
        },
      },
    });

    return organization as any;
  }

  /**
   * Get organization by slug
   */
  async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    const organization = await prisma.organization.findUnique({
      where: { slug },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return organization as any;
  }

  /**
   * Update organization
   */
  async updateOrganization(
    id: string,
    data: {
      name?: string;
      description?: string;
      logoUrl?: string;
      websiteUrl?: string;
      settings?: Record<string, any>;
    }
  ): Promise<Organization> {
    const organization = await prisma.organization.update({
      where: { id },
      data,
    });

    return organization as any;
  }

  /**
   * Delete organization
   */
  async deleteOrganization(id: string): Promise<void> {
    await prisma.organization.delete({
      where: { id },
    });
  }

  /**
   * Get user organizations
   */
  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const memberships = await prisma.organizationMember.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                members: true,
                projects: true,
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => m.organization) as any;
  }

  /**
   * Check if user is member
   */
  async isMember(organizationId: string, userId: string): Promise<boolean> {
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    return !!member && member.status === 'ACTIVE';
  }

  /**
   * Get member role
   */
  async getMemberRole(
    organizationId: string,
    userId: string
  ): Promise<MemberRole | null> {
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    return member?.role || null;
  }

  /**
   * Check if user has permission
   */
  async hasPermission(
    organizationId: string,
    userId: string,
    permission: string
  ): Promise<boolean> {
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!member || member.status !== 'ACTIVE') {
      return false;
    }

    // Check custom permissions first
    if (member.permissions && typeof member.permissions === 'object') {
      const customPerms = member.permissions as Record<string, boolean>;
      if (permission in customPerms) {
        return customPerms[permission];
      }
    }

    // Check role-based permissions
    const { ROLE_PERMISSIONS } = await import('@odavl/types/multi-tenant');
    const rolePermissions = ROLE_PERMISSIONS[member.role];
    return rolePermissions.includes(permission as any);
  }

  /**
   * Add member to organization
   */
  async addMember(
    organizationId: string,
    userId: string,
    role: MemberRole = 'MEMBER'
  ): Promise<OrganizationMember> {
    const member = await prisma.organizationMember.create({
      data: {
        organizationId,
        userId,
        role,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return member as any;
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    organizationId: string,
    userId: string,
    role: MemberRole
  ): Promise<OrganizationMember> {
    const member = await prisma.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      data: { role },
    });

    return member as any;
  }

  /**
   * Remove member from organization
   */
  async removeMember(organizationId: string, userId: string): Promise<void> {
    await prisma.organizationMember.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
  }

  /**
   * Get organization members
   */
  async getMembers(organizationId: string): Promise<OrganizationMember[]> {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // OWNER first
        { joinedAt: 'asc' },
      ],
    });

    return members as any;
  }

  /**
   * Check usage limits
   */
  async checkUsageLimits(organizationId: string): Promise<{
    members: { current: number; limit: number; exceeded: boolean };
    projects: { current: number; limit: number; exceeded: boolean };
    apiCalls: { current: number; limit: number; exceeded: boolean };
    storage: { current: bigint; limit: bigint; exceeded: boolean };
  }> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            members: true,
            projects: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Get current month API calls
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const apiCallsCount = await prisma.usageRecord.count({
      where: {
        organizationId,
        timestamp: {
          gte: startOfMonth,
        },
      },
    });

    // Calculate storage usage
    // TODO: Implement actual storage calculation
    const storageUsed = BigInt(0);

    const limits = {
      members: {
        current: organization._count.members,
        limit: organization.maxMembers,
        exceeded:
          organization.maxMembers !== -1 &&
          organization._count.members >= organization.maxMembers,
      },
      projects: {
        current: organization._count.projects,
        limit: organization.maxProjects,
        exceeded:
          organization.maxProjects !== -1 &&
          organization._count.projects >= organization.maxProjects,
      },
      apiCalls: {
        current: apiCallsCount,
        limit: organization.maxApiCalls,
        exceeded:
          organization.maxApiCalls !== -1 &&
          apiCallsCount >= organization.maxApiCalls,
      },
      storage: {
        current: storageUsed,
        limit: organization.maxStorage,
        exceeded:
          organization.maxStorage !== BigInt(-1) &&
          storageUsed >= organization.maxStorage,
      },
    };

    return limits;
  }

  /**
   * Update subscription plan
   */
  async updateSubscriptionPlan(
    organizationId: string,
    plan: SubscriptionPlan,
    stripeSubscriptionId?: string
  ): Promise<Organization> {
    const limits = PLAN_LIMITS[plan];

    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        plan,
        planStatus: 'ACTIVE',
        maxMembers: limits.maxMembers,
        maxProjects: limits.maxProjects,
        maxApiCalls: limits.maxApiCalls,
        maxStorage: BigInt(limits.maxStorage),
        stripeSubscriptionId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return organization as any;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(organizationId: string): Promise<Organization> {
    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        planStatus: 'CANCELED',
      },
    });

    return organization as any;
  }
}

export const organizationService = new OrganizationService();
