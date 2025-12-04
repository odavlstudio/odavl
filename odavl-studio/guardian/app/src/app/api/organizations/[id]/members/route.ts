/**
 * Organization Members API
 * Manages members within an organization
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
 * GET /api/organizations/[id]/members - List organization members
 */
export async function GET(request: NextRequest, props: RouteParams) {
    const params = await props.params;
    try {
        const { id: organizationId } = params;
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');

        const members = await prisma.member.findMany({
            where: {
                organizationId,
                ...(role && { role }),
            },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { joinedAt: 'desc' },
        });

        return NextResponse.json({
            success: true,
            members,
            count: members.length,
        });
    } catch (error) {
        logger.error('Failed to fetch members', { error });
        captureError(error as Error, { tags: { context: 'members-list' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch members',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/organizations/[id]/members - Add new member
 * Body: { email, name?, role?, teamId? }
 */
export async function POST(request: NextRequest, props: RouteParams) {
    const params = await props.params;
    try {
        const { id: organizationId } = params;
        const body = await request.json();
        const { email, name, role = 'member', teamId } = body;

        if (!email) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Email is required',
                },
                { status: 400 }
            );
        }

        // Check if member already exists
        const existing = await prisma.member.findUnique({
            where: {
                organizationId_email: {
                    organizationId,
                    email,
                },
            },
        });

        if (existing) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Member already exists in this organization',
                },
                { status: 409 }
            );
        }

        const member = await prisma.member.create({
            data: {
                email,
                name,
                role,
                organizationId,
                teamId,
                joinedAt: new Date(),
            },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        logger.info('Member added to organization', {
            organizationId,
            memberId: member.id,
            email,
            role,
        });

        return NextResponse.json(
            {
                success: true,
                member,
                message: 'Member added successfully',
            },
            { status: 201 }
        );
    } catch (error) {
        logger.error('Failed to add member', { error });
        captureError(error as Error, { tags: { context: 'member-add' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to add member',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/organizations/[id]/members/[memberId] - Update member
 */
export async function PATCH(request: NextRequest, props: RouteParams) {
    const params = await props.params;
    try {
        const body = await request.json();
        const { memberId, role, teamId } = body;

        if (!memberId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Member ID is required',
                },
                { status: 400 }
            );
        }

        const member = await prisma.member.update({
            where: { id: memberId },
            data: {
                ...(role && { role }),
                ...(teamId !== undefined && { teamId }),
            },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        logger.info('Member updated', {
            memberId,
            updates: Object.keys(body),
        });

        return NextResponse.json({
            success: true,
            member,
            message: 'Member updated successfully',
        });
    } catch (error) {
        logger.error('Failed to update member', { error });
        captureError(error as Error, { tags: { context: 'member-update' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to update member',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/organizations/[id]/members/[memberId] - Remove member
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const memberId = searchParams.get('memberId');

        if (!memberId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Member ID is required',
                },
                { status: 400 }
            );
        }

        await prisma.member.delete({
            where: { id: memberId },
        });

        logger.info('Member removed from organization', { memberId });

        return NextResponse.json({
            success: true,
            message: 'Member removed successfully',
        });
    } catch (error) {
        logger.error('Failed to remove member', { error });
        captureError(error as Error, { tags: { context: 'member-remove' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to remove member',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}
