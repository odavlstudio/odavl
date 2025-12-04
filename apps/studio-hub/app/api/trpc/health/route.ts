/**
 * tRPC Health Check Endpoint
 *
 * Simple health check for tRPC router
 */

import { NextResponse } from 'next/server';
import { createSuccessResponse } from '@/lib/api';

export async function GET() {
  return createSuccessResponse({
    status: 'healthy',
    service: 'trpc',
    timestamp: new Date().toISOString(),
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
