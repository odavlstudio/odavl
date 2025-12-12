/**
 * ODAVL Billing Service
 * Stripe integration and subscription management
 */

import express from 'express';
import { StripeService } from './stripe.js';
import { PlanManager } from './plans.js';
import { UsageTracker } from './usage.js';

const app = express();
const PORT = process.env.BILLING_PORT ? parseInt(process.env.BILLING_PORT, 10) : 8091;

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'billing', timestamp: new Date().toISOString() });
});

// Subscription endpoints
app.post('/billing/subscribe', async (req, res) => {
  const { organizationId, planId, paymentMethodId } = req.body;
  const stripe = new StripeService();
  
  // Skeleton: Would create Stripe customer + subscription
  const subscription = await stripe.createSubscription({
    customerId: `cus_${organizationId}`,
    priceId: planId,
    paymentMethodId,
  });
  
  res.json({ subscription });
});

app.post('/billing/cancel', async (req, res) => {
  const { subscriptionId } = req.body;
  const stripe = new StripeService();
  const result = await stripe.cancelSubscription(subscriptionId);
  res.json({ success: result });
});

// Usage tracking
app.post('/billing/usage', async (req, res) => {
  const { organizationId, metric, value } = req.body;
  const usage = new UsageTracker();
  usage.recordUsage(organizationId, metric, value);
  res.json({ success: true });
});

app.get('/billing/usage/:organizationId', async (req, res) => {
  const usage = new UsageTracker();
  const data = usage.getUsage(req.params.organizationId);
  res.json({ usage: data });
});

// Start server
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => console.log(`Billing service running on port ${PORT}`));
}

export { app, StripeService, PlanManager, UsageTracker };
