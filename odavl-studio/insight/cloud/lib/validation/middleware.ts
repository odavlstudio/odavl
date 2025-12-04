/**
 * Validation Middleware
 * Helper functions for request validation with Zod
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Validation error response structure
 */
interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate request body against a Zod schema
 * Returns validated data or error response
 */
export async function validateRequestBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: NextResponse }> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Validation failed',
            details: errors,
          },
          { status: 400 }
        ),
      };
    }

    // Handle JSON parse errors
    return {
      success: false,
      error: NextResponse.json(
        {
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate query parameters against a Zod schema
 * Returns validated data or error details
 */
export function validateQueryParams<T extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; errors: ValidationError[] } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const validated = schema.parse(params);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Invalid query parameters' }],
    };
  }
}

/**
 * Higher-order function to wrap route handlers with validation
 * Usage:
 * 
 * export const POST = withValidation(loginSchema, async (data) => {
 *   // data is typed and validated
 *   const { email, password } = data;
 *   // ...
 * });
 */
export function withValidation<T extends z.ZodType>(
  schema: T,
  handler: (data: z.infer<T>, request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const validation = await validateRequestBody(request, schema);

    if (!validation.success) {
      return validation.error;
    }

    try {
      return await handler(validation.data, request);
    } catch (error) {
      console.error('Handler error:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Sanitize string input to prevent XSS
 * Removes dangerous HTML tags and JavaScript
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * Sanitize object recursively
 * Applies sanitizeString to all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else if (value && typeof value === 'object') {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Check if email domain is allowed
 * Can be extended to block disposable email providers
 */
export function isEmailDomainAllowed(email: string): boolean {
  const blockedDomains = [
    'tempmail.com',
    'guerrillamail.com',
    '10minutemail.com',
    'mailinator.com',
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  return !blockedDomains.includes(domain);
}

/**
 * Validate password strength beyond basic requirements
 * Returns detailed feedback
 */
export function validatePasswordStrength(password: string): {
  isStrong: boolean;
  feedback: string[];
} {
  const feedback: string[] = [];

  if (password.length < 12) {
    feedback.push('Consider using at least 12 characters for better security');
  }

  if (!/[A-Z].*[A-Z]/.test(password)) {
    feedback.push('Consider using multiple uppercase letters');
  }

  if (!/[0-9].*[0-9]/.test(password)) {
    feedback.push('Consider using multiple numbers');
  }

  const commonPasswords = ['Password123!', 'Welcome123!', 'Admin123!'];
  if (commonPasswords.some((common) => password.includes(common))) {
    feedback.push('Password is too common, try something more unique');
  }

  return {
    isStrong: feedback.length === 0,
    feedback,
  };
}
