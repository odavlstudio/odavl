/**
 * API Request Validation Utilities
 *
 * Common validation helpers for API routes using Zod schemas
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';
import { ApiErrors } from './error-handler';

/**
 * Validate request body against Zod schema
 */
export async function validateRequestBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<{ data: z.infer<T> } | NextResponse> {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return { data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.badRequest('Validation failed');
    }
    return ApiErrors.badRequest('Invalid JSON');
  }
}

/**
 * Validate query parameters against Zod schema
 */
export function validateQueryParams<T extends z.ZodTypeAny>(
  url: URL,
  schema: T
): { data: z.infer<T> } | NextResponse {
  try {
    const params = Object.fromEntries(url.searchParams.entries());
    const data = schema.parse(params);
    return { data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.badRequest('Invalid query parameters');
    }
    return ApiErrors.badRequest('Validation failed');
  }
}

/**
 * Common validation schemas
 */
export const CommonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),

  // Date range
  dateRange: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),

  // ID parameter
  id: z.object({
    id: z.string().uuid(),
  }),

  // Search
  search: z.object({
    q: z.string().min(1).max(200),
  }),

  // Sorting
  sort: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
};

/**
 * Extract and validate pagination params
 */
export function getPaginationParams(url: URL) {
  const result = validateQueryParams(url, CommonSchemas.pagination);

  if ('data' in result) {
    const { page, limit } = result.data;
    return {
      skip: (page - 1) * limit,
      take: limit,
      page,
      limit,
    };
  }

  return { skip: 0, take: 20, page: 1, limit: 20 };
}

/**
 * Validate required environment variables
 */
export function requireEnvVar(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

/**
 * Check if request method is allowed
 */
export function validateMethod(req: Request, allowed: string[]): NextResponse | null {
  if (!allowed.includes(req.method)) {
    return NextResponse.json(
      { error: `Method ${req.method} not allowed` },
      { status: 405, headers: { Allow: allowed.join(', ') } }
    );
  }
  return null;
}
