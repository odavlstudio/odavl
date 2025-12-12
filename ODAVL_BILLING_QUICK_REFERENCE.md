# ODAVL Billing System - Quick Reference

## 🎯 Quick Start (5 Minutes)

### 1. Environment Setup
```bash
# Copy to .env.local:
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
STRIPE_PRICE_PRO=price_xxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxxxxxxxxxx
```

### 2. Start Development Server
```bash
cd apps/cloud-console
pnpm dev
```

### 3. Test Billing Flow
```
1. Go to http://localhost:3000/app/billing
2. Click "Upgrade to PRO"
3. Use test card: 4242 4242 4242 4242
4. Complete checkout → Redirects back with plan updated
```

---

## 📦 Files Created/Modified

### Core Integration (3 files)
```
✅ lib/stripe.ts - Enhanced with 7 functions
✅ lib/plans.ts - NEW (3 plan definitions)
✅ lib/feature-gating.ts - NEW (8 gating functions)
```

### API Routes (4 files)
```
✅ app/api/stripe/webhook/route.ts - NEW
✅ app/api/billing/create-checkout/route.ts - NEW
✅ app/api/billing/create-portal/route.ts - NEW
✅ app/api/billing/usage/route.ts - Exists
```

### Frontend (3 files)
```
✅ app/app/billing/page.tsx - Enhanced
✅ components/navbar.tsx - Enhanced (plan badge)
✅ lib/api-client.ts - Enhanced (billing methods)
```

---

## 🎫 Subscription Plans

| Plan | Price | Scans | Autopilot | Tests |
|------|-------|-------|-----------|-------|
| FREE | $0 | 10/mo | Read-only | 3/mo |
| PRO | $19/mo | ∞ | Full | ∞ |
| ENTERPRISE | $99/mo | ∞ | Full | ∞ |

---

## 🔧 Feature Gating Usage

```typescript
// Example: Gate Insight API
import { canUseInsight, trackInsightUsage } from '@/lib/feature-gating';

export async function POST(req: NextRequest) {
  const gate = await canUseInsight(orgId);
  
  if (!gate.allowed) {
    return NextResponse.json({
      error: gate.reason,
      upgradeUrl: '/app/billing'
    }, { status: 403 });
  }

  // Execute logic
  const result = await performScan();

  // Track usage
  await trackInsightUsage(orgId);

  return NextResponse.json({ result });
}
```

---

## 🔗 API Endpoints

```
POST /api/billing/create-checkout → { url: string }
POST /api/billing/create-portal → { url: string }
GET  /api/billing/usage → { tier, limits, used, currentPeriodEnd }
POST /api/stripe/webhook → { received: true }
```

---

## 🧪 Testing Commands

```bash
# Test webhook locally
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded

# Test cards
4242 4242 4242 4242 - Success
4000 0000 0000 0002 - Decline
```

---

## 📊 Database Schema

```prisma
Organization {
  stripeCustomerId     String?  @unique
  stripeSubscriptionId String?  @unique
  tier                 Tier     @default(FREE)
  subscriptions        Subscription[]
}

Subscription {
  stripeSubscriptionId String?  @unique
  usedAnalyses         Int      @default(0)
  usedFixes            Int      @default(0)
  usedAudits           Int      @default(0)
  currentPeriodEnd     DateTime
}
```

---

## ⚙️ Stripe Configuration

### Create Products
```
1. Stripe Dashboard → Products → Create
2. "ODAVL Pro" - $19/month → Copy price_id
3. "ODAVL Enterprise" - $99/month → Copy price_id
```

### Setup Webhook
```
1. Developers → Webhooks → Add Endpoint
2. URL: https://your-domain.com/api/stripe/webhook
3. Events: 
   - customer.subscription.*
   - invoice.payment_*
4. Copy webhook secret: whsec_xxxxxxxxxxxxx
```

---

## 🚀 Deployment Checklist

```bash
✅ Set environment variables
✅ Configure Stripe webhook URL
✅ Create Stripe products/prices
✅ Test checkout with test card
✅ Verify webhook events logged
✅ Test plan badge in navbar
✅ Confirm usage tracking works
```

---

## 📝 Common Tasks

### Check User's Plan
```typescript
const org = await prisma.organization.findUnique({
  where: { id: orgId },
});
console.log(org.tier); // FREE | PRO | ENTERPRISE
```

### Check Usage Stats
```typescript
const sub = await prisma.subscription.findUnique({
  where: { organizationId: orgId },
});
console.log(sub.usedAnalyses, sub.usedFixes, sub.usedAudits);
```

### Reset Monthly Usage (Cron)
```typescript
import { resetMonthlyUsage } from '@/lib/feature-gating';
await resetMonthlyUsage(orgId);
```

---

## 🛠️ Helper Functions

### Stripe Integration
```typescript
import {
  getOrCreateStripeCustomer,
  createCheckoutSession,
  createPortalSession,
  cancelSubscription
} from '@/lib/stripe';
```

### Feature Gating
```typescript
import {
  canUseInsight,
  canUseAutopilot,
  canUseGuardian,
  trackInsightUsage,
  trackAutopilotUsage,
  trackGuardianUsage
} from '@/lib/feature-gating';
```

### Plan Management
```typescript
import {
  getPlan,
  getAllPlans,
  hasFeature,
  getFeatureLimit
} from '@/lib/plans';
```

---

## 🐛 Troubleshooting

### Issue: Webhook not receiving events
```bash
# Solution: Use Stripe CLI for local testing
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Issue: "Invalid signature" error
```bash
# Solution: Verify STRIPE_WEBHOOK_SECRET matches Stripe Dashboard
echo $STRIPE_WEBHOOK_SECRET
```

### Issue: Plan badge not showing
```bash
# Solution: Check if useUsageStats() is loading data
console.log(usage); // Should return { tier, limits, used }
```

---

## 📚 Full Documentation

See `ODAVL_BILLING_SYSTEM_COMPLETE.md` for complete implementation details.
