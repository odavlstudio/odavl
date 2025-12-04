/**
 * API Keys Management Endpoints
 * GET /api/v1/settings/api-keys - List user's API keys
 * POST /api/v1/settings/api-keys - Create new API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { authOptions } from '@/lib/auth';

/**
 * GET - List user's API keys
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get API keys
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: user.id,
        revokedAt: null, // Only active keys
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        key: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
        scopes: true,
      },
    });

    // Mask API keys (show only last 4 characters)
    const maskedKeys = apiKeys.map((key) => ({
      ...key,
      key: `odavl_${'*'.repeat(60)}${key.key.slice(-4)}`,
    }));

    return NextResponse.json({ apiKeys: maskedKeys });
  } catch (error) {
    console.error('Get API keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Create new API key
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.orgId) {
      return NextResponse.json({ error: 'User not in organization' }, { status: 400 });
    }

    // Generate API key
    const apiKey = `odavl_${randomBytes(32).toString('hex')}`;

    // Create API key
    const newKey = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        key: apiKey,
        userId: user.id,
        orgId: user.orgId,
        scopes: ['*'], // Full access by default
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    // Generate refresh token
    const refreshToken = randomBytes(32).toString('hex');
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days
      },
    });

    // Return full key (only time it's shown)
    return NextResponse.json({
      id: newKey.id,
      name: newKey.name,
      key: apiKey, // Full key
      refreshToken,
      expiresAt: newKey.expiresAt,
      createdAt: newKey.createdAt,
    });
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
