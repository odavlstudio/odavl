# Stripe Integration Setup Guide

## Overview

This guide walks you through setting up Stripe for ODAVL Studio subscriptions. Follow these steps to enable payments for all 3 pricing tiers (Starter, Pro, Enterprise).

**Timeline:** 2-3 hours  
**Prerequisites:** Stripe account, Node.js 20+, pnpm

---

## Step 1: Create Stripe Account (10 minutes)

1. **Sign up**: [stripe.com/register](https://stripe.com/register)
   - Business type: "Technology/Software"
   - Country: Your location
   - Verify email

2. **Activate Account**:
   - Dashboard → Settings → Account details
   - Add business info (legal name, address, tax ID)
   - Add bank account for payouts

3. **Get API Keys**:
   - Dashboard → Developers → API keys
   - Copy:
     - **Publishable key**: `pk_test_xxx` (for frontend)
     - **Secret key**: `sk_test_xxx` (for backend)
   - Add to `.env.local`:
     ```env
     STRIPE_SECRET_KEY=sk_test_xxx
     STRIPE_PUBLISHABLE_KEY=pk_test_xxx
     STRIPE_WEBHOOK_SECRET=whsec_xxx (we'll get this in Step 3)
     ```

---

## Step 2: Create Products & Prices (30 minutes)

### Option A: Via Dashboard (Recommended for first-time setup)

1. **Create Products**:
   - Dashboard → Products → Add product

   **Product 1: ODAVL Starter**
   - Name: `ODAVL Starter`
   - Description: `100K LOC, 5 users, 12 detectors, autopilot, VS Code extension`
   - Pricing:
     - Monthly: `$29` → Save price ID: `price_xxx_starter_monthly`
     - Yearly: `$290` → Save price ID: `price_xxx_starter_yearly`
   - Metadata:
     - `plan`: `starter`
     - `max_loc`: `100000`
     - `max_users`: `5`

   **Product 2: ODAVL Pro**
   - Name: `ODAVL Pro`
   - Description: `500K LOC, unlimited users, SAML/SSO, RBAC, audit logs`
   - Pricing:
     - Monthly: `$99` → Save price ID: `price_xxx_pro_monthly`
     - Yearly: `$990` → Save price ID: `price_xxx_pro_yearly`
   - Metadata:
     - `plan`: `pro`
     - `max_loc`: `500000`
     - `max_users`: `-1` (unlimited)

   **Product 3: ODAVL Enterprise**
   - Name: `ODAVL Enterprise`
   - Description: `Unlimited LOC, unlimited users, on-premise, custom SLA`
   - Pricing:
     - Monthly: `$500` → Save price ID: `price_xxx_enterprise_monthly`
     - Yearly: `$5000` → Save price ID: `price_xxx_enterprise_yearly`
   - Metadata:
     - `plan`: `enterprise`
     - `max_loc`: `-1` (unlimited)
     - `max_users`: `-1` (unlimited)

2. **Update Environment Variables**:
   Add price IDs to `.env.local`:
   ```env
   STRIPE_STARTER_MONTHLY=price_xxx_starter_monthly
   STRIPE_STARTER_YEARLY=price_xxx_starter_yearly
   STRIPE_PRO_MONTHLY=price_xxx_pro_monthly
   STRIPE_PRO_YEARLY=price_xxx_pro_yearly
   STRIPE_ENTERPRISE_MONTHLY=price_xxx_enterprise_monthly
   STRIPE_ENTERPRISE_YEARLY=price_xxx_enterprise_yearly
   ```

---

### Option B: Via Stripe CLI (Advanced)

Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.20.0/stripe_1.20.0_linux_x86_64.tar.gz
tar -xvf stripe_1.20.0_linux_x86_64.tar.gz
```

Login:
```bash
stripe login
```

Create products:
```bash
# Starter Monthly
stripe products create \
  --name="ODAVL Starter" \
  --description="100K LOC, 5 users" \
  --metadata[plan]="starter" \
  --metadata[max_loc]="100000" \
  --metadata[max_users]="5"
# Output: prod_xxx

stripe prices create \
  --product=prod_xxx \
  --currency=usd \
  --unit-amount=2900 \
  --recurring[interval]=month
# Output: price_xxx_starter_monthly

# Starter Yearly
stripe prices create \
  --product=prod_xxx \
  --currency=usd \
  --unit-amount=29000 \
  --recurring[interval]=year
# Output: price_xxx_starter_yearly

# Repeat for Pro and Enterprise...
```

---

## Step 3: Set Up Webhooks (20 minutes)

Webhooks notify your backend when events happen (subscription created, payment succeeded, trial ending, etc.).

### Development (Local Testing)

1. **Forward webhooks to localhost**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Output:
   ```
   > Ready! Your webhook signing secret is whsec_xxx
   ```

2. **Copy webhook secret** to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

3. **Test webhook**:
   ```bash
   stripe trigger customer.subscription.created
   ```
   Check your terminal logs for: `✅ Subscription created: sub_xxx`

---

### Production (Live Webhooks)

1. **Create webhook endpoint**:
   - Dashboard → Developers → Webhooks → Add endpoint
   - URL: `https://app.odavl.studio/api/webhooks/stripe`
   - Events to listen:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.trial_will_end`

2. **Copy signing secret**:
   - Dashboard → Webhooks → [your endpoint] → Signing secret
   - Add to production env vars:
     ```env
     STRIPE_WEBHOOK_SECRET=whsec_xxx
     ```

---

## Step 4: Implement Backend API (60 minutes)

### 4.1 Install Dependencies

```bash
cd packages/sales
pnpm add stripe zod
pnpm build
```

---

### 4.2 Create API Routes (Next.js example)

**File:** `apps/studio-hub/pages/api/subscriptions/create.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { StripeIntegration, PricingPlan } from '@odavl-studio/sales/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, company, plan, billingCycle } = req.body;

  if (!email || !name || !plan || !billingCycle) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const stripe = new StripeIntegration(process.env.STRIPE_SECRET_KEY!);

    // Create customer
    const customer = await stripe.createCustomer({ email, name, company });

    // Create checkout session
    const session = await stripe.createCheckoutSession({
      customerId: customer.id,
      plan: plan as PricingPlan,
      billingCycle,
      trialDays: 30,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    });

    res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}
```

---

**File:** `apps/studio-hub/pages/api/webhooks/stripe.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { StripeIntegration } from '@odavl-studio/sales/stripe';
import { buffer } from 'micro';

// Disable body parsing (Stripe needs raw body)
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;

  try {
    const stripe = new StripeIntegration(process.env.STRIPE_SECRET_KEY!);
    const event = await stripe.handleWebhook(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);

    // Handle specific events
    switch (event.type) {
      case 'customer.subscription.created':
        // TODO: Update database (create subscription record)
        break;

      case 'invoice.payment_succeeded':
        // TODO: Send receipt email
        break;

      case 'customer.subscription.trial_will_end':
        // TODO: Send reminder email (3 days before trial ends)
        break;
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
}
```

---

### 4.3 Create Pricing Page (React/Next.js)

**File:** `apps/studio-hub/pages/pricing.tsx`

```typescript
import { useState } from 'react';
import { StripeIntegration } from '@odavl-studio/sales/stripe';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (plan: 'starter' | 'pro' | 'enterprise') => {
    setLoading(true);

    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com', // Get from auth session
          name: 'User Name',
          plan,
          billingCycle,
        }),
      });

      const { url } = await response.json();
      window.location.href = url; // Redirect to Stripe Checkout
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>ODAVL Studio Pricing</h1>

      {/* Billing Toggle */}
      <div>
        <button onClick={() => setBillingCycle('monthly')}>Monthly</button>
        <button onClick={() => setBillingCycle('yearly')}>Yearly (Save 17%)</button>
      </div>

      {/* Pricing Cards */}
      <div className="pricing-cards">
        {/* Starter */}
        <div className="card">
          <h2>Starter</h2>
          <p className="price">
            ${billingCycle === 'monthly' ? '29' : '24'}/mo
          </p>
          <ul>
            <li>100K LOC</li>
            <li>5 users</li>
            <li>12 detectors</li>
            <li>78% auto-fix</li>
          </ul>
          <button onClick={() => handleSubscribe('starter')} disabled={loading}>
            Start 30-day trial
          </button>
        </div>

        {/* Pro */}
        <div className="card featured">
          <h2>Pro</h2>
          <p className="price">
            ${billingCycle === 'monthly' ? '99' : '82.50'}/mo
          </p>
          <ul>
            <li>500K LOC</li>
            <li>Unlimited users</li>
            <li>SAML/SSO</li>
            <li>RBAC</li>
          </ul>
          <button onClick={() => handleSubscribe('pro')} disabled={loading}>
            Start 30-day trial
          </button>
        </div>

        {/* Enterprise */}
        <div className="card">
          <h2>Enterprise</h2>
          <p className="price">Custom</p>
          <ul>
            <li>Unlimited LOC</li>
            <li>On-premise</li>
            <li>Custom SLA</li>
            <li>Dedicated support</li>
          </ul>
          <a href="mailto:sales@odavl.studio">
            <button>Contact sales</button>
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

## Step 5: Test End-to-End (30 minutes)

### 5.1 Test Subscription Flow

1. **Start dev server**:
   ```bash
   cd apps/studio-hub
   pnpm dev
   # Open: http://localhost:3000/pricing
   ```

2. **Create subscription**:
   - Click "Start 30-day trial" (Starter plan)
   - Redirected to Stripe Checkout
   - Use test card: `4242 4242 4242 4242`, expiry: `12/34`, CVC: `123`
   - Submit payment
   - Redirected to success page

3. **Verify in Stripe Dashboard**:
   - Dashboard → Customers → [new customer]
   - Check subscription status: `trialing` (trial ends in 30 days)

---

### 5.2 Test Webhook Events

1. **Trigger webhook locally**:
   ```bash
   stripe trigger customer.subscription.created
   ```

2. **Check logs**:
   Terminal should show:
   ```
   ✅ Subscription created: sub_xxx
   ```

3. **Test other events**:
   ```bash
   stripe trigger invoice.payment_succeeded
   stripe trigger customer.subscription.trial_will_end
   stripe trigger invoice.payment_failed
   ```

---

### 5.3 Test MRR Calculation

```typescript
import { StripeIntegration } from '@odavl-studio/sales/stripe';

const stripe = new StripeIntegration(process.env.STRIPE_SECRET_KEY!);
const mrr = await stripe.calculateMRR();

console.log('Total MRR:', mrr.totalMRR);
console.log('Starter:', mrr.byPlan.starter);
console.log('Pro:', mrr.byPlan.pro);
console.log('Enterprise:', mrr.byPlan.enterprise);
```

Expected output:
```
Total MRR: 128
Starter: { count: 1, mrr: 29 }
Pro: { count: 1, mrr: 99 }
Enterprise: { count: 0, mrr: 0 }
```

---

## Step 6: Go Live (30 minutes)

### 6.1 Switch to Live Mode

1. **Get live API keys**:
   - Dashboard → Developers → API keys → Toggle "Viewing test data" → OFF
   - Copy:
     - `pk_live_xxx` (publishable key)
     - `sk_live_xxx` (secret key)

2. **Update production env vars**:
   ```env
   STRIPE_SECRET_KEY=sk_live_xxx
   STRIPE_PUBLISHABLE_KEY=pk_live_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx (from production webhook)
   ```

---

### 6.2 Activate Live Webhook

1. **Create live webhook**:
   - Dashboard → Developers → Webhooks → Add endpoint
   - URL: `https://app.odavl.studio/api/webhooks/stripe`
   - Events: (same as development)

2. **Copy signing secret** to production env vars

---

### 6.3 Verify Compliance

1. **Enable Stripe Tax** (if required):
   - Dashboard → Settings → Tax
   - Add tax rates for your jurisdictions

2. **Enable Stripe Billing Portal**:
   - Dashboard → Settings → Billing
   - Configure customer portal:
     - ✅ Allow subscription changes
     - ✅ Allow cancellations
     - ✅ Invoice history

3. **Add Legal Links**:
   - Terms of service: https://odavl.studio/terms
   - Privacy policy: https://odavl.studio/privacy

---

## Step 7: Monitor & Optimize (Ongoing)

### 7.1 Track KPIs

Dashboard → Reporting:
- **MRR Growth**: Target $10K by end of Week 18
- **Churn Rate**: Keep < 5% monthly
- **Trial → Paid Conversion**: Target 40%
- **Payment Failures**: < 2% (update cards proactively)

---

### 7.2 Set Up Alerts

Dashboard → Notifications:
- ✅ Payment failures (email to support@odavl.studio)
- ✅ Trial ending soon (3 days before)
- ✅ Subscription canceled (exit survey)

---

### 7.3 Optimize Pricing (Month 2-3)

Test these experiments:
1. **Discount Codes**:
   - `BETA20`: 20% off first 3 months (early adopters)
   - `ANNUAL15`: 15% off annual plans (on top of 17% discount)

2. **Tiered Discounts**:
   - 3-5 users: 10% off Pro
   - 6-10 users: 15% off Pro
   - 10+ users: 20% off Pro

3. **Usage-Based Pricing** (Advanced):
   - Charge per 100K LOC analyzed (instead of fixed tiers)
   - Example: $0.10/100K LOC (aligns with cloud computing model)

---

## Troubleshooting

### Issue: "Invalid API key"

**Cause:** Using test key in production (or vice versa)

**Fix:**
1. Check env vars: `echo $STRIPE_SECRET_KEY`
2. Verify key starts with `sk_test_` (dev) or `sk_live_` (prod)
3. Restart server after changing env vars

---

### Issue: "Webhook signature verification failed"

**Cause:** Wrong webhook secret or raw body not preserved

**Fix:**
1. Verify `STRIPE_WEBHOOK_SECRET` matches dashboard
2. Ensure `bodyParser: false` in API route config
3. Use `buffer(req)` to get raw body (not `req.body`)

---

### Issue: "Payment failed: Card declined"

**Cause:** Test card or insufficient funds (live mode)

**Fix:**
1. **Development:** Use test cards from [stripe.com/docs/testing](https://stripe.com/docs/testing)
2. **Production:** Email customer to update payment method
   - Send link: `https://billing.stripe.com/p/login/xxx`

---

### Issue: "MRR calculation shows $0"

**Cause:** No active subscriptions or wrong metadata

**Fix:**
1. Dashboard → Customers → Check subscription status (must be `active`, not `trialing`)
2. Verify `metadata.plan` and `metadata.billing_cycle` are set on subscriptions
3. Run: `stripe subscriptions list --limit 10` to inspect

---

## Next Steps

1. ✅ Complete Stripe setup (this guide)
2. ⏳ Run GitHub prospecting script → generate prospects.json
3. ⏳ Send 10-20 emails/day → book 5-10 demo calls
4. ⏳ Convert trials to paid subscriptions
5. ⏳ Reach $10K MRR (10 customers × $29-99/mo)

**Target:** End of Phase 3 Week 18 = $10K MRR milestone

---

## Resources

- **Stripe Docs**: [stripe.com/docs](https://stripe.com/docs)
- **Stripe CLI**: [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
- **Test Cards**: [stripe.com/docs/testing](https://stripe.com/docs/testing)
- **Webhook Events**: [stripe.com/docs/api/events/types](https://stripe.com/docs/api/events/types)
- **Subscriptions Guide**: [stripe.com/docs/billing/subscriptions](https://stripe.com/docs/billing/subscriptions)
