import express, { type Request, type Response } from 'express';
import type { GuardianScheduler } from '@odavl-studio/guardian-workers';

interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  createdAt: string;
}

const subscriptions = new Map<string, WebhookSubscription>();

export function createWebhookRoutes(scheduler: GuardianScheduler): express.Router {
  const router = express.Router();

  // Create webhook subscription
  router.post('/subscribe', (req: Request, res: Response): void => {
    const { url, events, secret } = req.body;

    if (!url || !events || !Array.isArray(events)) {
      res.status(400).json({ error: 'Invalid subscription data' });
      return;
    }

    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const subscription: WebhookSubscription = {
      id,
      url,
      events,
      secret,
      createdAt: new Date().toISOString(),
    };

    subscriptions.set(id, subscription);

    res.status(201).json({
      success: true,
      data: subscription,
    });
  });

  // List subscriptions
  router.get('/subscriptions', (req: Request, res: Response): void => {
    res.json({
      success: true,
      data: Array.from(subscriptions.values()),
    });
  });

  // Get subscription
  router.get('/subscriptions/:id', (req: Request, res: Response): void => {
    const subscription = subscriptions.get(req.params.id);
    if (!subscription) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }
    res.json({
      success: true,
      data: subscription,
    });
  });

  // Delete subscription
  router.delete('/subscriptions/:id', (req: Request, res: Response): void => {
    const deleted = subscriptions.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }
    res.json({
      success: true,
      message: 'Subscription deleted',
    });
  });

  // Test webhook
  router.post('/test', async (req: Request, res: Response): Promise<void> => {
    const { url } = req.body;

    if (!url) {
      res.status(400).json({ error: 'URL required' });
      return;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'test',
          timestamp: new Date().toISOString(),
          data: { message: 'Test webhook from Guardian' },
        }),
      });

      res.json({
        success: true,
        status: response.status,
        message: response.ok ? 'Webhook test successful' : 'Webhook test failed',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to send test webhook',
      });
    }
  });

  return router;
}

// Export for event dispatching
export function dispatchWebhook(event: string, data: unknown): void {
  const relevantSubs = Array.from(subscriptions.values()).filter((sub) =>
    sub.events.includes(event) || sub.events.includes('*')
  );

  for (const sub of relevantSubs) {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    fetch(sub.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Guardian-Event': event,
        ...(sub.secret && { 'X-Guardian-Secret': sub.secret }),
      },
      body: JSON.stringify(payload),
    }).catch((error) => {
      console.error(`Failed to dispatch webhook to ${sub.url}:`, error);
    });
  }
}
