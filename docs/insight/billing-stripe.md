# ODAVL Insight - Stripe Billing Integration

> **Last Updated**: December 11, 2025  
> **Phase**: 2 - Stripe Mapping & Billing API  
> **Status**: Implementation Complete, Awaiting Production IDs

## Overview

This document describes how ODAVL Insight plans map to Stripe products and prices, and how to configure Stripe for billing operations.

## Architecture

### Three-Layer Separation

```
Layer 1: Product Config (insight-product.ts)
         ↓ Plan definitions, limits, features
Layer 2: Stripe Mapping (stripe-insight-mapping.ts)
         ↓ InsightPlanId → Stripe product/price IDs
Layer 3: Billing API (insight-billing.ts)
         ↓ Checkout, portal, webhooks
```

**Critical Design Principles**:
- **Single Stripe Client**: All modules use shared `stripe` from `@odavl-studio/billing`
- **No Duplication**: Never create `new Stripe()` elsewhere in codebase
- **Environment-Driven**: Stripe IDs from env vars (staging/production separation)
- **Server-Side Only**: Stripe secret keys never exposed to client or extensions

## Stripe Product Setup

### Step 1: Create Products in Stripe Dashboard

Go to: https://dashboard.stripe.com/products

Create 4 products:

#### 1. ODAVL Insight - Free

- **Name**: ODAVL Insight Free
- **Description**: Perfect for individual developers and learning
- **Pricing**:
  - Monthly: $0
  - Yearly: $0
- **Metadata**:
  ```json
  {
    "plan_id": "INSIGHT_FREE",
    "product": "insight",
    "max_projects": "3",
    "max_detectors": "3"
  }
  ```

#### 2. ODAVL Insight - Pro ⭐

- **Name**: ODAVL Insight Pro
- **Description**: For professional developers and consultants
- **Pricing**:
  - Monthly: $29.00
  - Yearly: $290.00 (17% discount)
- **Metadata**:
  ```json
  {
    "plan_id": "INSIGHT_PRO",
    "product": "insight",
    "max_projects": "10",
    "max_detectors": "11",
    "cloud_enabled": "true"
  }
  ```

#### 3. ODAVL Insight - Team

- **Name**: ODAVL Insight Team
- **Description**: For growing teams and agencies
- **Pricing**:
  - Monthly: $99.00
  - Yearly: $990.00 (17% discount)
- **Metadata**:
  ```json
  {
    "plan_id": "INSIGHT_TEAM",
    "product": "insight",
    "max_projects": "50",
    "max_detectors": "14",
    "team_enabled": "true"
  }
  ```

#### 4. ODAVL Insight - Enterprise

- **Name**: ODAVL Insight Enterprise
- **Description**: For large organizations with compliance needs
- **Pricing**:
  - Monthly: $299.00
  - Yearly: $2990.00 (17% discount)
- **Metadata**:
  ```json
  {
    "plan_id": "INSIGHT_ENTERPRISE",
    "product": "insight",
    "max_projects": "-1",
    "max_detectors": "15",
    "sso_enabled": "true",
    "audit_enabled": "true"
  }
  ```

### Step 2: Copy Product & Price IDs

After creating products and prices, copy the IDs:

```
Product IDs:
- prod_xxxxxxxxxxxxx (Free)
- prod_xxxxxxxxxxxxx (Pro)
- prod_xxxxxxxxxxxxx (Team)
- prod_xxxxxxxxxxxxx (Enterprise)

Price IDs:
- price_xxxxxxxxxxxxx (Free Monthly)
- price_xxxxxxxxxxxxx (Free Yearly)
- price_xxxxxxxxxxxxx (Pro Monthly)
- price_xxxxxxxxxxxxx (Pro Yearly)
- price_xxxxxxxxxxxxx (Team Monthly)
- price_xxxxxxxxxxxxx (Team Yearly)
- price_xxxxxxxxxxxxx (Enterprise Monthly)
- price_xxxxxxxxxxxxx (Enterprise Yearly)
```

### Step 3: Set Environment Variables

#### Development (`.env.local`)

```bash
# Stripe Secret Key (Test Mode)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Webhook Secret (Test Mode)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Insight Product IDs (Test Mode)
STRIPE_INSIGHT_FREE_PRODUCT_ID=prod_xxxxxxxxxxxxx
STRIPE_INSIGHT_PRO_PRODUCT_ID=prod_xxxxxxxxxxxxx
STRIPE_INSIGHT_TEAM_PRODUCT_ID=prod_xxxxxxxxxxxxx
STRIPE_INSIGHT_ENTERPRISE_PRODUCT_ID=prod_xxxxxxxxxxxxx

# Insight Price IDs - Free (Test Mode)
STRIPE_INSIGHT_FREE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_INSIGHT_FREE_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx

# Insight Price IDs - Pro (Test Mode)
STRIPE_INSIGHT_PRO_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_INSIGHT_PRO_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx

# Insight Price IDs - Team (Test Mode)
STRIPE_INSIGHT_TEAM_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_INSIGHT_TEAM_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx

# Insight Price IDs - Enterprise (Test Mode)
STRIPE_INSIGHT_ENTERPRISE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_INSIGHT_ENTERPRISE_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
```

#### Production (Environment Variables in Vercel/Railway/etc.)

Same variables as above, but use **live mode** keys from Stripe:
- `sk_live_xxxxx` instead of `sk_test_xxxxx`
- `whsec_xxxxx` for live webhook secret
- Live product/price IDs

## Code Usage

### Import Pattern (CRITICAL)

**✅ CORRECT** - Always import from `@odavl-studio/billing`:

```typescript
import { stripe } from '@odavl-studio/billing';
import { 
  createInsightCheckoutSession,
  handleInsightBillingWebhook 
} from '@odavl-studio/billing/insight';
import { 
  getStripePriceId,
  getInsightPlanFromStripePriceId 
} from '@odavl-studio/billing/stripe-mapping';
```

**❌ WRONG** - Never create new Stripe instances:

```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!); // ❌ DON'T DO THIS
```

### Create Checkout Session (Next.js API Route)

```typescript
// app/api/insight/checkout/route.ts
import { NextResponse } from 'next/server';
import { createInsightCheckoutSession } from '@odavl-studio/billing/insight';
import { getServerSession } from 'next-auth';

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { planId, billingCycle } = await req.json();

  try {
    const checkout = await createInsightCheckoutSession(
      session.user.id,
      planId,
      billingCycle,
      {
        customerEmail: session.user.email!,
        successUrl: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
        cancelUrl: `${process.env.NEXTAUTH_URL}/pricing`,
        trialDays: 30,
        allowPromotionCodes: true,
      }
    );

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

### Handle Webhooks (Next.js API Route)

```typescript
// app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@odavl-studio/billing';
import { handleInsightBillingWebhook } from '@odavl-studio/billing/insight';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature')!;

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    );

    // Process Insight billing events
    const result = await handleInsightBillingWebhook(event);

    if (result.processed) {
      console.log(`Processed ${result.eventType}:`, {
        planId: result.planId,
        subscriptionId: result.subscriptionId,
      });

      // TODO: Update database with subscription changes
      // await prisma.user.update({
      //   where: { stripeCustomerId: result.customerId },
      //   data: {
      //     insightPlanId: result.planId,
      //     stripeSubscriptionId: result.subscriptionId,
      //   },
      // });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 400 }
    );
  }
}
```

### Customer Portal (Self-Service Billing)

```typescript
// app/api/insight/portal/route.ts
import { NextResponse } from 'next/server';
import { createInsightCustomerPortalSession } from '@odavl-studio/billing/insight';
import { getServerSession } from 'next-auth';

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account' }, { status: 400 });
  }

  try {
    const portal = await createInsightCustomerPortalSession(
      session.user.stripeCustomerId,
      `${process.env.NEXTAUTH_URL}/dashboard/billing`
    );

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
```

### Get Subscription Details

```typescript
import { getInsightSubscription } from '@odavl-studio/billing/insight';

const subscription = await getInsightSubscription(subscriptionId);

if (subscription) {
  console.log('Plan:', subscription.planId);
  console.log('Status:', subscription.status);
  console.log('Billing:', subscription.billingCycle);
  console.log('Renews:', subscription.currentPeriodEnd);
  console.log('Trial ends:', subscription.trialEnd);
}
```

### Cancel Subscription

```typescript
import { cancelInsightSubscription } from '@odavl-studio/billing/insight';

// Cancel at period end (recommended)
await cancelInsightSubscription(subscriptionId, false);

// Cancel immediately (use with caution)
await cancelInsightSubscription(subscriptionId, true);
```

## Webhook Configuration

### Step 1: Add Webhook Endpoint in Stripe

Go to: https://dashboard.stripe.com/webhooks

**For Staging/Production**:
- **Endpoint URL**: `https://your-app.com/api/webhooks/stripe`
- **Description**: ODAVL Insight Billing Webhooks
- **Events to Send**:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

**For Local Development** (use Stripe CLI):

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy webhook secret (starts with whsec_) and add to .env.local
```

### Step 2: Test Webhook

```bash
# Trigger test event
stripe trigger checkout.session.completed

# Or test with real data
stripe trigger checkout.session.completed --add customer:metadata.product=insight
```

## Testing Checkout Flow

### Test Mode Credit Cards

Use these test cards in Stripe test mode:

| Card Number | Description | Expected Result |
|-------------|-------------|-----------------|
| `4242 4242 4242 4242` | Visa | Payment succeeds |
| `4000 0000 0000 0341` | Visa | Payment fails (card declined) |
| `4000 0025 0000 3155` | Visa | Payment requires 3D Secure |

**Expiry**: Any future date (e.g., 12/34)  
**CVC**: Any 3 digits (e.g., 123)  
**ZIP**: Any 5 digits (e.g., 12345)

### Test Checkout Flow

1. **Start Checkout**:
   ```bash
   curl -X POST http://localhost:3000/api/insight/checkout \
     -H "Content-Type: application/json" \
     -d '{"planId": "INSIGHT_PRO", "billingCycle": "monthly"}'
   ```

2. **Complete Payment**: Open returned URL, enter test card

3. **Verify Webhook**: Check webhook endpoint logs for `checkout.session.completed`

4. **Check Subscription**: Query Stripe dashboard for new subscription

## Production Checklist

Before deploying to production:

- [ ] All environment variables set with **live mode** keys
- [ ] Webhook endpoint deployed and accessible
- [ ] Webhook secret configured (live mode)
- [ ] All 4 products created in Stripe (live mode)
- [ ] All 8 prices created (monthly + yearly for each plan)
- [ ] Product/price IDs added to environment variables
- [ ] Test checkout with real card in test mode
- [ ] Verify webhook events are processed correctly
- [ ] Database schema supports storing:
  - `stripeCustomerId` (string)
  - `stripeSubscriptionId` (string)
  - `insightPlanId` (InsightPlanId enum)
  - `billingCycle` ('monthly' | 'yearly')
  - `subscriptionStatus` (string)
  - `currentPeriodEnd` (DateTime)
- [ ] Error monitoring configured (Sentry, Datadog, etc.)
- [ ] Alert on failed payments
- [ ] Email templates for:
  - Subscription started
  - Payment succeeded
  - Payment failed
  - Trial ending soon
  - Subscription canceled

## Troubleshooting

### Error: "Stripe is not configured"

**Cause**: `STRIPE_SECRET_KEY` not set in environment

**Solution**:
```bash
# Add to .env.local
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Error: "Webhook verification failed"

**Cause**: `STRIPE_WEBHOOK_SECRET` missing or incorrect

**Solution**:
1. Get webhook secret from Stripe Dashboard → Webhooks
2. Add to environment: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`
3. Restart server

### Error: "Price ID not configured"

**Cause**: Product/price IDs not set in environment

**Solution**:
1. Create products in Stripe Dashboard
2. Copy product/price IDs
3. Add all 12 environment variables (see Step 3 above)

### Webhook Not Received

**Cause**: Webhook endpoint not accessible or Stripe not configured

**Solution**:
1. Check endpoint is deployed: `curl https://your-app.com/api/webhooks/stripe`
2. Verify webhook is registered in Stripe Dashboard
3. Check server logs for errors
4. Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Payment Fails in Test Mode

**Cause**: Using live mode keys with test card, or vice versa

**Solution**:
1. Verify `STRIPE_SECRET_KEY` starts with `sk_test_` (test mode)
2. Use test cards from Stripe docs
3. Check Stripe Dashboard → Developers → Logs for details

## Future Enhancements

### Phase 3: Metered Billing

Add usage-based pricing for overages:

```typescript
// packages/billing/src/stripe-insight-mapping.ts
export interface StripeInsightMapping {
  // ... existing fields
  meteredPriceId: string; // e.g., $0.10 per extra project
}

// Usage tracking
await stripe.subscriptionItems.createUsageRecord(
  subscriptionItemId,
  {
    quantity: projectCount,
    timestamp: Math.floor(Date.now() / 1000),
  }
);
```

### Phase 4: Coupons & Promotions

```typescript
// Create checkout with coupon
await createInsightCheckoutSession(userId, planId, billingCycle, {
  // ... existing options
  allowPromotionCodes: true,
  discounts: [{ coupon: 'LAUNCH50' }], // 50% off first month
});
```

### Phase 5: Team Licenses

Add seat-based pricing for INSIGHT_TEAM:

```typescript
// Team plan with 10 seats
await stripe.checkout.sessions.create({
  // ... existing params
  line_items: [
    {
      price: priceId,
      quantity: 10, // Number of seats
    },
  ],
});
```

## Related Documentation

- [Insight Product Config](./product-config.md) - Plan definitions and entitlements
- [Stripe API Docs](https://stripe.com/docs/api) - Official Stripe documentation
- [Webhook Guide](https://stripe.com/docs/webhooks) - Stripe webhook best practices

---

**Maintainers**: @product-team @billing-team  
**Last Review**: December 11, 2025  
**Next Review**: Before production launch
