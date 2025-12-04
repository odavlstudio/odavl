/**
 * Token Refresh Endpoint
 * POST /api/v1/auth/refresh
 *
 * Refreshes expired API key using refresh token
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 400 }
      );
    }

    // Find refresh token
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Check if expired
    if (new Date(tokenRecord.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Refresh token expired' },
        { status: 401 }
      );
    }

    // Generate new API key
    const newApiKey = `odavl_${randomBytes(32).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

    // Create new API key
    await prisma.apiKey.create({
      data: {
        key: newApiKey,
        name: 'CLI Auto-generated',
        userId: tokenRecord.userId,
        expiresAt,
      },
    });

    // Generate new refresh token
    const newRefreshToken = randomBytes(32).toString('hex');
    const refreshExpiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 180 days

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: tokenRecord.userId,
        expiresAt: refreshExpiresAt,
      },
    });

    // Delete old refresh token
    await prisma.refreshToken.delete({
      where: { id: tokenRecord.id },
    });

    return NextResponse.json({
      apiKey: newApiKey,
      expiresAt: expiresAt.toISOString(),
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
