/**
 * Centralized API Error Handler
 *
 * Provides consistent error handling across all API routes
 * with proper logging, status codes, and response formatting.
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  CONFLICT = 'CONFLICT',
}

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  statusCode: number,
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details && { details }),
      },
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

/**
 * Handle API errors with automatic classification
 */
export function handleApiError(error: unknown, context?: string): NextResponse<ApiErrorResponse> {
  // Log error with context
  logger.error(`API Error${context ? ` in ${context}` : ''}`, error as Error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return createErrorResponse(
      ApiErrorCode.VALIDATION_ERROR,
      'Validation failed',
      400,
      error.errors
    );
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return createErrorResponse(
          ApiErrorCode.CONFLICT,
          'Resource already exists',
          409,
          { field: error.meta?.target }
        );
      case 'P2025': // Record not found
        return createErrorResponse(
          ApiErrorCode.NOT_FOUND,
          'Resource not found',
          404
        );
      case 'P2003': // Foreign key constraint
        return createErrorResponse(
          ApiErrorCode.BAD_REQUEST,
          'Invalid reference',
          400
        );
      default:
        return createErrorResponse(
          ApiErrorCode.INTERNAL_ERROR,
          'Database error',
          500
        );
    }
  }

  // Rate limit errors
  if (error instanceof Error && error.message.includes('rate limit')) {
    return createErrorResponse(
      ApiErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many requests',
      429
    );
  }

  // Generic errors
  if (error instanceof Error) {
    const message = error.message || 'Internal server error';

    // Don't expose internal error details in production
    const isProduction = process.env.NODE_ENV === 'production';
    const safeMessage = isProduction ? 'Internal server error' : message;

    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      safeMessage,
      500
    );
  }

  // Unknown errors
  return createErrorResponse(
    ApiErrorCode.INTERNAL_ERROR,
    'An unexpected error occurred',
    500
  );
}

/**
 * Async API route wrapper with automatic error handling
 */
export function withErrorHandler<T>(
  handler: (req: any, context?: any) => Promise<T>,
  context?: string
) {
  return async (req: any, routeContext?: any): Promise<NextResponse | T> => {
    try {
      return await handler(req, routeContext);
    } catch (error) {
      return handleApiError(error, context);
    }
  };
}

/**
 * Common error responses (shortcuts)
 */
export const ApiErrors = {
  unauthorized: (message = 'Authentication required') =>
    createErrorResponse(ApiErrorCode.UNAUTHORIZED, message, 401),

  forbidden: (message = 'Access denied') =>
    createErrorResponse(ApiErrorCode.FORBIDDEN, message, 403),

  notFound: (resource = 'Resource') =>
    createErrorResponse(ApiErrorCode.NOT_FOUND, `${resource} not found`, 404),

  badRequest: (message = 'Invalid request') =>
    createErrorResponse(ApiErrorCode.BAD_REQUEST, message, 400),

  conflict: (message = 'Resource already exists') =>
    createErrorResponse(ApiErrorCode.CONFLICT, message, 409),

  rateLimit: (message = 'Too many requests') =>
    createErrorResponse(ApiErrorCode.RATE_LIMIT_EXCEEDED, message, 429),

  internal: (message = 'Internal server error') =>
    createErrorResponse(ApiErrorCode.INTERNAL_ERROR, message, 500),
};
