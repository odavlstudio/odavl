/**
 * Public API v1 - Insight Run
 * POST /api/v1/projects/:id/insight/run
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiKey } from '@/lib/api-auth';
import { trackUsage, UsageEventType } from '@/lib/usage-tracker';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify API key
  const apiKeyHeader = request.headers.get('x-api-key');
  if (!apiKeyHeader) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  const { userId, organizationId } = await verifyApiKey(apiKeyHeader);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  // Check rate limits
  // TODO: Implement rate limiting per API key

  const resolvedParams = await params;
  
  // Track usage
  await trackUsage(organizationId, userId, UsageEventType.INSIGHT_ANALYSIS, {
    projectId: resolvedParams.id,
  });

  // TODO: Trigger Insight analysis job
  const jobId = crypto.randomUUID();

  return NextResponse.json({
    jobId,
    status: 'queued',
    message: 'Insight analysis queued',
  });
}
