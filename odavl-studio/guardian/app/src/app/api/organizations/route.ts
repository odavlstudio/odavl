/**
 * Organizations API
 * Manages multi-tenant organization entities
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { captureError } from '@/lib/sentry';

/**
 * GET /api/organizations - List all organizations
 * Query Parameters:
 * - tier: Filter by tier (free/pro/enterprise)
 * - status: Filter by status (active/suspended/cancelled)
 * - limit: Maximum number of results
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tier = searchParams.get('tier');
        const status = searchParams.get('status');
        const limit = searchParams.get('limit');

        const organizations = await prisma.organization.findMany({
            where: {
                ...(tier && { tier }),
                ...(status && { status }),
            },
            include: {
                _count: {
                    select: {
                        members: true,
                        teams: true,
                        projects: true,
                        apiKeys: true,
                    },
                },
            },
            take: limit ? parseInt(limit, 10) : undefined,
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            success: true,
            organizations,
            count: organizations.length,
        });
    } catch (error) {
        logger.error('Failed to fetch organizations', { error });
        captureError(error as Error, { tags: { context: 'organizations-list' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch organizations',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/organizations - Create new organization
 * Body: { name, slug, tier?, testRunsQuota?, monitorChecksQuota?, apiCallsQuota? }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
            slug,
            tier = 'free',
            testRunsQuota,
            monitorChecksQuota,
            apiCallsQuota,
        } = body;

        if (!name || !slug) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: name, slug',
                },
                { status: 400 }
            );
        }

        // Check if slug already exists
        const existing = await prisma.organization.findUnique({
            where: { slug },
        });

        if (existing) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Organization slug already exists',
                },
                { status: 409 }
            );
        }

        // Set quotas based on tier
        const quotas = {
            free: {
                testRunsQuota: 100,
                monitorChecksQuota: 1000,
                apiCallsQuota: 10000,
            },
            pro: {
                testRunsQuota: 1000,
                monitorChecksQuota: 10000,
                apiCallsQuota: 100000,
            },
            enterprise: {
                testRunsQuota: 10000,
                monitorChecksQuota: 100000,
                apiCallsQuota: 1000000,
            },
        };

        const tierQuotas = quotas[tier as keyof typeof quotas] || quotas.free;

        const organization = await prisma.organization.create({
            data: {
                name,
                slug,
                tier,
                testRunsQuota: testRunsQuota || tierQuotas.testRunsQuota,
                monitorChecksQuota:
                    monitorChecksQuota || tierQuotas.monitorChecksQuota,
                apiCallsQuota: apiCallsQuota || tierQuotas.apiCallsQuota,
            },
        });

        logger.info('Organization created', {
            organizationId: organization.id,
            slug,
            tier,
        });

        return NextResponse.json(
            {
                success: true,
                organization,
                message: 'Organization created successfully',
            },
            { status: 201 }
        );
    } catch (error) {
        logger.error('Failed to create organization', { error });
        captureError(error as Error, { tags: { context: 'organization-create' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create organization',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}
