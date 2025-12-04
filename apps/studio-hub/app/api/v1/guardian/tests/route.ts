/**
 * Guardian Tests API Route
 * POST /api/v1/guardian/tests - Upload test results from CLI
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiKey } from '@/lib/auth/api-key';
import { trackUsage } from '@/lib/usage/track';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again in 60 seconds.' },
        { status: 429 }
      );
    }

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

    // Check scopes (requires guardian:write)
    if (!verification.scopes.includes('guardian:write')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Required scope: guardian:write' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { productPath, productType, timestamp, readinessScore, status, issues, autoFixable } = body;

    // Validate required fields
    if (!productPath || !productType || !timestamp || readinessScore === undefined || !status || !issues) {
      return NextResponse.json(
        { error: 'Missing required fields: productPath, productType, timestamp, readinessScore, status, issues' },
        { status: 400 }
      );
    }

    // Extract product name
    const productName = productPath.split(/[/\\]/).pop() || 'Unknown';

    // Store test result in database
    const test = await prisma.guardianCliTest.create({
      data: {
        userId: verification.userId,
        orgId: verification.orgId,
        productPath,
        productName,
        productType,
        readinessScore,
        status,
        issues,
        autoFixable: autoFixable || 0,
        timestamp: new Date(timestamp),
      },
    });

    // Track usage
    await trackUsage({
      userId: verification.userId,
      orgId: verification.orgId,
      product: 'guardian',
      action: 'test',
      endpoint: '/api/v1/guardian/tests',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      apiKeyId: verification.apiKeyId,
      credits: 1,
    });

    return NextResponse.json({
      success: true,
      id: test.id,
      message: 'Test results uploaded successfully',
    });
  } catch (error: any) {
    console.error('Failed to upload Guardian test:', error);
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

    // Check scopes
    if (!verification.scopes.includes('guardian:read')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Required scope: guardian:read' },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Fetch tests
    const tests = await prisma.guardianCliTest.findMany({
      where: {
        userId: verification.userId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        productName: true,
        productType: true,
        readinessScore: true,
        status: true,
        autoFixable: true,
        timestamp: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      tests,
      count: tests.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Failed to fetch Guardian tests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
