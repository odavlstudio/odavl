/**
 * Swagger API Documentation Endpoint
 * Returns OpenAPI spec as JSON at /api/swagger
 */

import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/swagger/spec';

export async function GET() {
  return NextResponse.json(swaggerSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
