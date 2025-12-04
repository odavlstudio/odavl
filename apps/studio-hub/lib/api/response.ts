/**
 * API Response Utilities
 *
 * Standardized response formatting for API routes
 */

import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T = any> {
  data: T;
  timestamp: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: ApiSuccessResponse<T>['meta']
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    data,
    timestamp: new Date().toISOString(),
    ...(meta && { meta }),
  });
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): NextResponse<ApiSuccessResponse<T[]>> {
  return createSuccessResponse(items, {
    page,
    limit,
    total,
    hasMore: page * limit < total,
  });
}

/**
 * Create empty success response
 */
export function createNoContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Create created response (201)
 */
export function createCreatedResponse<T>(
  data: T,
  location?: string
): NextResponse<ApiSuccessResponse<T>> {
  const headers = location ? { Location: location } : undefined;

  return NextResponse.json(
    {
      data,
      timestamp: new Date().toISOString(),
    },
    { status: 201, headers }
  );
}

/**
 * Create accepted response (202) for async operations
 */
export function createAcceptedResponse(
  message: string,
  jobId?: string
): NextResponse<ApiSuccessResponse<{ message: string; jobId?: string }>> {
  return NextResponse.json(
    {
      data: {
        message,
        ...(jobId && { jobId }),
      },
      timestamp: new Date().toISOString(),
    },
    { status: 202 }
  );
}

/**
 * Common CORS headers for API routes
 */
export function getCorsHeaders(origin?: string) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  const isAllowed = origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin));

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleCorsPreflightRequest(req: Request): NextResponse | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin');
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(origin || undefined),
    });
  }
  return null;
}

/**
 * Add CORS headers to response
 */
export function withCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  const corsHeaders = getCorsHeaders(origin);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
