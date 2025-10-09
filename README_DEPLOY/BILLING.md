# ODAVL Billing Setup Guide

## Prerequisites

- Stripe account (test and production)
- Vercel/hosting platform with environment variable support
- Domain configured with SSL certificate

## Stripe Account Setup

### 1. Create Stripe Account
1. Sign up at [stripe.com](https://stripe.com)
2. Complete account verification
3. Enable Developer mode in Dashboard

### 2. Configure Products & Prices
```bash
# Pro Plan (Monthly)
- Product: "ODAVL Pro"
- Price: $69/month recurring
- Price ID: Copy to STRIPE_PRO_PRICE_ID

# Enterprise Plan
- Product: "ODAVL Enterprise" 
- Price: Custom/Contact Sales
```

### 3. Get API Keys
```bash
# Test Mode
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Production Mode  
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Webhook Configuration

### 1. Create Webhook Endpoint
- URL: `https://yourdomain.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`
- Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### 2. Test Webhook
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Environment Variables

Add to Vercel/hosting platform:

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
```

## Production Checklist

- [ ] Stripe account verified and activated
- [ ] Products and prices configured
- [ ] Webhook endpoint tested
- [ ] Environment variables set
- [ ] SSL certificate active
- [ ] Legal terms finalized