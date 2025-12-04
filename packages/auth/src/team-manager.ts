/**
 * Team Management System
 * Multi-tenant team organization and collaboration
 * 
 * Week 9-10: Enterprise Features
 * UNIFIED_ACTION_PLAN Phase 2 Month 3
 */

import type { Role } from './rbac.js';

export interface Team {
    id: string;
    name: string;
    organizationId: string;
    
    // Metadata
    description?: string;
    avatar?: string;
    createdAt: Date;
    updatedAt: Date;
    
    // Settings
    settings: TeamSettings;
    
    // Ownership
    ownerId: string;
    
    // Stats
    memberCount: number;
    projectCount: number;
}

export interface TeamSettings {
    // Autopilot configuration
    autopilot: {
        enabled: boolean;
        maxFilesPerCycle: number;
        protectedPaths: string[];
        autoApprove: boolean;
    };
    
    // Guardian configuration
    guardian: {
        enabled: boolean;
        scanOnPush: boolean;
        blockOnFailure: boolean;
        minScore: number;
    };
    
    // Insight configuration
    insight: {
        enabled: boolean;
        detectors: string[];
        severityThreshold: 'info' | 'warning' | 'error';
    };
    
    // Notifications
    notifications: {
        email: boolean;
        slack?: string;
        discord?: string;
        webhook?: string;
    };
    
    // Compliance
    compliance: {
        requireApproval: boolean;
        requireReview: boolean;
        retentionDays: number;
    };
}

export interface TeamMember {
    id: string;
    teamId: string;
    userId: string;
    
    // User info (denormalized)
    email: string;
    name: string;
    avatar?: string;
    
    // Role in team
    role: Role;
    
    // Status
    status: 'active' | 'invited' | 'suspended';
    
    // Timestamps
    joinedAt: Date;
    invitedAt: Date;
    invitedBy: string;
    
    // Activity
    lastActiveAt?: Date;
}

export interface TeamInvitation {
    id: string;
    teamId: string;
    email: string;
    role: Role;
    
    // Invitation details
    invitedBy: string;
    invitedAt: Date;
    expiresAt: Date;
    
    // Token
    token: string;
    
    // Status
    status: 'pending' | 'accepted' | 'expired' | 'revoked';
}

export interface TeamProject {
    id: string;
    teamId: string;
    name: string;
    
    // Repository info
    repoUrl?: string;
    branch?: string;
    
    // Configuration
    config: {
        autopilotEnabled: boolean;
        guardianEnabled: boolean;
        insightEnabled: boolean;
    };
    
    // Stats
    lastScanAt?: Date;
    issuesCount: number;
    
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Team Manager - Core team operations
 */
export class TeamManager {
    private teams: Map<string, Team> = new Map();
    private members: Map<string, TeamMember[]> = new Map();
    private invitations: Map<string, TeamInvitation[]> = new Map();

    /**
     * Create new team
     */
    async createTeam(
        name: string,
        organizationId: string,
        ownerId: string
    ): Promise<Team> {
        const team: Team = {
            id: this.generateId('team'),
            name,
            organizationId,
            ownerId,
            memberCount: 1,
            projectCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            settings: this.getDefaultSettings(),
        };

        this.teams.set(team.id, team);

        // Add owner as first member
        const owner: TeamMember = {
            id: this.generateId('member'),
            teamId: team.id,
            userId: ownerId,
            email: '', // Should be fetched from user service
            name: '',
            role: 'owner',
            status: 'active',
            joinedAt: new Date(),
            invitedAt: new Date(),
            invitedBy: ownerId,
        };

        this.members.set(team.id, [owner]);

        return team;
    }

    /**
     * Get team by ID
     */
    async getTeam(teamId: string): Promise<Team | null> {
        return this.teams.get(teamId) || null;
    }

    /**
     * Update team settings
     */
    async updateTeamSettings(
        teamId: string,
        settings: Partial<TeamSettings>
    ): Promise<Team | null> {
        const team = this.teams.get(teamId);
        if (!team) return null;

        team.settings = {
            ...team.settings,
            ...settings,
        };
        team.updatedAt = new Date();

        this.teams.set(teamId, team);
        return team;
    }

    /**
     * Delete team
     */
    async deleteTeam(teamId: string): Promise<boolean> {
        const deleted = this.teams.delete(teamId);
        this.members.delete(teamId);
        this.invitations.delete(teamId);
        return deleted;
    }

    /**
     * List teams for organization
     */
    async listTeams(organizationId: string): Promise<Team[]> {
        return Array.from(this.teams.values()).filter(
            team => team.organizationId === organizationId
        );
    }

    /**
     * Invite user to team
     */
    async inviteMember(
        teamId: string,
        email: string,
        role: Role,
        invitedBy: string
    ): Promise<TeamInvitation> {
        const team = this.teams.get(teamId);
        if (!team) {
            throw new Error('Team not found');
        }

        const invitation: TeamInvitation = {
            id: this.generateId('invite'),
            teamId,
            email,
            role,
            invitedBy,
            invitedAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            token: this.generateToken(),
            status: 'pending',
        };

        const teamInvites = this.invitations.get(teamId) || [];
        teamInvites.push(invitation);
        this.invitations.set(teamId, teamInvites);

        return invitation;
    }

    /**
     * Accept invitation
     */
    async acceptInvitation(
        token: string,
        userId: string
    ): Promise<TeamMember | null> {
        // Find invitation by token
        let invitation: TeamInvitation | null = null;
        let teamId: string | null = null;

        for (const [tid, invites] of this.invitations.entries()) {
            const found = invites.find(inv => inv.token === token);
            if (found) {
                invitation = found;
                teamId = tid;
                break;
            }
        }

        if (!invitation || !teamId) {
            return null;
        }

        // Check expiration
        if (invitation.expiresAt < new Date()) {
            invitation.status = 'expired';
            return null;
        }

        // Create member
        const member: TeamMember = {
            id: this.generateId('member'),
            teamId,
            userId,
            email: invitation.email,
            name: '', // Should be fetched from user service
            role: invitation.role,
            status: 'active',
            joinedAt: new Date(),
            invitedAt: invitation.invitedAt,
            invitedBy: invitation.invitedBy,
        };

        const teamMembers = this.members.get(teamId) || [];
        teamMembers.push(member);
        this.members.set(teamId, teamMembers);

        // Update team member count
        const team = this.teams.get(teamId);
        if (team) {
            team.memberCount++;
            this.teams.set(teamId, team);
        }

        // Mark invitation as accepted
        invitation.status = 'accepted';

        return member;
    }

    /**
     * Remove member from team
     */
    async removeMember(teamId: string, memberId: string): Promise<boolean> {
        const teamMembers = this.members.get(teamId) || [];
        const filtered = teamMembers.filter(m => m.id !== memberId);

        if (filtered.length === teamMembers.length) {
            return false; // Member not found
        }

        this.members.set(teamId, filtered);

        // Update team member count
        const team = this.teams.get(teamId);
        if (team) {
            team.memberCount--;
            this.teams.set(teamId, team);
        }

        return true;
    }

    /**
     * Update member role
     */
    async updateMemberRole(
        teamId: string,
        memberId: string,
        newRole: Role
    ): Promise<TeamMember | null> {
        const teamMembers = this.members.get(teamId) || [];
        const member = teamMembers.find(m => m.id === memberId);

        if (!member) return null;

        member.role = newRole;
        this.members.set(teamId, teamMembers);

        return member;
    }

    /**
     * List team members
     */
    async listMembers(teamId: string): Promise<TeamMember[]> {
        return this.members.get(teamId) || [];
    }

    /**
     * Get member by user ID
     */
    async getMemberByUserId(
        teamId: string,
        userId: string
    ): Promise<TeamMember | null> {
        const teamMembers = this.members.get(teamId) || [];
        return teamMembers.find(m => m.userId === userId) || null;
    }

    /**
     * Check if user is member of team
     */
    async isMember(teamId: string, userId: string): Promise<boolean> {
        const member = await this.getMemberByUserId(teamId, userId);
        return member !== null && member.status === 'active';
    }

    /**
     * Get user's teams
     */
    async getUserTeams(userId: string): Promise<Team[]> {
        const userTeams: Team[] = [];

        for (const [teamId, members] of this.members.entries()) {
            const isMember = members.some(
                m => m.userId === userId && m.status === 'active'
            );

            if (isMember) {
                const team = this.teams.get(teamId);
                if (team) {
                    userTeams.push(team);
                }
            }
        }

        return userTeams;
    }

    private getDefaultSettings(): TeamSettings {
        return {
            autopilot: {
                enabled: true,
                maxFilesPerCycle: 10,
                protectedPaths: ['security/**', 'auth/**'],
                autoApprove: false,
            },
            guardian: {
                enabled: true,
                scanOnPush: true,
                blockOnFailure: false,
                minScore: 70,
            },
            insight: {
                enabled: true,
                detectors: ['typescript', 'eslint', 'security'],
                severityThreshold: 'warning',
            },
            notifications: {
                email: true,
            },
            compliance: {
                requireApproval: true,
                requireReview: true,
                retentionDays: 90,
            },
        };
    }

    private generateId(prefix: string): string {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }

    private generateToken(): string {
        return Array.from({ length: 32 }, () =>
            Math.random().toString(36)[2]
        ).join('');
    }
}

/**
 * Singleton team manager instance
 */
export const teamManager = new TeamManager();
