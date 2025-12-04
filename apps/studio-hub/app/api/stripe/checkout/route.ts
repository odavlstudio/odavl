import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';
import {
  withErrorHandler,
  createSuccessResponse,
  ApiErrors,
  validateRequestBody,
  CommonSchemas,
} from '@/lib/api';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const PLAN_PRICE_IDS = {
  FREE: null,
  PRO: process.env.STRIPE_PRO_PRICE_ID!,
  ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
};

const CheckoutSchema = z.object({
  plan: z.enum(['PRO', 'ENTERPRISE']),
});

export const POST = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized('Authentication required');
  }

  const validated = await validateRequestBody(req, CheckoutSchema);

  // Check if validation returned an error response
  if (validated instanceof NextResponse) {
    return validated;
  }

  const { plan } = validated.data;

  const priceId = PLAN_PRICE_IDS[plan];
  if (!priceId) {
    return ApiErrors.internal('Price ID not configured');
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer_email: session.user.email!,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/settings/billing?canceled=true`,
    metadata: {
      userId: session.user.id,
      orgId: session.user.orgId!,
      plan,
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  });

  logger.info('Stripe checkout session created', { sessionId: checkoutSession.id, plan });
  return createSuccessResponse({ url: checkoutSession.url, sessionId: checkoutSession.id });
}, 'POST /api/stripe/checkout');

