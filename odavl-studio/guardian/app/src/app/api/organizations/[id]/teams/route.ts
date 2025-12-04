/**
 * Organization Teams API
 * Manages teams within an organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { captureError } from '@/lib/sentry';

type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};

/**
 * GET /api/organizations/[id]/teams - List organization teams
 */
export async function GET(request: NextRequest, props: RouteParams) {
    const params = await props.params;
    try {
        const { id: organizationId } = params;

        const teams = await prisma.team.findMany({
            where: { organizationId },
            include: {
                _count: {
                    select: {
                        members: true,
                        projects: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({
            success: true,
            teams,
            count: teams.length,
        });
    } catch (error) {
        logger.error('Failed to fetch teams', { error });
        captureError(error as Error, { tags: { context: 'teams-list' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch teams',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/organizations/[id]/teams - Create new team
 * Body: { name, description? }
 */
export async function POST(request: NextRequest, props: RouteParams) {
    const params = await props.params;
    try {
        const { id: organizationId } = params;
        const body = await request.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Team name is required',
                },
                { status: 400 }
            );
        }

        // Verify organization exists
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
        });

        if (!organization) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Organization not found',
                },
                { status: 404 }
            );
        }

        const team = await prisma.team.create({
            data: {
                name,
                description,
                organizationId,
            },
            include: {
                _count: {
                    select: {
                        members: true,
                        projects: true,
                    },
                },
            },
        });

        logger.info('Team created', {
            organizationId,
            teamId: team.id,
            name,
        });

        return NextResponse.json(
            {
                success: true,
                team,
                message: 'Team created successfully',
            },
            { status: 201 }
        );
    } catch (error) {
        logger.error('Failed to create team', { error });
        captureError(error as Error, { tags: { context: 'team-create' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create team',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/organizations/[id]/teams/[teamId] - Update team
 */
export async function PATCH(request: NextRequest, props: RouteParams) {
    const params = await props.params;
    try {
        const body = await request.json();
        const { teamId, name, description } = body;

        if (!teamId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Team ID is required',
                },
                { status: 400 }
            );
        }

        const team = await prisma.team.update({
            where: { id: teamId },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
            },
            include: {
                _count: {
                    select: {
                        members: true,
                        projects: true,
                    },
                },
            },
        });

        logger.info('Team updated', {
            teamId,
            updates: Object.keys(body),
        });

        return NextResponse.json({
            success: true,
            team,
            message: 'Team updated successfully',
        });
    } catch (error) {
        logger.error('Failed to update team', { error });
        captureError(error as Error, { tags: { context: 'team-update' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to update team',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/organizations/[id]/teams/[teamId] - Delete team
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get('teamId');

        if (!teamId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Team ID is required',
                },
                { status: 400 }
            );
        }

        // Check if team has members or projects
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                _count: {
                    select: {
                        members: true,
                        projects: true,
                    },
                },
            },
        });

        if (!team) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Team not found',
                },
                { status: 404 }
            );
        }

        if (team._count.members > 0 || team._count.projects > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Cannot delete team with members or projects',
                    details: {
                        members: team._count.members,
                        projects: team._count.projects,
                    },
                },
                { status: 409 }
            );
        }

        await prisma.team.delete({
            where: { id: teamId },
        });

        logger.info('Team deleted', { teamId });

        return NextResponse.json({
            success: true,
            message: 'Team deleted successfully',
        });
    } catch (error) {
        logger.error('Failed to delete team', { error });
        captureError(error as Error, { tags: { context: 'team-delete' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to delete team',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}
