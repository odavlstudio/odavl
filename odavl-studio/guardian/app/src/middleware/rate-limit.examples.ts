/**
 * Example: Using Rate Limiting Middleware
 * 
 * This file demonstrates how to integrate rate limiting
 * into your API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/middleware/rate-limit';
import logger from '@/lib/logger';

/**
 * Example 1: Organization-based rate limiting
 */
export async function exampleOrganizationRateLimit(
    request: NextRequest,
    organizationId: string
) {
    // Check rate limit before processing request
    const rateLimitResponse = await rateLimitMiddleware(request, {
        type: 'organization',
        identifier: organizationId,
    });

    // If rate limit exceeded, return early
    if (rateLimitResponse) {
        return rateLimitResponse;
    }

    // Continue with normal request processing
    return NextResponse.json({
        success: true,
        message: 'Request processed successfully',
    });
}

/**
 * Example 2: API key-based rate limiting
 */
export async function exampleApiKeyRateLimit(
    request: NextRequest,
    apiKey: string
) {
    const rateLimitResponse = await rateLimitMiddleware(request, {
        type: 'apikey',
        identifier: apiKey,
    });

    if (rateLimitResponse) {
        return rateLimitResponse;
    }

    return NextResponse.json({
        success: true,
        message: 'Request processed successfully',
    });
}

/**
 * Example 3: IP-based rate limiting (for public endpoints)
 */
export async function exampleIpRateLimit(request: NextRequest) {
    const rateLimitResponse = await rateLimitMiddleware(request, {
        type: 'ip',
        limit: 100, // 100 requests per minute
        windowSeconds: 60,
    });

    if (rateLimitResponse) {
        return rateLimitResponse;
    }

    return NextResponse.json({
        success: true,
        message: 'Request processed successfully',
    });
}

/**
 * Example 4: Combined rate limiting (org + API key)
 */
export async function exampleCombinedRateLimit(
    request: NextRequest,
    organizationId: string,
    apiKey: string
) {
    // Check organization rate limit
    const orgRateLimitResponse = await rateLimitMiddleware(request, {
        type: 'organization',
        identifier: organizationId,
    });

    if (orgRateLimitResponse) {
        return orgRateLimitResponse;
    }

    // Check API key rate limit
    const keyRateLimitResponse = await rateLimitMiddleware(request, {
        type: 'apikey',
        identifier: apiKey,
    });

    if (keyRateLimitResponse) {
        return keyRateLimitResponse;
    }

    // Both rate limits passed
    return NextResponse.json({
        success: true,
        message: 'Request processed successfully',
    });
}

/**
 * Example 5: Protected API route with rate limiting
 */
export async function GET(request: NextRequest) {
    try {
        // Extract organization ID from auth token or headers
        const organizationId = request.headers.get('x-organization-id');

        if (!organizationId) {
            return NextResponse.json(
                { success: false, error: 'Organization ID required' },
                { status: 401 }
            );
        }

        // Apply rate limiting
        const rateLimitResponse = await rateLimitMiddleware(request, {
            type: 'organization',
            identifier: organizationId,
        });

        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        // Process request
        // ... your business logic here ...

        return NextResponse.json({
            success: true,
            data: { message: 'Protected resource accessed successfully' },
        });
    } catch (error) {
        logger.error('API error', { error });
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Example 6: Custom rate limit based on user plan
 */
export async function exampleCustomRateLimit(
    request: NextRequest,
    userId: string,
    userPlan: 'free' | 'pro' | 'enterprise'
) {
    const limits: Record<string, number> = {
        free: 60,
        pro: 300,
        enterprise: 1000,
    };

    const rateLimitResponse = await rateLimitMiddleware(request, {
        type: 'ip',
        identifier: userId,
        limit: limits[userPlan],
        windowSeconds: 60,
    });

    if (rateLimitResponse) {
        return rateLimitResponse;
    }

    return NextResponse.json({
        success: true,
        message: 'Request processed successfully',
        plan: userPlan,
    });
}
