import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  withErrorHandler,
  createSuccessResponse,
  ApiErrors,
  validateRequestBody,
} from '@/lib/api';
import { http } from '@/lib/utils/fetch';

// Newsletter subscription schema
const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Rate limiting (simple in-memory store - use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 3; // 3 requests
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              'unknown';

  // Check rate limit
  if (!checkRateLimit(ip)) {
    return ApiErrors.rateLimit('Too many subscription attempts. Please try again later.');
  }

  // Parse and validate request body
  const validated = await validateRequestBody(request, newsletterSchema);

  // Check if validation returned an error response
  if (validated instanceof NextResponse) {
    return validated;
  }

    // TODO: Integrate with your email service provider
    // Options:
    // - Resend: https://resend.com
    // - Mailchimp: https://mailchimp.com
    // - ConvertKit: https://convertkit.com
    // - SendGrid: https://sendgrid.com

    // Example with Resend (if you choose this):
    /*
    import { Resend } from 'resend';
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.contacts.create({
      email: validatedData.email,
      audienceId: process.env.RESEND_AUDIENCE_ID!,
    });
    */

  // For now, just log it (replace with actual API call)
  logger.info('Newsletter subscription', {
    email: validated.data.email,
    timestamp: new Date().toISOString(),
    ip,
    source: 'website',
  });

  // TODO: Send welcome email (double opt-in)
  // This should trigger a confirmation email with a verification link

  // TODO: Send Slack notification
  // Optional: notify team of new subscription
  const slackWebhook = process.env.SLACK_WEBHOOK;
  if (slackWebhook) {
    try {
      await http.post(slackWebhook, {
        text: `📬 New Newsletter Subscription: ${validated.data.email}`,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      logger.error('Failed to send Slack notification', { error });
    }
  }

  return createSuccessResponse({
    message: 'Successfully subscribed! Check your email to confirm your subscription.',
    email: validated.data.email,
  });
}, 'POST /api/newsletter');

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
