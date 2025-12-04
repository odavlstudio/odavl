/**
 * Webhook Service
 * Handles webhook delivery with retry logic and signature verification
 */

import crypto from 'crypto';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
  organizationId: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  response?: {
    status: number;
    body: string;
    headers: Record<string, string>;
  };
  attemptCount: number;
  status: 'pending' | 'success' | 'failed';
  deliveredAt?: Date;
  failedAt?: Date;
  nextRetryAt?: Date;
  error?: string;
}

export interface Webhook {
  id: string;
  organizationId: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Available webhook events
export const WEBHOOK_EVENTS = {
  // Organization events
  'organization.created': 'Organization created',
  'organization.updated': 'Organization updated',
  'organization.deleted': 'Organization deleted',
  
  // Member events
  'member.joined': 'Member joined organization',
  'member.left': 'Member left organization',
  'member.role_changed': 'Member role changed',
  
  // Project events
  'project.created': 'Project created',
  'project.updated': 'Project updated',
  'project.deleted': 'Project deleted',
  
  // Error events
  'error.detected': 'Error detected',
  'error.resolved': 'Error resolved',
  'error.critical': 'Critical error detected',
  
  // Autopilot events
  'autopilot.started': 'Autopilot run started',
  'autopilot.completed': 'Autopilot run completed',
  'autopilot.failed': 'Autopilot run failed',
  
  // Guardian events
  'guardian.test_started': 'Guardian test started',
  'guardian.test_completed': 'Guardian test completed',
  'guardian.test_failed': 'Guardian test failed',
  
  // Billing events
  'billing.subscription_created': 'Subscription created',
  'billing.subscription_updated': 'Subscription updated',
  'billing.subscription_canceled': 'Subscription canceled',
  'billing.payment_succeeded': 'Payment succeeded',
  'billing.payment_failed': 'Payment failed',
  
  // Usage events
  'usage.limit_reached': 'Usage limit reached',
  'usage.limit_exceeded': 'Usage limit exceeded',
} as const;

type WebhookEvent = keyof typeof WEBHOOK_EVENTS;

class WebhookService {
  private readonly maxRetries = 5;
  private readonly retryDelays = [60, 300, 900, 3600, 7200]; // seconds: 1min, 5min, 15min, 1h, 2h

  /**
   * Trigger webhook event
   */
  async triggerEvent(
    event: string,
    organizationId: string,
    data: any
  ): Promise<void> {
    console.log(`🪝 Webhook event triggered: ${event}`, { organizationId });

    // Get active webhooks for this organization
    const webhooks = await this.getWebhooksForEvent(organizationId, event);

    if (webhooks.length === 0) {
      console.log('No webhooks configured for this event');
      return;
    }

    // Create webhook payload
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      organizationId,
    };

    // Deliver to all webhooks
    for (const webhook of webhooks) {
      await this.deliverWebhook(webhook, payload);
    }
  }

  /**
   * Deliver webhook with retry logic
   */
  private async deliverWebhook(
    webhook: Webhook,
    payload: WebhookPayload,
    attemptCount: number = 0
  ): Promise<void> {
    try {
      // Generate signature
      const signature = this.generateSignature(payload, webhook.secret);

      // Make HTTP request
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ODAVL-Webhooks/1.0',
          'X-ODAVL-Signature': signature,
          'X-ODAVL-Event': payload.event,
          'X-ODAVL-Timestamp': payload.timestamp,
          'X-ODAVL-Delivery-ID': crypto.randomUUID(),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const responseBody = await response.text();

      // Log delivery
      await this.logDelivery({
        webhookId: webhook.id,
        event: payload.event,
        payload,
        response: {
          status: response.status,
          body: responseBody.substring(0, 1000), // Truncate large responses
          headers: Object.fromEntries(response.headers.entries()),
        },
        attemptCount: attemptCount + 1,
        status: response.ok ? 'success' : 'failed',
        deliveredAt: response.ok ? new Date() : undefined,
        failedAt: response.ok ? undefined : new Date(),
        error: response.ok ? undefined : `HTTP ${response.status}: ${responseBody}`,
      });

      // Retry if failed
      if (!response.ok && attemptCount < this.maxRetries) {
        const retryDelay = this.retryDelays[attemptCount] * 1000; // Convert to ms
        console.log(`Webhook delivery failed, retrying in ${this.retryDelays[attemptCount]}s...`);
        
        setTimeout(() => {
          this.deliverWebhook(webhook, payload, attemptCount + 1);
        }, retryDelay);
      }
    } catch (error) {
      console.error('Webhook delivery error:', error);

      // Log failed delivery
      await this.logDelivery({
        webhookId: webhook.id,
        event: payload.event,
        payload,
        attemptCount: attemptCount + 1,
        status: 'failed',
        failedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Retry if not max retries
      if (attemptCount < this.maxRetries) {
        const retryDelay = this.retryDelays[attemptCount] * 1000;
        console.log(`Webhook delivery error, retrying in ${this.retryDelays[attemptCount]}s...`);
        
        setTimeout(() => {
          this.deliverWebhook(webhook, payload, attemptCount + 1);
        }, retryDelay);
      }
    }
  }

  /**
   * Generate webhook signature (HMAC-SHA256)
   */
  private generateSignature(payload: WebhookPayload, secret: string): string {
    const data = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(JSON.parse(payload), secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Get webhooks for event
   */
  private async getWebhooksForEvent(
    organizationId: string,
    event: string
  ): Promise<Webhook[]> {
    // TODO: Implement with Prisma
    // For now, return empty array
    console.log('Getting webhooks for:', { organizationId, event });
    return [];
  }

  /**
   * Log webhook delivery
   */
  private async logDelivery(delivery: Partial<WebhookDelivery>): Promise<void> {
    // TODO: Implement with Prisma
    console.log('Webhook delivery logged:', {
      event: delivery.event,
      status: delivery.status,
      attemptCount: delivery.attemptCount,
    });
  }

  /**
   * Retry failed webhook deliveries
   */
  async retryFailedDeliveries(): Promise<void> {
    // TODO: Implement with Prisma
    // Get failed deliveries that are due for retry
    // Call deliverWebhook for each
    console.log('Retrying failed webhook deliveries...');
  }

  /**
   * Create webhook
   */
  async createWebhook(data: {
    organizationId: string;
    url: string;
    events: string[];
    secret?: string;
  }): Promise<Webhook> {
    // Generate secret if not provided
    const secret = data.secret || crypto.randomBytes(32).toString('hex');

    // TODO: Implement with Prisma
    const webhook: Webhook = {
      id: crypto.randomUUID(),
      organizationId: data.organizationId,
      url: data.url,
      secret,
      events: data.events,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Webhook created:', webhook.id);
    return webhook;
  }

  /**
   * Update webhook
   */
  async updateWebhook(
    webhookId: string,
    data: {
      url?: string;
      events?: string[];
      active?: boolean;
    }
  ): Promise<void> {
    // TODO: Implement with Prisma
    console.log('Webhook updated:', webhookId, data);
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    // TODO: Implement with Prisma
    console.log('Webhook deleted:', webhookId);
  }

  /**
   * Get webhook deliveries
   */
  async getDeliveries(
    webhookId: string,
    options: {
      limit?: number;
      status?: 'pending' | 'success' | 'failed';
    } = {}
  ): Promise<WebhookDelivery[]> {
    // TODO: Implement with Prisma
    console.log('Getting webhook deliveries:', webhookId, options);
    return [];
  }

  /**
   * Test webhook
   */
  async testWebhook(webhookId: string): Promise<{
    success: boolean;
    status?: number;
    error?: string;
  }> {
    // TODO: Get webhook from database
    // For now, return mock
    const webhook: Webhook = {
      id: webhookId,
      organizationId: 'test',
      url: 'https://example.com/webhook',
      secret: 'test-secret',
      events: ['test.event'],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const testPayload: WebhookPayload = {
      event: 'test.webhook',
      timestamp: new Date().toISOString(),
      data: { message: 'This is a test webhook' },
      organizationId: webhook.organizationId,
    };

    try {
      const signature = this.generateSignature(testPayload, webhook.secret);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ODAVL-Signature': signature,
          'X-ODAVL-Event': testPayload.event,
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000),
      });

      return {
        success: response.ok,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get available events
   */
  getAvailableEvents(): Array<{ key: string; description: string }> {
    return Object.entries(WEBHOOK_EVENTS).map(([key, description]) => ({
      key,
      description,
    }));
  }
}

export const webhookService = new WebhookService();
