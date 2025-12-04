/**
 * Invitation Service
 */

import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import type {
  OrganizationInvitation,
  MemberRole,
  InvitationStatus,
} from '@odavl/types/multi-tenant';

export class InvitationService {
  /**
   * Create invitation
   */
  async createInvitation(data: {
    organizationId: string;
    email: string;
    role: MemberRole;
    invitedById: string;
    expiresInDays?: number;
  }): Promise<OrganizationInvitation> {
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7));

    const invitation = await prisma.organizationInvitation.create({
      data: {
        organizationId: data.organizationId,
        email: data.email,
        role: data.role,
        token,
        invitedById: data.invitedById,
        expiresAt,
        status: 'PENDING',
      },
      include: {
        organization: {
          select: {
            name: true,
            slug: true,
          },
        },
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return invitation as any;
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(
    token: string
  ): Promise<OrganizationInvitation | null> {
    const invitation = await prisma.organizationInvitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            name: true,
            slug: true,
          },
        },
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return invitation as any;
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(
    token: string,
    userId: string
  ): Promise<OrganizationInvitation> {
    const invitation = await this.getInvitationByToken(token);

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new Error('Invitation already processed');
    }

    if (new Date() > invitation.expiresAt) {
      await this.updateInvitationStatus(invitation.id, 'EXPIRED');
      throw new Error('Invitation expired');
    }

    // Add user to organization
    const { OrganizationService } = await import('./organization');
    const orgService = new OrganizationService();
    await orgService.addMember(invitation.organizationId, userId, invitation.role);

    // Update invitation
    const updated = await prisma.organizationInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        acceptedById: userId,
      },
    });

    return updated as any;
  }

  /**
   * Cancel invitation
   */
  async cancelInvitation(id: string): Promise<void> {
    await this.updateInvitationStatus(id, 'CANCELED');
  }

  /**
   * Resend invitation
   */
  async resendInvitation(id: string): Promise<OrganizationInvitation> {
    const invitation = await prisma.organizationInvitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new Error('Can only resend pending invitations');
    }

    // Extend expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const updated = await prisma.organizationInvitation.update({
      where: { id },
      data: {
        token: this.generateToken(), // Generate new token
        expiresAt,
      },
      include: {
        organization: {
          select: {
            name: true,
            slug: true,
          },
        },
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return updated as any;
  }

  /**
   * Get organization invitations
   */
  async getOrganizationInvitations(
    organizationId: string,
    status?: InvitationStatus
  ): Promise<OrganizationInvitation[]> {
    const invitations = await prisma.organizationInvitation.findMany({
      where: {
        organizationId,
        ...(status ? { status } : {}),
      },
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invitations as any;
  }

  /**
   * Get user pending invitations
   */
  async getUserPendingInvitations(
    email: string
  ): Promise<OrganizationInvitation[]> {
    const invitations = await prisma.organizationInvitation.findMany({
      where: {
        email,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        organization: {
          select: {
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invitations as any;
  }

  /**
   * Cleanup expired invitations
   */
  async cleanupExpiredInvitations(): Promise<number> {
    const result = await prisma.organizationInvitation.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return result.count;
  }

  /**
   * Update invitation status
   */
  private async updateInvitationStatus(
    id: string,
    status: InvitationStatus
  ): Promise<void> {
    await prisma.organizationInvitation.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Generate secure token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }
}

export const invitationService = new InvitationService();
