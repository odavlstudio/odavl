/**
 * API Key Generation API
 * Creates and manages API keys for Public API v1
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, scopes } = await request.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Generate API key
  const apiKey = `odavl_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const keyPrefix = apiKey.substring(0, 12);

  await prisma.apiKey.create({
    data: {
      userId: user.id,
      name,
      keyHash,
      keyPrefix,
      scopes: scopes || ['read:analyze', 'write:fix'],
    },
  });

  return NextResponse.json({ 
    apiKey, // Only shown once
    message: 'API key created. Store it securely.',
  });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { apiKeys: { where: { revokedAt: null } } },
  });

  return NextResponse.json(user?.apiKeys || []);
}
