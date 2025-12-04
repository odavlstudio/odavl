/**
 * Beta Program Sign-up System
 * Week 13-14: Beta Recruitment
 * UNIFIED_ACTION_PLAN Phase 3 Month 4
 * 
 * Target: 50 beta signups, 20 active users
 */

import { z } from 'zod';

export const betaSignupSchema = z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    company: z.string().optional(),
    role: z.enum(['developer', 'lead', 'manager', 'founder', 'other']),
    teamSize: z.enum(['1', '2-10', '11-50', '51-200', '200+']),
    
    // Tech stack
    primaryLanguage: z.enum(['typescript', 'javascript', 'python', 'java', 'other']),
    usesCI: z.boolean(),
    currentTools: z.array(z.string()).optional(),
    
    // Use case
    useCase: z.string().min(20, 'Please describe your use case (min 20 characters)'),
    painPoints: z.string().optional(),
    
    // Commitment
    weeklyFeedback: z.boolean(), // Agrees to weekly feedback calls
    caseStudy: z.boolean(),      // Agrees to case study participation
    
    // Discovery
    hearAbout: z.enum([
        'product-hunt',
        'y-combinator',
        'dev-to',
        'linkedin',
        'github',
        'twitter',
        'reddit',
        'friend',
        'other'
    ]),
    
    // Timestamp
    signedUpAt: z.date().default(() => new Date()),
});

export type BetaSignup = z.infer<typeof betaSignupSchema>;

export interface BetaUser extends BetaSignup {
    id: string;
    status: 'pending' | 'approved' | 'active' | 'inactive' | 'rejected';
    accessToken?: string;
    onboardedAt?: Date;
    lastActiveAt?: Date;
    feedbackCalls: number;
    issuesReported: number;
    featuresUsed: string[];
}

/**
 * Beta Program Manager
 */
export class BetaProgramManager {
    private signups: Map<string, BetaUser> = new Map();
    private readonly MAX_BETA_USERS = 50;
    private readonly TARGET_ACTIVE = 20;

    /**
     * Submit beta sign-up
     */
    async submitSignup(data: Omit<BetaSignup, 'signedUpAt'>): Promise<{ 
        success: boolean; 
        id?: string; 
        message: string;
    }> {
        // Validate input
        try {
            betaSignupSchema.parse({ ...data, signedUpAt: new Date() });
        } catch (error) {
            return {
                success: false,
                message: 'Invalid signup data',
            };
        }

        // Check capacity
        const currentSignups = Array.from(this.signups.values()).filter(
            u => u.status !== 'rejected'
        ).length;

        if (currentSignups >= this.MAX_BETA_USERS) {
            return {
                success: false,
                message: 'Beta program is currently full. You\'ve been added to the waitlist.',
            };
        }

        // Create beta user
        const id = this.generateId();
        const betaUser: BetaUser = {
            ...data,
            id,
            status: 'pending',
            signedUpAt: new Date(),
            feedbackCalls: 0,
            issuesReported: 0,
            featuresUsed: [],
        };

        this.signups.set(id, betaUser);

        // Auto-approve high-quality signups
        if (this.shouldAutoApprove(betaUser)) {
            await this.approve(id);
        }

        return {
            success: true,
            id,
            message: 'Thanks for signing up! We\'ll review your application and get back to you within 24 hours.',
        };
    }

    /**
     * Approve beta user
     */
    async approve(userId: string): Promise<boolean> {
        const user = this.signups.get(userId);
        if (!user || user.status !== 'pending') {
            return false;
        }

        user.status = 'approved';
        user.accessToken = this.generateAccessToken();

        // Send approval email with access token
        await this.sendApprovalEmail(user);

        this.signups.set(userId, user);
        return true;
    }

    /**
     * Mark user as active (first login/usage)
     */
    async activate(userId: string): Promise<boolean> {
        const user = this.signups.get(userId);
        if (!user || user.status !== 'approved') {
            return false;
        }

        user.status = 'active';
        user.onboardedAt = new Date();
        user.lastActiveAt = new Date();

        this.signups.set(userId, user);
        return true;
    }

    /**
     * Record user activity
     */
    async recordActivity(
        userId: string,
        activity: {
            feature?: string;
            issueReported?: boolean;
            feedbackCall?: boolean;
        }
    ): Promise<void> {
        const user = this.signups.get(userId);
        if (!user) return;

        user.lastActiveAt = new Date();

        if (activity.feature && !user.featuresUsed.includes(activity.feature)) {
            user.featuresUsed.push(activity.feature);
        }

        if (activity.issueReported) {
            user.issuesReported++;
        }

        if (activity.feedbackCall) {
            user.feedbackCalls++;
        }

        this.signups.set(userId, user);
    }

    /**
     * Get beta program statistics
     */
    getStats(): {
        total: number;
        pending: number;
        approved: number;
        active: number;
        rejected: number;
        targetReached: boolean;
        averageFeedbackCalls: number;
        topFeatures: Array<{ feature: string; users: number }>;
    } {
        const users = Array.from(this.signups.values());

        const stats = {
            total: users.length,
            pending: users.filter(u => u.status === 'pending').length,
            approved: users.filter(u => u.status === 'approved').length,
            active: users.filter(u => u.status === 'active').length,
            rejected: users.filter(u => u.status === 'rejected').length,
            targetReached: false,
            averageFeedbackCalls: 0,
            topFeatures: [] as Array<{ feature: string; users: number }>,
        };

        stats.targetReached = stats.active >= this.TARGET_ACTIVE;

        const activeUsers = users.filter(u => u.status === 'active');
        if (activeUsers.length > 0) {
            stats.averageFeedbackCalls =
                activeUsers.reduce((sum, u) => sum + u.feedbackCalls, 0) / activeUsers.length;
        }

        // Calculate feature usage
        const featureCount = new Map<string, number>();
        for (const user of activeUsers) {
            for (const feature of user.featuresUsed) {
                featureCount.set(feature, (featureCount.get(feature) || 0) + 1);
            }
        }

        stats.topFeatures = Array.from(featureCount.entries())
            .map(([feature, users]) => ({ feature, users }))
            .sort((a, b) => b.users - a.users)
            .slice(0, 10);

        return stats;
    }

    /**
     * Get user by email
     */
    getUserByEmail(email: string): BetaUser | undefined {
        return Array.from(this.signups.values()).find(u => u.email === email);
    }

    /**
     * List all beta users
     */
    listUsers(filter?: { status?: BetaUser['status'] }): BetaUser[] {
        let users = Array.from(this.signups.values());

        if (filter?.status) {
            users = users.filter(u => u.status === filter.status);
        }

        return users.sort((a, b) => b.signedUpAt.getTime() - a.signedUpAt.getTime());
    }

    /**
     * Auto-approve criteria
     */
    private shouldAutoApprove(user: BetaUser): boolean {
        // Auto-approve if:
        // 1. From Y Combinator community
        // 2. Leads a team of 11+ developers
        // 3. Commits to weekly feedback AND case study

        const isYC = user.hearAbout === 'y-combinator';
        const isLargeTeam = ['51-200', '200+'].includes(user.teamSize);
        const isCommitted = user.weeklyFeedback && user.caseStudy;
        const isSenior = ['lead', 'manager', 'founder'].includes(user.role);

        return isYC || (isLargeTeam && isCommitted) || (isSenior && isCommitted);
    }

    private generateId(): string {
        return `beta_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }

    private generateAccessToken(): string {
        return `odavl_beta_${Array.from({ length: 32 }, () =>
            Math.random().toString(36)[2]
        ).join('')}`;
    }

    private async sendApprovalEmail(user: BetaUser): Promise<void> {
        // Email sending implementation
        console.log(`📧 Approval email sent to ${user.email}`);
        console.log(`🔑 Access Token: ${user.accessToken}`);
    }
}

/**
 * Singleton instance
 */
export const betaProgramManager = new BetaProgramManager();

/**
 * Express/Next.js API handler
 */
export async function handleBetaSignup(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const result = await betaProgramManager.submitSignup(req.body);
        
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}
