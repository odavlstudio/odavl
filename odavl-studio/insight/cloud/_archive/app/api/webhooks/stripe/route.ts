/**
 * Stripe Webhook Handler
 * POST /api/webhooks/stripe
 * 
 * Handles Stripe webhook events for billing
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(req: NextRequest) {
  try {
    // Get webhook signature
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Get raw body
    const body = await req.text();

    // TODO: Verify webhook signature
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const event = stripe.webhooks.constructEvent(
    //   body,
    //   signature,
    //   process.env.STRIPE_WEBHOOK_SECRET!
    // );

    // TODO: Parse event type and handle
    // switch (event.type) {
    //   case 'customer.subscription.created':
    //   case 'customer.subscription.updated':
    //   case 'customer.subscription.deleted':
    //     // Update subscription in database
    //     break;
    //   case 'invoice.payment_succeeded':
    //   case 'invoice.payment_failed':
    //     // Handle payment events
    //     break;
    //   case 'customer.updated':
    //     // Update customer data
    //     break;
    //   default:
    //     console.log(`Unhandled event type: ${event.type}`);
    // }

    console.log('[Stripe Webhook] Received event (skeleton - not processed)');

    return NextResponse.json({
      success: true,
      message: 'Webhook skeleton - not yet implemented',
    });
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);

    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Disable body parsing for Stripe webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};
