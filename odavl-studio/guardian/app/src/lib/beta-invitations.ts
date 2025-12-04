/**
 * Beta Invitation System
 * 
 * Week 13: Beta Testing & Feedback Loop
 * 
 * Manages beta user invitations, waitlist, and invitation codes.
 */

import { prisma } from './prisma';
import { randomBytes } from 'crypto';

export interface BetaInvitation {
    id: string;
    code: string;
    email: string;
    status: 'pending' | 'sent' | 'accepted' | 'expired';
    invitedBy?: string;
    acceptedAt?: Date;
    expiresAt: Date;
    createdAt: Date;
}

export interface WaitlistEntry {
    id: string;
    email: string;
    name?: string;
    company?: string;
    role?: string;
    useCase?: string;
    referralSource?: string;
    priority: number;
    status: 'waiting' | 'invited' | 'accepted';
    createdAt: Date;
}

/**
 * Generate unique invitation code
 */
export function generateInvitationCode(): string {
    const prefix = 'GUARDIAN';
    const random = randomBytes(6).toString('hex').toUpperCase();
    return `${prefix}-${random}`;
}

/**
 * Create beta invitation
 */
export async function createBetaInvitation(
    email: string,
    invitedBy?: string,
    expiresInDays: number = 7
): Promise<BetaInvitation> {
    const code = generateInvitationCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Store in database (placeholder - adjust to your schema)
    const invitation = {
        id: randomBytes(16).toString('hex'),
        code,
        email,
        status: 'pending' as const,
        invitedBy,
        expiresAt,
        createdAt: new Date(),
    };

    console.log('Beta invitation created:', invitation);

    return invitation;
}

/**
 * Validate invitation code
 */
export async function validateInvitationCode(code: string): Promise<{
    valid: boolean;
    invitation?: BetaInvitation;
    error?: string;
}> {
    // Placeholder validation - replace with database query
    const invitation = await getInvitationByCode(code);

    if (!invitation) {
        return { valid: false, error: 'Invalid invitation code' };
    }

    if (invitation.status === 'accepted') {
        return { valid: false, error: 'Invitation already used' };
    }

    if (invitation.status === 'expired' || invitation.expiresAt < new Date()) {
        return { valid: false, error: 'Invitation expired' };
    }

    return { valid: true, invitation };
}

/**
 * Accept invitation
 */
export async function acceptInvitation(code: string, userId: string): Promise<void> {
    const validation = await validateInvitationCode(code);

    if (!validation.valid) {
        throw new Error(validation.error);
    }

    // Update invitation status (placeholder)
    console.log(`Invitation ${code} accepted by user ${userId}`);
}

/**
 * Get invitation by code
 */
async function getInvitationByCode(code: string): Promise<BetaInvitation | null> {
    // Placeholder - replace with database query
    // return await prisma.betaInvitation.findUnique({ where: { code } });
    return null;
}

/**
 * Add user to waitlist
 */
export async function addToWaitlist(data: {
    email: string;
    name?: string;
    company?: string;
    role?: string;
    useCase?: string;
    referralSource?: string;
}): Promise<WaitlistEntry> {
    // Calculate priority score based on criteria
    let priority = 0;

    // Company email domain (not gmail/yahoo)
    if (data.email && !data.email.match(/@(gmail|yahoo|hotmail|outlook)\.com$/i)) {
        priority += 10;
    }

    // Has company
    if (data.company) {
        priority += 5;
    }

    // Detailed use case
    if (data.useCase && data.useCase.length > 100) {
        priority += 5;
    }

    // Professional role
    const professionalRoles = ['cto', 'engineering manager', 'lead', 'architect', 'director'];
    if (data.role && professionalRoles.some(r => data.role!.toLowerCase().includes(r))) {
        priority += 10;
    }

    // Referral
    if (data.referralSource && data.referralSource !== 'other') {
        priority += 5;
    }

    const entry: WaitlistEntry = {
        id: randomBytes(16).toString('hex'),
        email: data.email,
        name: data.name,
        company: data.company,
        role: data.role,
        useCase: data.useCase,
        referralSource: data.referralSource,
        priority,
        status: 'waiting',
        createdAt: new Date(),
    };

    console.log('Waitlist entry created:', entry);

    return entry;
}

/**
 * Get waitlist by priority
 */
export async function getWaitlistByPriority(limit: number = 50): Promise<WaitlistEntry[]> {
    // Placeholder - replace with database query
    // return await prisma.waitlistEntry.findMany({
    //   where: { status: 'waiting' },
    //   orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    //   take: limit,
    // });
    return [];
}

/**
 * Send batch invitations to top waitlist entries
 */
export async function sendBatchInvitations(count: number = 10): Promise<BetaInvitation[]> {
    const waitlist = await getWaitlistByPriority(count);
    const invitations: BetaInvitation[] = [];

    for (const entry of waitlist) {
        const invitation = await createBetaInvitation(entry.email);
        invitations.push(invitation);

        // Update waitlist status (placeholder)
        console.log(`Invitation sent to ${entry.email}`);
    }

    return invitations;
}

/**
 * Get invitation statistics
 */
export async function getInvitationStats(): Promise<{
    total: number;
    pending: number;
    sent: number;
    accepted: number;
    expired: number;
    acceptanceRate: number;
}> {
    // Placeholder - replace with database queries
    const stats = {
        total: 0,
        pending: 0,
        sent: 0,
        accepted: 0,
        expired: 0,
        acceptanceRate: 0,
    };

    if (stats.sent > 0) {
        stats.acceptanceRate = (stats.accepted / stats.sent) * 100;
    }

    return stats;
}

/**
 * Get waitlist statistics
 */
export async function getWaitlistStats(): Promise<{
    total: number;
    waiting: number;
    invited: number;
    accepted: number;
    averagePriority: number;
}> {
    // Placeholder - replace with database queries
    return {
        total: 0,
        waiting: 0,
        invited: 0,
        accepted: 0,
        averagePriority: 0,
    };
}
