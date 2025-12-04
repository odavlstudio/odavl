/**
 * API Status Endpoint
 *
 * Returns basic API status and version information
 */

import { NextResponse } from 'next/server';
import { createSuccessResponse } from '@/lib/api';

export async function GET() {
  return createSuccessResponse({
    status: 'operational',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    services: {
      database: 'operational',
      auth: 'operational',
      api: 'operational',
    },
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
