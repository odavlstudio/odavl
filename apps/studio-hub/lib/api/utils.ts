/**
 * API Utilities - Shared helpers for API routes
 */

import { NextResponse } from 'next/server';
import { ZodSchema, z } from 'zod';

/**
 * API Error codes
 */
export const ApiErrors = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
} as const;

export type ApiErrorCode = typeof ApiErrors[keyof typeof ApiErrors];

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  status = 500,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

/**
 * Higher-order function for error handling in API routes
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof Error) {
        // Check for known error patterns
        if (error.message.includes('Unauthorized')) {
          return createErrorResponse(
            ApiErrors.UNAUTHORIZED,
            'Unauthorized',
            401
          );
        }
        if (error.message.includes('Forbidden')) {
          return createErrorResponse(
            ApiErrors.FORBIDDEN,
            'Forbidden',
            403
          );
        }
        if (error.message.includes('Not found')) {
          return createErrorResponse(
            ApiErrors.NOT_FOUND,
            'Resource not found',
            404
          );
        }
      }

      return createErrorResponse(
        ApiErrors.INTERNAL_ERROR,
        'Internal server error',
        500,
        process.env.NODE_ENV === 'development' ? error : undefined
      );
    }
  }) as T;
}

/**
 * Validate request body against Zod schema
 */
export async function validateRequestBody<T extends ZodSchema>(
  request: Request,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw new Error('Invalid request body');
  }
}

/**
 * Extract query parameters from URL
 */
export function getQueryParams(url: string): URLSearchParams {
  const urlObj = new URL(url);
  return urlObj.searchParams;
}

/**
 * Paginate results
 */
export function paginate<T>(
  items: T[],
  page: number = 1,
  limit: number = 10
): {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: items.slice(start, end),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
