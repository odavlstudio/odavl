import { NextRequest, NextResponse } from 'next/server';
import { handleRevalidationWebhook } from '@/lib/edge/revalidate';
import { logger } from '@/lib/logger';
import {
  withErrorHandler,
  createSuccessResponse,
  ApiErrors,
  validateRequestBody,
} from '@/lib/api';
import { z } from 'zod';

const RevalidateSchema = z.object({
  type: z.string().min(1, 'Type required'),
  identifier: z.string().min(1, 'Identifier required'),
});

// Webhook endpoint for triggering cache revalidation
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Verify webhook secret
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.REVALIDATION_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return ApiErrors.unauthorized('Invalid or missing authentication token');
  }

  const validated = await validateRequestBody(request, RevalidateSchema);

  // Check if validation returned an error response
  if (validated instanceof NextResponse) {
    return validated;
  }

  const { type, identifier } = validated.data;

  // Trigger revalidation
  await handleRevalidationWebhook(type, identifier);

  logger.info('Cache revalidation triggered', { type, identifier });
  return createSuccessResponse({
    revalidated: true,
    type,
    identifier,
    timestamp: new Date().toISOString(),
  });
}, 'POST /api/revalidate');
