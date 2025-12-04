/**
 * Autopilot Runs API Route
 * POST /api/v1/autopilot/runs - Upload run data from CLI
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

    // Check scopes (requires autopilot:write)
    if (!verification.scopes?.includes('autopilot:write')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Required scope: autopilot:write' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { runId, workspacePath, timestamp, phases, ledger } = body;

    // Validate required fields
    if (!runId || !workspacePath || !timestamp || !phases) {
      return NextResponse.json(
        { error: 'Missing required fields: runId, workspacePath, timestamp, phases' },
        { status: 400 }
      );
    }

    // Extract workspace name
    const workspaceName = workspacePath.split(/[/\\]/).pop() || 'Unknown';

    // Store run in database
    const run = await prisma.autopilotCliRun.create({
      data: {
        userId: verification.userId!,
        orgId: verification.orgId || '',
        runId,
        workspacePath,
        workspaceName,
        phases,
        ledger: ledger || {},
        status: 'completed',
        timestamp: new Date(timestamp),
      },
    });

    // Track usage
    await trackUsage({
      userId: verification.userId || 'unknown',
      orgId: verification.orgId || '',
      product: 'autopilot',
      action: 'run',
      endpoint: '/api/v1/autopilot/runs',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      apiKeyId: verification.apiKeyId || 'unknown',
      credits: 1,
    });

    return NextResponse.json({
      success: true,
      id: run.id,
      message: 'Run uploaded successfully',
    });
  } catch (error: any) {
    console.error('Failed to upload Autopilot run:', error);
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
    if (!verification.scopes?.includes('autopilot:read')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Required scope: autopilot:read' },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Fetch runs
    const runs = await prisma.autopilotCliRun.findMany({
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
        runId: true,
        workspaceName: true,
        phases: true,
        status: true,
        timestamp: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      runs,
      count: runs.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Failed to fetch Autopilot runs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
