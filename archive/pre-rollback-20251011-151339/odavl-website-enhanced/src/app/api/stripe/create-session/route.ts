/**
 * Stripe Checkout Session API Route
 * Creates payment sessions for ODAVL Pro subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { pricingTiers } from '@/data/pricing';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('plan') || 'pro';
    
    // Check for required environment variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.warn('STRIPE_SECRET_KEY not configured. Returning mock session.');
      return NextResponse.json({
        error: 'Billing not configured',
        message: 'Stripe integration requires manual setup. Contact Mohammad for production keys.',
        mockSession: {
          id: 'mock_session_' + Date.now(),
          url: `/checkout-success?session=mock&plan=${planId}`
        }
      }, { status: 501 });
    }

    // Find the pricing tier
    const tier = pricingTiers.find(t => t.id === planId);
    if (!tier || tier.priceMonthly === 'custom') {
      return NextResponse.json({
        error: 'Invalid plan',
        message: 'Please select a valid pricing plan or contact sales for Enterprise.'
      }, { status: 400 });
    }

    // TODO: Replace with actual Stripe integration when keys are provided
    const mockSession = {
      id: 'cs_test_' + Math.random().toString(36).substring(7),
      url: `https://checkout.stripe.com/c/pay/mock_${planId}#${tier.priceMonthly}`,
      plan: tier.name,
      amount: tier.priceMonthly,
      currency: 'USD'
    };

    return NextResponse.json({ 
      sessionId: mockSession.id,
      url: mockSession.url 
    });

  } catch (error) {
    console.error('Stripe session creation error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Unable to create checkout session'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request); // Allow GET for testing
}