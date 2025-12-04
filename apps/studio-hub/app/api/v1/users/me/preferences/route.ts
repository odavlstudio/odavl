/**
 * Notification Preferences API
 * GET /api/v1/users/me/preferences - Get preferences
 * PUT /api/v1/users/me/preferences - Update preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { notificationService } from '@odavl-studio/core/services/notification';
import { z } from 'zod';

const preferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  emailInvitations: z.boolean().optional(),
  emailErrorAlerts: z.boolean().optional(),
  emailUsageLimits: z.boolean().optional(),
  emailBilling: z.boolean().optional(),
  emailWeeklySummary: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  inAppInvitations: z.boolean().optional(),
  inAppErrorAlerts: z.boolean().optional(),
  inAppUsageLimits: z.boolean().optional(),
  inAppBilling: z.boolean().optional(),
  webhookEnabled: z.boolean().optional(),
  webhookUrl: z.string().url().optional(),
  webhookEvents: z.array(z.string()).optional(),
  errorAlertThreshold: z.number().min(1).max(1000).optional(),
  usageLimitThreshold: z.number().min(50).max(100).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Implement getPreferences in notificationService
    const preferences = {
      emailEnabled: true,
      emailInvitations: true,
      emailErrorAlerts: true,
      emailUsageLimits: true,
      emailBilling: true,
      emailWeeklySummary: true,
      inAppEnabled: true,
      inAppInvitations: true,
      inAppErrorAlerts: true,
      inAppUsageLimits: true,
      inAppBilling: true,
      webhookEnabled: false,
      webhookUrl: null,
      webhookEvents: [],
      errorAlertThreshold: 10,
      usageLimitThreshold: 80,
    };

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const preferences = preferencesSchema.parse(body);

    await notificationService.updatePreferences(session.user.id, preferences);

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
