import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { env, hasServerEnv } from '@/lib/env';
import { logger } from '@/lib/logger';
import { apiRateLimit } from '@/lib/rate-limit';
import {
  withErrorHandler,
  createSuccessResponse,
  ApiErrors,
  validateRequestBody,
} from '@/lib/api';

// Contact form schema validation
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Get client IP for rate limiting and logging
  const ip = request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              'unknown';

  // Apply rate limiting (100 requests per hour for API)
  const rateLimitResult = await apiRateLimit.limit(ip);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  // Parse and validate request body
  const validatedData = await validateRequestBody(request, contactSchema);

  // Check if validation returned an error response
  if (validatedData instanceof NextResponse) {
    return validatedData;
  }

  logger.info('Contact form submission received', {
    name: validatedData.data.name,
    email: validatedData.data.email,
    messageLength: validatedData.data.message.length,
    ip,
  });

  // Send email using Resend (if configured)
  if (hasServerEnv('RESEND_API_KEY')) {
    // TODO: Implement Resend email sending
    // See ROADMAP.md for implementation details
    logger.warn('Email service not yet implemented - contact submission stored in logs');
  }

  return createSuccessResponse({
    message: "Thank you for your message! We'll get back to you soon.",
    submittedAt: new Date().toISOString(),
  });
}, 'POST /api/contact');

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
