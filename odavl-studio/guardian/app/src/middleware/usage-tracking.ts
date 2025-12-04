/**
 * Usage Tracking Middleware
 * Tracks and enforces organization quotas
 */

import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export type UsageType = 'testRun' | 'monitorCheck' | 'apiCall';

/**
 * Check if organization has quota available
 */
export async function checkQuota(
    organizationId: string,
    usageType: UsageType
): Promise<{
    allowed: boolean;
    used: number;
    quota: number;
    percentage: number;
    message?: string;
}> {
    try {
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                testRunsUsed: true,
                testRunsQuota: true,
                monitorChecksUsed: true,
                monitorChecksQuota: true,
                apiCallsUsed: true,
                apiCallsQuota: true,
                status: true,
            },
        });

        if (!organization) {
            return {
                allowed: false,
                used: 0,
                quota: 0,
                percentage: 0,
                message: 'Organization not found',
            };
        }

        if (organization.status !== 'active') {
            return {
                allowed: false,
                used: 0,
                quota: 0,
                percentage: 0,
                message: `Organization status: ${organization.status}`,
            };
        }

        let used: number;
        let quota: number;

        switch (usageType) {
            case 'testRun':
                used = organization.testRunsUsed;
                quota = organization.testRunsQuota;
                break;
            case 'monitorCheck':
                used = organization.monitorChecksUsed;
                quota = organization.monitorChecksQuota;
                break;
            case 'apiCall':
                used = organization.apiCallsUsed;
                quota = organization.apiCallsQuota;
                break;
        }

        const percentage = (used / quota) * 100;
        const allowed = used < quota;

        return {
            allowed,
            used,
            quota,
            percentage,
            message: allowed ? undefined : 'Quota exceeded',
        };
    } catch (error) {
        logger.error('Failed to check quota', { error, organizationId, usageType });
        return {
            allowed: false,
            used: 0,
            quota: 0,
            percentage: 0,
            message: 'Error checking quota',
        };
    }
}

/**
 * Increment usage counter
 */
export async function incrementUsage(
    organizationId: string,
    usageType: UsageType,
    amount: number = 1
): Promise<boolean> {
    try {
        let updateData: Record<string, { increment: number }> = {};

        switch (usageType) {
            case 'testRun':
                updateData = { testRunsUsed: { increment: amount } };
                break;
            case 'monitorCheck':
                updateData = { monitorChecksUsed: { increment: amount } };
                break;
            case 'apiCall':
                updateData = { apiCallsUsed: { increment: amount } };
                break;
        }

        await prisma.organization.update({
            where: { id: organizationId },
            data: updateData,
        });

        logger.info('Usage incremented', {
            organizationId,
            usageType,
            amount,
        });

        return true;
    } catch (error) {
        logger.error('Failed to increment usage', { error, organizationId, usageType });
        return false;
    }
}

/**
 * Reset usage counters (call on billing cycle reset)
 */
export async function resetUsage(organizationId: string): Promise<boolean> {
    try {
        await prisma.organization.update({
            where: { id: organizationId },
            data: {
                testRunsUsed: 0,
                monitorChecksUsed: 0,
                apiCallsUsed: 0,
                billingResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
            },
        });

        logger.info('Usage reset', { organizationId });
        return true;
    } catch (error) {
        logger.error('Failed to reset usage', { error, organizationId });
        return false;
    }
}

/**
 * Get usage statistics
 */
export async function getUsageStats(organizationId: string) {
    try {
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                testRunsUsed: true,
                testRunsQuota: true,
                monitorChecksUsed: true,
                monitorChecksQuota: true,
                apiCallsUsed: true,
                apiCallsQuota: true,
                billingResetAt: true,
                tier: true,
                status: true,
            },
        });

        if (!organization) {
            return null;
        }

        return {
            testRuns: {
                used: organization.testRunsUsed,
                quota: organization.testRunsQuota,
                percentage: (organization.testRunsUsed / organization.testRunsQuota) * 100,
                remaining: organization.testRunsQuota - organization.testRunsUsed,
            },
            monitorChecks: {
                used: organization.monitorChecksUsed,
                quota: organization.monitorChecksQuota,
                percentage: (organization.monitorChecksUsed / organization.monitorChecksQuota) * 100,
                remaining: organization.monitorChecksQuota - organization.monitorChecksUsed,
            },
            apiCalls: {
                used: organization.apiCallsUsed,
                quota: organization.apiCallsQuota,
                percentage: (organization.apiCallsUsed / organization.apiCallsQuota) * 100,
                remaining: organization.apiCallsQuota - organization.apiCallsUsed,
            },
            tier: organization.tier,
            status: organization.status,
            billingResetAt: organization.billingResetAt,
        };
    } catch (error) {
        logger.error('Failed to get usage stats', { error, organizationId });
        return null;
    }
}

/**
 * Enforce quota before operation
 */
export async function enforceQuota(
    organizationId: string,
    usageType: UsageType
): Promise<{ allowed: boolean; message?: string }> {
    const quota = await checkQuota(organizationId, usageType);

    if (!quota.allowed) {
        logger.warn('Quota enforcement blocked operation', {
            organizationId,
            usageType,
            used: quota.used,
            quota: quota.quota,
        });
    }

    return {
        allowed: quota.allowed,
        message: quota.message,
    };
}
