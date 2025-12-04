/**
 * Single Organization API
 * GET/PATCH/DELETE operations for specific organization
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
 * GET /api/organizations/[id] - Get organization details
 */
export async function GET(request: NextRequest, props: RouteParams) {
    const params = await props.params;
    try {
        const { id } = params;

        const organization = await prisma.organization.findUnique({
            where: { id },
            include: {
                members: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        joinedAt: true,
                    },
                },
                teams: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        _count: { select: { members: true, projects: true } },
                    },
                },
                projects: {
                    select: {
                        id: true,
                        name: true,
                        url: true,
                        createdAt: true,
                    },
                },
                apiKeys: {
                    where: { enabled: true },
                    select: {
                        id: true,
                        name: true,
                        scopes: true,
                        lastUsedAt: true,
                        expiresAt: true,
                    },
                },
                _count: {
                    select: {
                        members: true,
                        teams: true,
                        projects: true,
                        apiKeys: true,
                    },
                },
            },
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

        // Calculate usage percentages
        const usage = {
            testRuns: {
                used: organization.testRunsUsed,
                quota: organization.testRunsQuota,
                percentage: (organization.testRunsUsed / organization.testRunsQuota) * 100,
            },
            monitorChecks: {
                used: organization.monitorChecksUsed,
                quota: organization.monitorChecksQuota,
                percentage: (organization.monitorChecksUsed / organization.monitorChecksQuota) * 100,
            },
            apiCalls: {
                used: organization.apiCallsUsed,
                quota: organization.apiCallsQuota,
                percentage: (organization.apiCallsUsed / organization.apiCallsQuota) * 100,
            },
        };

        return NextResponse.json({
            success: true,
            organization,
            usage,
        });
    } catch (error) {
        logger.error('Failed to fetch organization', { error });
        captureError(error as Error, { tags: { context: 'organization-get' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch organization',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/organizations/[id] - Update organization
 * Body: { name?, tier?, status?, quotas? }
 */
export async function PATCH(request: NextRequest, props: RouteParams) {
    const params = await props.params;
    try {
        const { id } = params;
        const body = await request.json();

        const organization = await prisma.organization.update({
            where: { id },
            data: {
                ...(body.name && { name: body.name }),
                ...(body.tier && { tier: body.tier }),
                ...(body.status && { status: body.status }),
                ...(body.testRunsQuota && { testRunsQuota: body.testRunsQuota }),
                ...(body.monitorChecksQuota && {
                    monitorChecksQuota: body.monitorChecksQuota,
                }),
                ...(body.apiCallsQuota && { apiCallsQuota: body.apiCallsQuota }),
            },
        });

        logger.info('Organization updated', {
            organizationId: id,
            updates: Object.keys(body),
        });

        return NextResponse.json({
            success: true,
            organization,
            message: 'Organization updated successfully',
        });
    } catch (error) {
        logger.error('Failed to update organization', { error });
        captureError(error as Error, { tags: { context: 'organization-update' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to update organization',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/organizations/[id] - Delete organization
 */
export async function DELETE(request: NextRequest, props: RouteParams) {
    const params = await props.params;
    try {
        const { id } = params;

        await prisma.organization.delete({
            where: { id },
        });

        logger.info('Organization deleted', { organizationId: id });

        return NextResponse.json({
            success: true,
            message: 'Organization deleted successfully',
        });
    } catch (error) {
        logger.error('Failed to delete organization', { error });
        captureError(error as Error, { tags: { context: 'organization-delete' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to delete organization',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}
