import { generateOpenAPISpec } from '@/lib/openapi/generator';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withErrorHandler, createSuccessResponse } from '@/lib/api';

/**
 * OpenAPI 3.0 Specification Endpoint
 *
 * Returns the complete API specification in JSON format.
 * Can be consumed by:
 * - Swagger UI: /api-docs
 * - Postman: Import as OpenAPI 3.0 collection
 * - Code generators: openapi-generator, swagger-codegen
 * - API testing tools
 *
 * @returns OpenAPI 3.0 JSON specification
 */
export const GET = withErrorHandler(async () => {
  const spec = generateOpenAPISpec();

  logger.info('OpenAPI spec generated successfully');
  return NextResponse.json(spec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*', // Allow CORS for API tools
    },
  });
}, 'GET /api/openapi');

/**
 * OPTIONS handler for CORS preflight
 */
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
