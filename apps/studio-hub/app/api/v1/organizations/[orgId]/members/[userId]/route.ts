/**
 * Single Member API Routes
 * PATCH /api/v1/organizations/:orgId/members/:userId - Update member role
 * DELETE /api/v1/organizations/:orgId/members/:userId - Remove member
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { organizationService } from '@odavl-studio/core/services/organization';
import { z } from 'zod';

const updateMemberSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orgId, userId } = params;

    // Check permission
    const hasPermission = await organizationService.hasPermission(
      orgId,
      session.user.id,
      'members:update'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Prevent changing own role
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = updateMemberSchema.parse(body);

    const member = await organizationService.updateMemberRole(
      orgId,
      userId,
      validatedData.role
    );

    return NextResponse.json({
      success: true,
      data: member,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgId: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orgId, userId } = params;

    // Check permission
    const hasPermission = await organizationService.hasPermission(
      orgId,
      session.user.id,
      'members:remove'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Prevent removing last owner
    const targetRole = await organizationService.getMemberRole(orgId, userId);
    if (targetRole === 'OWNER') {
      const members = await organizationService.getMembers(orgId);
      const ownerCount = members.filter((m) => m.role === 'OWNER').length;

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove last owner. Transfer ownership first.' },
          { status: 400 }
        );
      }
    }

    await organizationService.removeMember(orgId, userId);

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
