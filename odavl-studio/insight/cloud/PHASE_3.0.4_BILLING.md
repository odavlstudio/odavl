# Phase 3.0.4: Billing & Payments (EU-first)

**Status**: ✅ COMPLETE  
**Date**: December 2025  
**Integration**: Stripe (EU-compliant)

## Overview

Phase 3.0.4 implements paid subscriptions for ODAVL Insight using Stripe, with a focus on EU/Germany compliance. This phase enables:

- **Checkout Sessions**: Users can upgrade to PRO/TEAM plans
- **Webhook Processing**: Automatic subscription management via Stripe webhooks
- **EU Compliance**: German locale, SEPA debit, required billing addresses
- **Backend-only**: No UI components (API-only for this phase)

## Architecture

### Payment Flow

```
┌──────────────┐
│   Browser    │
│ (user clicks │
│   upgrade)   │
└──────┬───────┘
       │
       │ POST /api/billing/checkout
       ▼
┌──────────────────┐
│  Checkout API    │  ← JWT Authentication
│ (create session) │
└──────┬───────────┘
       │
       │ Returns checkout URL
       ▼
┌──────────────────┐
│  Stripe Checkout │  ← User enters payment
│    (hosted)      │
└──────┬───────────┘
       │
       │ Webhook: checkout.session.completed
       ▼
┌──────────────────┐
│  Webhook API     │  ← Signature verification
│ (upgrade user)   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│    Database      │  ← Subscription updated
│  (Prisma/SQLite) │     User.plan = PRO
└──────────────────┘
```

### Database Schema

```prisma
model Subscription {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Phase 3.0.1: Monetization Core
  tier      SubscriptionTier
  status    SubscriptionStatus

  // Phase 3.0.4: Stripe Integration
  stripeCustomerId         String? @unique
  stripeSubscriptionId     String? @unique
  stripePriceId            String?
  stripeCheckoutSessionId  String? @unique

  // Dates
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelledAt        DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  // Limits
  maxProjects           Int
  maxAnalysesPerMonth   Int
  maxStorageGB          Int

  @@index([stripeCustomerId])
  @@index([stripeSubscriptionId])
}
```

## Subscription Plans

### FREE (Default)
- **Price**: €0/month
- **Limits**:
  - 3 projects
  - 10 analyses/month
  - 1 GB storage
- **Payment**: None (self-service)

### PRO
- **Price**: €29/month
- **Limits**:
  - 10 projects
  - 100 analyses/month
  - 10 GB storage
- **Payment**: Stripe subscription
- **Price ID**: `STRIPE_PRICE_ID_PRO` (env var)

### TEAM
- **Price**: €99/month
- **Limits**:
  - 50 projects
  - 500 analyses/month
  - 100 GB storage
- **Payment**: Stripe subscription
- **Price ID**: `STRIPE_PRICE_ID_TEAM` (env var)

### ENTERPRISE
- **Price**: Custom
- **Limits**: Unlimited
- **Payment**: Manual/invoicing (not Stripe)
- **Contact**: Sales team for pricing

## API Endpoints

### POST /api/billing/checkout

Create a Stripe Checkout Session for subscription purchase.

**Authentication**: Required (JWT token)

**Request Body**:
```json
{
  "tier": "PRO"  // or "TEAM"
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Response (Errors)**:
```json
// 400 - Invalid tier
{
  "success": false,
  "error": "INVALID_TIER",
  "message": "Tier must be PRO or TEAM"
}

// 409 - Already subscribed
{
  "success": false,
  "error": "ALREADY_SUBSCRIBED",
  "message": "User already has an active subscription"
}

// 500 - Checkout failed
{
  "success": false,
  "error": "CHECKOUT_FAILED",
  "message": "Failed to create checkout session"
}
```

**Example Usage**:
```bash
curl -X POST https://insight.odavl.studio/api/billing/checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tier":"PRO"}'
```

### POST /api/billing/webhooks

Stripe webhook endpoint for subscription lifecycle events.

**Authentication**: Webhook signature verification (no JWT)

**Events Handled**:
- `checkout.session.completed` - Payment successful, upgrade user
- `customer.subscription.updated` - Subscription modified (tier change, status change)
- `customer.subscription.deleted` - Subscription cancelled, downgrade to FREE

**Response**:
```json
{
  "received": true
}
```

**Webhook Configuration**:
```
URL: https://your-domain.com/api/billing/webhooks
Events: checkout.session.completed
        customer.subscription.updated
        customer.subscription.deleted
Secret: whsec_xxxxxxxxxxxxxxxxxxxxx
```

## Environment Variables

### Required

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_... # From Stripe webhook settings

# JWT Authentication (from Phase 3.0.3)
JWT_SECRET=your-secure-random-secret-32chars

# Application URL (for checkout redirects)
NEXT_PUBLIC_APP_URL=https://insight.odavl.studio

# Database (SQLite for dev, PostgreSQL for production)
DATABASE_URL=file:./dev.db
```

### Optional

```bash
# Stripe Price IDs (defaults to test mode if not provided)
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_TEAM=price_xxxxxxxxxxxxx
```

## EU Compliance

### Features

1. **German Locale**: All Stripe interactions use `locale: 'de'`
2. **SEPA Debit**: Supports SEPA Direct Debit for EU bank accounts
3. **Billing Address**: Required for all purchases (EU regulation)
4. **Payment Methods**: Card and SEPA debit supported
5. **Currency**: EUR (Euro) for all transactions

### Configuration

```typescript
// lib/billing/stripe.ts
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
  appInfo: {
    name: 'ODAVL Insight',
    version: '3.0.4',
    url: 'https://insight.odavl.studio',
  },
});

// app/api/billing/checkout/route.ts
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  mode: 'subscription',
  payment_method_types: ['card', 'sepa_debit'], // EU methods
  locale: 'de', // German
  billing_address_collection: 'required', // EU requirement
  line_items: [{ price: plan.priceId, quantity: 1 }],
  success_url: CHECKOUT_URLS.success,
  cancel_url: CHECKOUT_URLS.cancel,
  metadata: { userId, tier },
});
```

## Webhook Event Handling

### checkout.session.completed

**Triggered**: When user completes payment on Stripe Checkout

**Actions**:
1. Extract `userId` and `tier` from session metadata
2. Retrieve Stripe subscription details
3. Get price ID and map to plan tier
4. Upsert Subscription record:
   - Set tier, status, Stripe IDs
   - Set subscription period (start/end)
   - Set plan limits (projects, analyses, storage)
5. Update `User.plan` field
6. Log successful upgrade

**Example Event**:
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_...",
      "customer": "cus_...",
      "subscription": "sub_...",
      "payment_status": "paid",
      "metadata": {
        "userId": "user-123",
        "tier": "PRO"
      }
    }
  }
}
```

### customer.subscription.updated

**Triggered**: When subscription is modified (tier change, status change)

**Actions**:
1. Extract `userId` from subscription metadata
2. Get price ID and map to plan tier
3. Update Subscription record:
   - Update tier if changed
   - Update status (active/cancelled)
   - Update period start/end
   - Update plan limits
   - Set `cancelledAt` if status is cancelled
4. Update `User.plan` field if tier changed
5. Log subscription update

**Example Event**:
```json
{
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_...",
      "customer": "cus_...",
      "status": "active",
      "items": {
        "data": [
          {
            "price": { "id": "price_..." }
          }
        ]
      },
      "current_period_start": 1703001600,
      "current_period_end": 1705593600,
      "metadata": {
        "userId": "user-123"
      }
    }
  }
}
```

### customer.subscription.deleted

**Triggered**: When subscription is permanently deleted

**Actions**:
1. Extract `userId` from subscription metadata
2. Downgrade to FREE tier:
   - Set tier to 'FREE'
   - Set status to 'cancelled'
   - Set `cancelledAt` timestamp
   - Reset limits to FREE values (3 projects, 10 analyses, 1 GB)
3. Update `User.plan` to 'FREE'
4. Log downgrade

**Example Event**:
```json
{
  "type": "customer.subscription.deleted",
  "data": {
    "object": {
      "id": "sub_...",
      "customer": "cus_...",
      "status": "canceled",
      "canceled_at": 1703001600,
      "metadata": {
        "userId": "user-123"
      }
    }
  }
}
```

## Security Features

### Webhook Signature Verification

All webhook requests are verified using Stripe's signature verification:

```typescript
const signature = req.headers.get('stripe-signature');
if (!signature) {
  return NextResponse.json(
    { error: 'No signature provided' },
    { status: 400 }
  );
}

const event = stripe.webhooks.constructEvent(
  body,
  signature,
  STRIPE_WEBHOOK_SECRET
);
```

If signature verification fails:
- Returns 401 Unauthorized
- Logs error for audit trail
- Does NOT process event

### Idempotency

Webhook handlers use `upsert` operations to prevent duplicate subscriptions:

```typescript
// checkout.session.completed handler
await prisma.subscription.upsert({
  where: { userId },
  create: { ...newSubscription },
  update: { ...updatedFields },
});
```

This ensures:
- Duplicate webhook events don't create multiple subscriptions
- Subscription state is always consistent
- No race conditions between webhook events

### Authentication

- **Checkout Endpoint**: Protected with `withAuth` HOF (JWT authentication from Phase 3.0.3)
- **Webhook Endpoint**: No JWT required, uses Stripe signature verification instead

## Testing

### Unit Tests

**Checkout Endpoint** (`tests/unit/billing/checkout.test.ts`):
- ✅ Authentication validation
- ✅ Tier validation (PRO/TEAM only)
- ✅ Existing subscription check (409 if already subscribed)
- ✅ Stripe customer creation
- ✅ Stripe customer reuse
- ✅ Checkout session creation
- ✅ EU compliance (German locale, SEPA, billing address)

**Webhook Handler** (`tests/unit/billing/webhooks.test.ts`):
- ✅ Signature verification (valid/invalid)
- ✅ checkout.session.completed (upgrade user)
- ✅ customer.subscription.updated (update subscription)
- ✅ customer.subscription.deleted (downgrade to FREE)
- ✅ Idempotency (duplicate events)
- ✅ Missing metadata handling
- ✅ Unhandled event types (graceful ignore)

### Manual Testing with Stripe CLI

**Install Stripe CLI**:
```bash
# Windows (Scoop)
scoop install stripe

# macOS (Homebrew)
brew install stripe/stripe-cli/stripe

# Linux (Direct download)
wget https://github.com/stripe/stripe-cli/releases/download/vX.X.X/stripe_X.X.X_linux_x86_64.tar.gz
tar -xvf stripe_X.X.X_linux_x86_64.tar.gz
```

**Login to Stripe**:
```bash
stripe login
```

**Forward Webhooks to Local Dev**:
```bash
stripe listen --forward-to localhost:3000/api/billing/webhooks
```

**Trigger Test Events**:
```bash
# Successful payment
stripe trigger checkout.session.completed

# Subscription updated
stripe trigger customer.subscription.updated

# Subscription cancelled
stripe trigger customer.subscription.deleted
```

**Create Test Checkout Session**:
```bash
# Get JWT token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.token')

# Create checkout session
curl -X POST http://localhost:3000/api/billing/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tier":"PRO"}'
```

## Deployment Checklist

### 1. Stripe Account Setup

- [ ] Create Stripe account (or use existing)
- [ ] Set region to EU/Germany
- [ ] Enable EUR currency
- [ ] Enable SEPA Direct Debit payment method
- [ ] Complete business verification (for live mode)

### 2. Create Products

- [ ] Create PRO product (€29/month recurring)
  - Name: "ODAVL Insight PRO"
  - Price: €29/month
  - Copy Price ID → `STRIPE_PRICE_ID_PRO`
- [ ] Create TEAM product (€99/month recurring)
  - Name: "ODAVL Insight TEAM"
  - Price: €99/month
  - Copy Price ID → `STRIPE_PRICE_ID_TEAM`

### 3. Configure Webhooks

- [ ] Go to Stripe Dashboard → Developers → Webhooks
- [ ] Create webhook endpoint:
  - URL: `https://insight.odavl.studio/api/billing/webhooks`
  - Events:
    - `checkout.session.completed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
- [ ] Copy Signing Secret → `STRIPE_WEBHOOK_SECRET`

### 4. Environment Variables

- [ ] Set `STRIPE_SECRET_KEY` (use test key for staging, live key for production)
- [ ] Set `STRIPE_WEBHOOK_SECRET` (from webhook settings)
- [ ] Set `STRIPE_PRICE_ID_PRO` (from product creation)
- [ ] Set `STRIPE_PRICE_ID_TEAM` (from product creation)
- [ ] Set `NEXT_PUBLIC_APP_URL` (production domain)
- [ ] Verify `JWT_SECRET` is set (from Phase 3.0.3)

### 5. Database Migration

```bash
cd odavl-studio/insight/cloud
pnpm db:push
```

This applies the Stripe fields to the Subscription model.

### 6. Testing

- [ ] Run unit tests: `pnpm test tests/unit/billing/`
- [ ] Test checkout creation with Stripe CLI
- [ ] Test webhook processing with Stripe CLI
- [ ] Complete end-to-end payment flow in test mode
- [ ] Verify subscription upgrade in database
- [ ] Verify subscription downgrade on cancellation

### 7. Production Deployment

- [ ] Switch from test keys to live keys
- [ ] Update webhook URL to production domain
- [ ] Monitor Stripe Dashboard for webhook delivery
- [ ] Monitor application logs for errors
- [ ] Test live payment flow with real payment method
- [ ] Verify live webhook processing

## Troubleshooting

### Webhook Not Received

**Symptom**: Stripe sends webhook, but application doesn't process it

**Checks**:
1. Verify `STRIPE_WEBHOOK_SECRET` is correct
2. Check webhook endpoint URL is correct (`/api/billing/webhooks`)
3. Check webhook events are enabled in Stripe Dashboard
4. Check application logs for signature verification errors
5. Use Stripe CLI to test locally: `stripe listen --forward-to localhost:3000/api/billing/webhooks`

### Signature Verification Failed

**Symptom**: Webhook returns 401 Unauthorized

**Checks**:
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. Check webhook secret is not expired (rotate if needed)
3. Check request body is not modified (e.g., by middleware)
4. Check raw request body is passed to `constructEvent()`

### Checkout Session Creation Failed

**Symptom**: POST /api/billing/checkout returns 500 error

**Checks**:
1. Verify `STRIPE_SECRET_KEY` is correct
2. Check price ID exists in Stripe Dashboard
3. Check Stripe account has EUR currency enabled
4. Check SEPA Direct Debit is enabled (for EU customers)
5. Check application logs for Stripe API errors

### User Not Upgraded After Payment

**Symptom**: User pays but subscription not activated

**Checks**:
1. Check Stripe Dashboard → Events for `checkout.session.completed`
2. Check webhook delivery status (successful/failed)
3. Check application logs for webhook processing errors
4. Check database for Subscription record (should have `stripeSubscriptionId`)
5. Check User.plan field (should be updated to PRO/TEAM)
6. Manually trigger webhook with Stripe CLI: `stripe trigger checkout.session.completed`

### Subscription Not Downgraded on Cancellation

**Symptom**: User cancels but still has PRO/TEAM access

**Checks**:
1. Check Stripe Dashboard → Events for `customer.subscription.deleted`
2. Check webhook delivery status
3. Check application logs for webhook processing errors
4. Check database Subscription record (status should be 'cancelled', tier should be 'FREE')
5. Check User.plan field (should be 'FREE')
6. Verify subscription period end date (user may have access until end of billing period)

## Next Steps

### Phase 3.0.5: Admin Dashboard (Planned)
- User management UI
- Subscription management (manual upgrades/downgrades)
- Usage analytics dashboard
- Billing reports and exports

### Phase 3.0.6: VAT & Invoicing (Planned)
- EU VAT calculation (Stripe Tax)
- PDF invoice generation
- Automatic invoicing on subscription events
- Invoice storage and retrieval API

### Phase 3.0.7: Stripe Portal Integration (Planned)
- Customer portal for self-service
- Subscription management UI
- Payment method updates
- Billing history access
- Invoice downloads

## Files Created/Modified

### Database Schema
- `prisma/schema.prisma` - Added Stripe fields to Subscription model

### Core Billing
- `lib/billing/stripe.ts` - Stripe client initialization (42 lines)
- `lib/billing/plans.ts` - Plan definitions and helpers (120 lines)

### API Endpoints
- `app/api/billing/checkout/route.ts` - Checkout session endpoint (195 lines)
- `app/api/billing/webhooks/route.ts` - Webhook handler (265 lines)

### Tests
- `tests/unit/billing/checkout.test.ts` - Checkout endpoint tests (40+ scenarios)
- `tests/unit/billing/webhooks.test.ts` - Webhook handler tests (40+ scenarios)

### Documentation
- `PHASE_3.0.4_BILLING.md` - This file (comprehensive guide)

**Total**: ~620 lines of production code, ~800 lines of tests

## Summary

Phase 3.0.4 successfully implements:

✅ **Stripe SDK Integration** - EU-compliant configuration  
✅ **Checkout Sessions** - POST /api/billing/checkout endpoint  
✅ **Webhook Processing** - 3 event types handled  
✅ **EU Compliance** - German locale, SEPA, billing address  
✅ **Backend-only** - No UI components (as requested)  
✅ **Production-ready** - Comprehensive error handling, logging, idempotency  
✅ **Security** - Webhook signature verification, JWT authentication  
✅ **Testing** - 80+ test scenarios (checkout + webhooks)  
✅ **Documentation** - Complete setup and troubleshooting guide

**Ready for deployment** ✨
