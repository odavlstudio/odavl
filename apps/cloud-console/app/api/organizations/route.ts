/**
 * Organizations API - Switch and manage organization context
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { withOrgContext, withPermission, OrgContext } from '@/lib/org-context';
import { getUserOrganizations, getOrgContext } from '@/lib/org-context';
import { prisma } from '@/lib/prisma';
import { auditMemberChange } from '@/lib/audit';

// ============================================================================
// GET /api/organizations - List user's organizations
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const organizations = await getUserOrganizations();
    return NextResponse.json({ organizations });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/organizations/switch - Switch active organization
// ============================================================================

const switchOrgSchema = z.object({
  organizationId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { organizationId } = switchOrgSchema.parse(body);

    // Get session to verify user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this organization
    const context = await getOrgContext(organizationId);

    // NOTE: Session update happens automatically via JWT callback
    // The client should call router.refresh() to reload pages with new org context
    
    return NextResponse.json({
      organizationId: context.organizationId,
      organizationSlug: context.organizationSlug,
      role: context.role,
      message: 'Organization switched successfully. Refresh page to see updates.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to switch organization' },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
