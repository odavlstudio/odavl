/**
 * Organization Members API Routes
 * GET /api/v1/organizations/:orgId/members - List members
 * POST /api/v1/organizations/:orgId/members - Add member
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { organizationService } from '../../../../../../../../packages/core/src/services/organization';
import { z } from 'zod';
import { MemberRole } from '../../../../../../../../packages/types/src/multi-tenant';

const addMemberSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orgId } = await params;

    // Check membership
    const isMember = await organizationService.isMember(orgId, session.user.id);
    if (!isMember) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const members = await organizationService.getMembers(orgId);

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orgId } = await params;

    // Check permission
    const hasPermission = await organizationService.hasPermission(
      orgId,
      session.user.id,
      'members:invite'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = addMemberSchema.parse(body);

    // Check if user is already a member
    const existingMember = await organizationService.isMember(
      orgId,
      validatedData.userId
    );

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member' },
        { status: 409 }
      );
    }

    // Check organization limits
    const limits = await organizationService.checkUsageLimits(orgId);
    if (limits.members.exceeded) {
      return NextResponse.json(
        {
          error: 'Member limit exceeded',
          details: `Current plan allows ${limits.members.limit} members`
        },
        { status: 403 }
      );
    }

    const member = await organizationService.addMember(
      orgId,
      validatedData.userId,
      validatedData.role as MemberRole
    );

    return NextResponse.json({
      success: true,
      data: member,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error adding member:', error);
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    );
  }
}
