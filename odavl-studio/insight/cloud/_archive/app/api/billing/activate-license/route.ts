/**
 * POST /api/billing/activate-license
 * Activate a license key for the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, activateLicense } from '@odavl-studio/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

const activateSchema = z.object({
  licenseKey: z.string().min(1, 'License key is required'),
});

export async function POST(req: NextRequest) {
  try {
    // Verify auth
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token, JWT_SECRET);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Validate request body
    const body = await req.json();
    const validation = activateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { licenseKey } = validation.data;

    // Activate license
    const result = await activateLicense(licenseKey, payload.userId, prisma);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to activate license' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'License activated successfully',
      subscription: {
        id: result.subscription.id,
        tier: result.subscription.tier,
        status: result.subscription.status,
        limits: {
          maxProjects: result.subscription.maxProjects,
          maxAnalysesPerMonth: result.subscription.maxAnalysesPerMonth,
          maxStorageGB: result.subscription.maxStorageGB,
        },
      },
    });
  } catch (error) {
    console.error('Activate license error:', error);
    return NextResponse.json(
      { error: 'Failed to activate license' },
      { status: 500 }
    );
  }
}
