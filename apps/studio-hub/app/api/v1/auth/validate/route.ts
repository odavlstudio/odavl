/**
 * API Key Validation Endpoint
 * POST /api/v1/auth/validate
 *
 * Validates API key and returns user information
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7);

    // Find API key in database
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: {
        user: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!apiKeyRecord) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Check if expired
    if (apiKeyRecord.expiresAt && new Date(apiKeyRecord.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'API key expired' },
        { status: 401 }
      );
    }

    // Check if revoked
    if (apiKeyRecord.revokedAt) {
      return NextResponse.json(
        { error: 'API key revoked' },
        { status: 401 }
      );
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    // Return user information
    return NextResponse.json({
      userId: apiKeyRecord.user.id,
      email: apiKeyRecord.user.email,
      organizationId: apiKeyRecord.user.organizationId,
      expiresAt: apiKeyRecord.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    });
  } catch (error) {
    console.error('API key validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
