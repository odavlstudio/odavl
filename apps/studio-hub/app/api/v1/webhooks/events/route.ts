/**
 * Available Webhook Events API
 * GET /api/v1/webhooks/events
 */

import { NextResponse } from 'next/server';
import { webhookService } from '@odavl-studio/core/services/webhook';

export async function GET() {
  try {
    const events = webhookService.getAvailableEvents();

    // Group events by category
    const grouped = events.reduce((acc, event) => {
      const [category] = event.key.split('.');
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(event);
      return acc;
    }, {} as Record<string, typeof events>);

    return NextResponse.json({
      success: true,
      data: {
        events,
        grouped,
      },
    });
  } catch (error) {
    console.error('Error fetching webhook events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook events' },
      { status: 500 }
    );
  }
}
