/**
 * Invitation Model - Organization/team invitations
 */

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

export interface Invitation {
  id: string;
  organizationId: string;
  teamId?: string;
  email: string;
  invitedBy: string;
  role: string;
  status: InvitationStatus;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export class InvitationManager {
  private invitations: Map<string, Invitation> = new Map();

  createInvitation(params: Omit<Invitation, 'id' | 'createdAt' | 'token' | 'status'>): Invitation {
    const invitation: Invitation = {
      id: crypto.randomUUID(),
      token: crypto.randomUUID(),
      status: InvitationStatus.PENDING,
      createdAt: new Date(),
      ...params,
    };
    this.invitations.set(invitation.id, invitation);
    return invitation;
  }

  getInvitationByToken(token: string): Invitation | undefined {
    return Array.from(this.invitations.values()).find((i) => i.token === token);
  }

  acceptInvitation(token: string): Invitation | null {
    const invitation = this.getInvitationByToken(token);
    if (!invitation || invitation.status !== InvitationStatus.PENDING) return null;
    if (invitation.expiresAt < new Date()) {
      invitation.status = InvitationStatus.EXPIRED;
      return null;
    }
    invitation.status = InvitationStatus.ACCEPTED;
    return invitation;
  }

  declineInvitation(token: string): boolean {
    const invitation = this.getInvitationByToken(token);
    if (!invitation) return false;
    invitation.status = InvitationStatus.DECLINED;
    return true;
  }

  listInvitations(organizationId: string): Invitation[] {
    return Array.from(this.invitations.values()).filter((i) => i.organizationId === organizationId);
  }
}
