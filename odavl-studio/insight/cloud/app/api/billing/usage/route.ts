/**
 * GET /api/billing/usage
 * Get current user's usage statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@odavl-studio/auth';
import { getCurrentUsage } from '@/lib/billing/usage';

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

    // Get usage data
    const usage = await getCurrentUsage(payload.userId);

    if (!usage) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    return NextResponse.json(usage);
  } catch (error) {
    console.error('Get usage error:', error);
    return NextResponse.json(
      { error: 'Failed to get usage' },
      { status: 500 }
    );
  }
}
