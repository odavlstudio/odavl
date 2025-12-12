/**
 * Organization Members API - RBAC Protected
 * Manage organization membership and roles
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withPermission, withOrgContext, createOrgIsolation } from '@/lib/rbac-middleware';
import { OrgContext } from '@/lib/org-context';
import { prisma } from '@/lib/prisma';
import { auditMemberChange } from '@/lib/audit';
import { canManageRole } from '@/lib/rbac';
import { OrgRole } from '@prisma/client';

// ============================================================================
// Request Schemas
// ============================================================================

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['DEVELOPER', 'VIEWER']), // Admins can only invite DEVELOPER or VIEWER
});

const updateRoleSchema = z.object({
  memberId: z.string(),
  role: z.enum(['ADMIN', 'DEVELOPER', 'VIEWER']),
});

const removeMemberSchema = z.object({
  memberId: z.string(),
});

// ============================================================================
// GET /api/members - List organization members
// ============================================================================

export const GET = withOrgContext(async (req: NextRequest, context: OrgContext) => {
  try {
    const orgIsolation = createOrgIsolation(context);

    const members = await prisma.organizationMember.findMany({
      where: orgIsolation.where(),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then ADMIN, etc.
        { createdAt: 'asc' },
      ],
    });

    return NextResponse.json({
      members: members.map((m: {
        id: string;
        userId: string;
        role: string;
        createdAt: Date;
        user: any;
      }) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.createdAt,
        user: m.user,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch members' },
      { status: 500 }
    );
  }
});

// ============================================================================
// POST /api/members - Invite member (ADMIN+)
// ============================================================================

export const POST = withPermission('members:invite', async (req: NextRequest, context: OrgContext) => {
  try {
    const body = await req.json();
    const { email, role } = inviteMemberSchema.parse(body);

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // If user doesn't exist, create invitation placeholder
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0], // Temporary name
        },
      });
    }

    // Check if already a member
    const existingMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: context.organizationId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 400 }
      );
    }

    // Create membership
    const member = await prisma.organizationMember.create({
      data: {
        organizationId: context.organizationId,
        userId: user.id,
        role: role as OrgRole,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Audit log
    await auditMemberChange(
      context.organizationId,
      context.userId,
      user.id,
      'invited',
      { role, email }
    );

    return NextResponse.json({
      member: {
        id: member.id,
        userId: member.userId,
        role: member.role,
        user: member.user,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to invite member' },
      { status: 500 }
    );
  }
});

// ============================================================================
// PATCH /api/members - Update member role (OWNER+)
// ============================================================================

export const PATCH = withPermission('members:update-role', async (req: NextRequest, context: OrgContext) => {
  try {
    const body = await req.json();
    const { memberId, role } = updateRoleSchema.parse(body);

    // Get target member
    const member = await prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId: context.organizationId,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check if actor can manage target's current role
    if (!canManageRole(context.role, member.role)) {
      return NextResponse.json(
        { error: `Cannot modify ${member.role} role with your ${context.role} role` },
        { status: 403 }
      );
    }

    // Check if actor can assign new role
    if (!canManageRole(context.role, role as OrgRole)) {
      return NextResponse.json(
        { error: `Cannot assign ${role} role with your ${context.role} role` },
        { status: 403 }
      );
    }

    // Update role
    const updated = await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: role as OrgRole },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Audit log
    await auditMemberChange(
      context.organizationId,
      context.userId,
      member.userId,
      'role_changed',
      { oldRole: member.role, newRole: role }
    );

    return NextResponse.json({
      member: {
        id: updated.id,
        userId: updated.userId,
        role: updated.role,
        user: updated.user,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update member' },
      { status: 500 }
    );
  }
});

// ============================================================================
// DELETE /api/members - Remove member (ADMIN+)
// ============================================================================

export const DELETE = withPermission('members:remove', async (req: NextRequest, context: OrgContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'memberId query parameter required' }, { status: 400 });
    }

    // Get target member
    const member = await prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId: context.organizationId,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cannot remove yourself
    if (member.userId === context.userId) {
      return NextResponse.json({ error: 'Cannot remove yourself from organization' }, { status: 400 });
    }

    // Check if actor can manage target's role
    if (!canManageRole(context.role, member.role)) {
      return NextResponse.json(
        { error: `Cannot remove ${member.role} role with your ${context.role} role` },
        { status: 403 }
      );
    }

    // Prevent removing last owner
    if (member.role === 'OWNER') {
      const ownerCount = await prisma.organizationMember.count({
        where: {
          organizationId: context.organizationId,
          role: 'OWNER',
        },
      });

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove last owner from organization' },
          { status: 400 }
        );
      }
    }

    // Remove member
    await prisma.organizationMember.delete({
      where: { id: memberId },
    });

    // Audit log
    await auditMemberChange(
      context.organizationId,
      context.userId,
      member.userId,
      'removed',
      { role: member.role }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove member' },
      { status: 500 }
    );
  }
});
