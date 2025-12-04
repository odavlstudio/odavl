/**
 * GET/POST /api/custom-rules
 * Manage custom code analysis rules (Requires ENTERPRISE tier)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireTier } from '@/lib/billing/gates';
import { verifyToken } from '@odavl-studio/auth';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

// GET: List custom rules
export async function GET(req: NextRequest) {
  // Check tier requirement (ENTERPRISE)
  const tierCheck = await requireTier('ENTERPRISE')(req);
  if (tierCheck) return tierCheck;

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

    // TODO: Fetch custom rules from database
    // For now, return mock rules
    const rules = [
      {
        id: '1',
        name: 'Enforce company naming conventions',
        pattern: '^[A-Z][a-zA-Z0-9]*Service$',
        severity: 'error',
        enabled: true,
      },
      {
        id: '2',
        name: 'Disallow console.log in production',
        pattern: 'console\\.log',
        severity: 'warning',
        enabled: true,
      },
    ];

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Get custom rules error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom rules' },
      { status: 500 }
    );
  }
}

// POST: Create custom rule
export async function POST(req: NextRequest) {
  // Check tier requirement (ENTERPRISE)
  const tierCheck = await requireTier('ENTERPRISE')(req);
  if (tierCheck) return tierCheck;

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

    // Parse request body
    const body = await req.json();
    const { name, pattern, severity, enabled } = body;

    if (!name || !pattern || !severity) {
      return NextResponse.json(
        { error: 'Name, pattern, and severity are required' },
        { status: 400 }
      );
    }

    // TODO: Save to database
    const newRule = {
      id: Date.now().toString(),
      name,
      pattern,
      severity,
      enabled: enabled ?? true,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      message: 'Custom rule created',
      rule: newRule,
    });
  } catch (error) {
    console.error('Create custom rule error:', error);
    return NextResponse.json(
      { error: 'Failed to create custom rule' },
      { status: 500 }
    );
  }
}
