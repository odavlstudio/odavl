import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, scopes } = body;

    if (!name || !scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json(
        { error: 'Name and scopes are required' },
        { status: 400 }
      );
    }

    // Generate API key with ODAVL prefix
    const rawKey = `odavl_key_${nanoid(32)}`;

    // Hash the key for storage
    const hashedKey = await bcrypt.hash(rawKey, 10);

    // Create API key in database
    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key: hashedKey,
        scopes,
        userId: user.id,
        orgId: user.organizationId || '',
        expiresAt: null,
      },
    });

    // Return the raw key (ONLY TIME IT'S SHOWN!)
    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      scopes: apiKey.scopes,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
    });
  } catch (error) {
    console.error('Failed to create API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        key: true,
        scopes: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

    );
  }

  const { key, id } = await generateApiKey(session.user.id, name, scopes);

  return NextResponse.json({
    id,
    key,
    message: 'Save this key securely. It will not be shown again.',
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keys = await prisma.apiKey.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      scopes: true,
      createdAt: true,
      lastUsedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    keys: keys,
  });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const keyId = searchParams.get('id');

  if (!keyId) {
    return NextResponse.json(
      { error: 'Key ID required' },
      { status: 400 }
    );
  }

  await prisma.apiKey.delete({
    where: {
      id: keyId,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}
