/**
 * Insight Results API Route
 * POST /api/v1/insight/results - Upload analysis results from CLI
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiKey } from '@/lib/auth/api-key';
import { trackUsage } from '@/lib/usage/track';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (10 req/min)
    const rateLimitResult = await rateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again in 60 seconds.' },
        { status: 429 }
      );
    }

    // Verify API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7);
    const verification = await verifyApiKey(apiKey);

    if (!verification.valid) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Check scopes (requires insight:write)
    if (!verification.scopes?.includes('insight:write')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Required scope: insight:write' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { workspacePath, timestamp, issues, summary, detectors } = body;

    // Validate required fields
    if (!workspacePath || !timestamp || !issues || !summary || !detectors) {
      return NextResponse.json(
        { error: 'Missing required fields: workspacePath, timestamp, issues, summary, detectors' },
        { status: 400 }
      );
    }

    // Extract workspace name from path
    const workspaceName = workspacePath.split(/[/\\]/).pop() || 'Unknown';

    // Store result in database
    const result = await prisma.insightResult.create({
      data: {
        userId: verification.userId || 'unknown',
        orgId: verification.orgId || '',
        workspacePath,
        workspaceName,
        issues,
        summary,
        detectors,
        timestamp: new Date(timestamp),
      },
    });

    // Track usage for billing
    await trackUsage({
      userId: verification.userId || 'unknown',
      orgId: verification.orgId || '',
      product: 'insight',
      action: 'analyze',
      endpoint: '/api/v1/insight/results',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      apiKeyId: verification.apiKeyId || 'unknown',
      credits: 1,
    });

    return NextResponse.json({
      success: true,
      id: result.id,
      message: 'Results uploaded successfully',
    });
  } catch (error: any) {
    console.error('Failed to upload Insight results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify API key
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7);
    const verification = await verifyApiKey(apiKey);

    if (!verification.valid) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Check scopes (requires insight:read)
    if (!verification.scopes?.includes('insight:read')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Required scope: insight:read' },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Fetch results
    const results = await prisma.insightResult.findMany({
      where: {
        userId: verification.userId || 'unknown',
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        workspaceName: true,
        summary: true,
        detectors: true,
        timestamp: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      results,
      count: results.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Failed to fetch Insight results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
