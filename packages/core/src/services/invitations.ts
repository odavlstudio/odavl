/**
 * Enhanced Invitations Service
 * Handles team invitations, bulk invites, templates, and expiration logic
 * 
 * Features:
 * - Custom invitation messages
 * - Bulk invitations for enterprise
 * - Invitation templates
 * - Expiration and resend logic
 * - Tracking and analytics
 */

import crypto from 'node:crypto';

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export enum InvitationType {
  SINGLE = 'SINGLE',
  BULK = 'BULK',
  TEMPLATE = 'TEMPLATE',
}

export interface InvitationTemplate {
  id: string;
  name: string;
  subject: string;
  message: string;
  role: string;
  expiresInDays: number;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  status: InvitationStatus;
  type: InvitationType;
  
  // Custom message
  message?: string;
  subject?: string;
  
  // Token and expiration
  token: string;
  expiresAt: Date;
  
  // Tracking
  sentAt: Date;
  openedAt?: Date;
  respondedAt?: Date;
  
  // Metadata
  invitedBy: string;
  invitedByEmail: string;
  templateId?: string;
  bulkBatchId?: string;
  
  // Resend tracking
  resendCount: number;
  lastResendAt?: Date;
  
  // Response tracking
  declineReason?: string;
  acceptedUserId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkInvitationBatch {
  id: string;
  organizationId: string;
  name: string;
  role: string;
  message?: string;
  templateId?: string;
  
  // Invitations
  emails: string[];
  totalCount: number;
  sentCount: number;
  acceptedCount: number;
  declinedCount: number;
  pendingCount: number;
  
  // Status
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  failedEmails: string[];
  
  // Tracking
  createdBy: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  expired: number;
  revoked: number;
  
  // Metrics
  acceptanceRate: number;
  declineRate: number;
  expirationRate: number;
  avgResponseTimeHours: number;
  
  // Trends
  last7Days: number;
  last30Days: number;
}

export class InvitationsService {
  private static instance: InvitationsService;
  private invitations = new Map<string, Invitation>();
  private templates = new Map<string, InvitationTemplate>();
  private bulkBatches = new Map<string, BulkInvitationBatch>();
  
  private constructor() {
    // Initialize with default templates
    this.createDefaultTemplates();
  }
  
  public static getInstance(): InvitationsService {
    if (!InvitationsService.instance) {
      InvitationsService.instance = new InvitationsService();
    }
    return InvitationsService.instance;
  }
  
  /**
   * Create default invitation templates
   */
  private createDefaultTemplates(): void {
    const defaultTemplates: Omit<InvitationTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Developer Team Member',
        subject: 'Join our development team on ODAVL Studio',
        message: 'You have been invited to join our development team. ODAVL Studio helps improve code quality through AI-powered analysis.',
        role: 'MEMBER',
        expiresInDays: 7,
        organizationId: 'default',
        createdBy: 'system',
      },
      {
        name: 'External Contractor',
        subject: 'Contractor Access to ODAVL Studio',
        message: 'You have been granted temporary access as a contractor. This invitation expires in 3 days.',
        role: 'VIEWER',
        expiresInDays: 3,
        organizationId: 'default',
        createdBy: 'system',
      },
      {
        name: 'Team Admin',
        subject: 'Admin Access Invitation',
        message: 'You have been invited as an administrator. You will have full access to manage team members and settings.',
        role: 'ADMIN',
        expiresInDays: 14,
        organizationId: 'default',
        createdBy: 'system',
      },
      {
        name: 'Quick Join',
        subject: 'Quick invite to ODAVL Studio',
        message: 'Join our team on ODAVL Studio!',
        role: 'MEMBER',
        expiresInDays: 7,
        organizationId: 'default',
        createdBy: 'system',
      },
    ];
    
    defaultTemplates.forEach(template => {
      const id = `template_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      this.templates.set(id, {
        ...template,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  }
  
  /**
   * Create a single invitation
   */
  public async createInvitation(params: {
    organizationId: string;
    email: string;
    role: string;
    message?: string;
    subject?: string;
    expiresInDays?: number;
    invitedBy: string;
    invitedByEmail: string;
    templateId?: string;
  }): Promise<Invitation> {
    const id = `inv_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const token = crypto.randomBytes(32).toString('hex');
    
    let message = params.message;
    let subject = params.subject;
    let expiresInDays = params.expiresInDays ?? 7;
    
    // Apply template if provided
    if (params.templateId) {
      const template = this.templates.get(params.templateId);
      if (template) {
        message = template.message;
        subject = template.subject;
        expiresInDays = template.expiresInDays;
      }
    }
    
    const invitation: Invitation = {
      id,
      organizationId: params.organizationId,
      email: params.email,
      role: params.role,
      status: InvitationStatus.PENDING,
      type: InvitationType.SINGLE,
      message,
      subject,
      token,
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
      sentAt: new Date(),
      invitedBy: params.invitedBy,
      invitedByEmail: params.invitedByEmail,
      templateId: params.templateId,
      resendCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.invitations.set(id, invitation);
    return invitation;
  }
  
  /**
   * Create bulk invitations
   */
  public async createBulkInvitations(params: {
    organizationId: string;
    emails: string[];
    role: string;
    message?: string;
    subject?: string;
    templateId?: string;
    batchName: string;
    createdBy: string;
    createdByEmail: string;
  }): Promise<BulkInvitationBatch> {
    const batchId = `bulk_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    
    const batch: BulkInvitationBatch = {
      id: batchId,
      organizationId: params.organizationId,
      name: params.batchName,
      role: params.role,
      message: params.message,
      templateId: params.templateId,
      emails: params.emails,
      totalCount: params.emails.length,
      sentCount: 0,
      acceptedCount: 0,
      declinedCount: 0,
      pendingCount: params.emails.length,
      status: 'IN_PROGRESS',
      failedEmails: [],
      createdBy: params.createdBy,
      createdAt: new Date(),
      startedAt: new Date(),
    };
    
    this.bulkBatches.set(batchId, batch);
    
    // Create individual invitations
    const invitationPromises = params.emails.map(email =>
      this.createInvitation({
        organizationId: params.organizationId,
        email,
        role: params.role,
        message: params.message,
        subject: params.subject,
        invitedBy: params.createdBy,
        invitedByEmail: params.createdByEmail,
        templateId: params.templateId,
      }).then(inv => {
        // Update invitation with bulk batch ID
        inv.bulkBatchId = batchId;
        inv.type = InvitationType.BULK;
        this.invitations.set(inv.id, inv);
        batch.sentCount++;
        return inv;
      }).catch(() => {
        batch.failedEmails.push(email);
        return null;
      })
    );
    
    await Promise.allSettled(invitationPromises);
    
    batch.status = 'COMPLETED';
    batch.completedAt = new Date();
    this.bulkBatches.set(batchId, batch);
    
    return batch;
  }
  
  /**
   * Resend invitation
   */
  public async resendInvitation(invitationId: string): Promise<Invitation> {
    const invitation = this.invitations.get(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new Error('Can only resend pending invitations');
    }
    
    // Check if expired
    if (new Date() > invitation.expiresAt) {
      invitation.status = InvitationStatus.EXPIRED;
      this.invitations.set(invitationId, invitation);
      throw new Error('Invitation has expired');
    }
    
    // Update invitation
    invitation.resendCount++;
    invitation.lastResendAt = new Date();
    invitation.sentAt = new Date();
    invitation.updatedAt = new Date();
    
    this.invitations.set(invitationId, invitation);
    return invitation;
  }
  
  /**
   * Accept invitation
   */
  public async acceptInvitation(token: string, userId: string): Promise<Invitation> {
    const invitation = Array.from(this.invitations.values()).find(inv => inv.token === token);
    if (!invitation) {
      throw new Error('Invalid invitation token');
    }
    
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new Error('Invitation already processed');
    }
    
    // Check expiration
    if (new Date() > invitation.expiresAt) {
      invitation.status = InvitationStatus.EXPIRED;
      this.invitations.set(invitation.id, invitation);
      throw new Error('Invitation has expired');
    }
    
    invitation.status = InvitationStatus.ACCEPTED;
    invitation.acceptedUserId = userId;
    invitation.respondedAt = new Date();
    invitation.updatedAt = new Date();
    
    this.invitations.set(invitation.id, invitation);
    
    // Update bulk batch if applicable
    if (invitation.bulkBatchId) {
      const batch = this.bulkBatches.get(invitation.bulkBatchId);
      if (batch) {
        batch.acceptedCount++;
        batch.pendingCount--;
        this.bulkBatches.set(invitation.bulkBatchId, batch);
      }
    }
    
    return invitation;
  }
  
  /**
   * Decline invitation
   */
  public async declineInvitation(token: string, reason?: string): Promise<Invitation> {
    const invitation = Array.from(this.invitations.values()).find(inv => inv.token === token);
    if (!invitation) {
      throw new Error('Invalid invitation token');
    }
    
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new Error('Invitation already processed');
    }
    
    invitation.status = InvitationStatus.DECLINED;
    invitation.declineReason = reason;
    invitation.respondedAt = new Date();
    invitation.updatedAt = new Date();
    
    this.invitations.set(invitation.id, invitation);
    
    // Update bulk batch if applicable
    if (invitation.bulkBatchId) {
      const batch = this.bulkBatches.get(invitation.bulkBatchId);
      if (batch) {
        batch.declinedCount++;
        batch.pendingCount--;
        this.bulkBatches.set(invitation.bulkBatchId, batch);
      }
    }
    
    return invitation;
  }
  
  /**
   * Revoke invitation
   */
  public async revokeInvitation(invitationId: string): Promise<Invitation> {
    const invitation = this.invitations.get(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new Error('Can only revoke pending invitations');
    }
    
    invitation.status = InvitationStatus.REVOKED;
    invitation.updatedAt = new Date();
    
    this.invitations.set(invitationId, invitation);
    return invitation;
  }
  
  /**
   * Get invitation by token
   */
  public async getInvitationByToken(token: string): Promise<Invitation | null> {
    const invitation = Array.from(this.invitations.values()).find(inv => inv.token === token);
    return invitation || null;
  }
  
  /**
   * Get invitations for organization
   */
  public async getInvitationsByOrganization(
    organizationId: string,
    filters?: {
      status?: InvitationStatus;
      type?: InvitationType;
      limit?: number;
    }
  ): Promise<Invitation[]> {
    let invitations = Array.from(this.invitations.values())
      .filter(inv => inv.organizationId === organizationId);
    
    if (filters?.status) {
      invitations = invitations.filter(inv => inv.status === filters.status);
    }
    
    if (filters?.type) {
      invitations = invitations.filter(inv => inv.type === filters.type);
    }
    
    // Sort by creation date (newest first)
    invitations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (filters?.limit) {
      invitations = invitations.slice(0, filters.limit);
    }
    
    return invitations;
  }
  
  /**
   * Get invitation statistics
   */
  public async getInvitationStats(organizationId: string): Promise<InvitationStats> {
    const invitations = Array.from(this.invitations.values())
      .filter(inv => inv.organizationId === organizationId);
    
    const total = invitations.length;
    const pending = invitations.filter(inv => inv.status === InvitationStatus.PENDING).length;
    const accepted = invitations.filter(inv => inv.status === InvitationStatus.ACCEPTED).length;
    const declined = invitations.filter(inv => inv.status === InvitationStatus.DECLINED).length;
    const expired = invitations.filter(inv => inv.status === InvitationStatus.EXPIRED).length;
    const revoked = invitations.filter(inv => inv.status === InvitationStatus.REVOKED).length;
    
    // Calculate rates
    const acceptanceRate = total > 0 ? (accepted / total) * 100 : 0;
    const declineRate = total > 0 ? (declined / total) * 100 : 0;
    const expirationRate = total > 0 ? (expired / total) * 100 : 0;
    
    // Calculate average response time
    const respondedInvitations = invitations.filter(inv => inv.respondedAt);
    const avgResponseTimeHours = respondedInvitations.length > 0
      ? respondedInvitations.reduce((sum, inv) => {
          const responseTime = inv.respondedAt!.getTime() - inv.sentAt.getTime();
          return sum + responseTime / (1000 * 60 * 60);
        }, 0) / respondedInvitations.length
      : 0;
    
    // Trends
    const now = Date.now();
    const last7Days = invitations.filter(
      inv => now - inv.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000
    ).length;
    const last30Days = invitations.filter(
      inv => now - inv.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000
    ).length;
    
    return {
      total,
      pending,
      accepted,
      declined,
      expired,
      revoked,
      acceptanceRate,
      declineRate,
      expirationRate,
      avgResponseTimeHours,
      last7Days,
      last30Days,
    };
  }
  
  /**
   * Create invitation template
   */
  public async createTemplate(params: {
    name: string;
    subject: string;
    message: string;
    role: string;
    expiresInDays: number;
    organizationId: string;
    createdBy: string;
  }): Promise<InvitationTemplate> {
    const id = `template_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    
    const template: InvitationTemplate = {
      id,
      name: params.name,
      subject: params.subject,
      message: params.message,
      role: params.role,
      expiresInDays: params.expiresInDays,
      organizationId: params.organizationId,
      createdBy: params.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.templates.set(id, template);
    return template;
  }
  
  /**
   * Get templates for organization
   */
  public async getTemplates(organizationId: string): Promise<InvitationTemplate[]> {
    return Array.from(this.templates.values())
      .filter(template => template.organizationId === organizationId || template.organizationId === 'default')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  /**
   * Get bulk batch details
   */
  public async getBulkBatch(batchId: string): Promise<BulkInvitationBatch | null> {
    return this.bulkBatches.get(batchId) || null;
  }
  
  /**
   * Get bulk batches for organization
   */
  public async getBulkBatches(organizationId: string): Promise<BulkInvitationBatch[]> {
    return Array.from(this.bulkBatches.values())
      .filter(batch => batch.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  /**
   * Mark invitation as opened (email tracking)
   */
  public async markAsOpened(token: string): Promise<void> {
    const invitation = Array.from(this.invitations.values()).find(inv => inv.token === token);
    if (invitation && !invitation.openedAt) {
      invitation.openedAt = new Date();
      this.invitations.set(invitation.id, invitation);
    }
  }
  
  /**
   * Expire old invitations (cleanup job)
   */
  public async expireOldInvitations(): Promise<number> {
    const now = new Date();
    let expiredCount = 0;
    
    for (const [id, invitation] of this.invitations.entries()) {
      if (invitation.status === InvitationStatus.PENDING && now > invitation.expiresAt) {
        invitation.status = InvitationStatus.EXPIRED;
        invitation.updatedAt = now;
        this.invitations.set(id, invitation);
        expiredCount++;
        
        // Update bulk batch if applicable
        if (invitation.bulkBatchId) {
          const batch = this.bulkBatches.get(invitation.bulkBatchId);
          if (batch) {
            batch.pendingCount--;
            this.bulkBatches.set(invitation.bulkBatchId, batch);
          }
        }
      }
    }
    
    return expiredCount;
  }
}

// Export singleton instance
export const invitationsService = InvitationsService.getInstance();
