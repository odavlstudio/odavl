/**
 * GET /api/features
 * Get available features for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@odavl-studio/auth';
import { getUserFeatures, TIER_FEATURES } from '@/lib/billing/gates';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

export async function GET(req: NextRequest) {
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

    // Get user's features
    const features = await getUserFeatures(payload.userId);

    return NextResponse.json({
      features,
      allFeatures: TIER_FEATURES,
    });
  } catch (error) {
    console.error('Get features error:', error);
    return NextResponse.json(
      { error: 'Failed to get features' },
      { status: 500 }
    );
  }
}
