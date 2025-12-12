/**
 * Organization Member Management API
 * Handles role changes and member removal
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role } = await request.json();
  const { id: organizationId, memberId } = await params;

  // Check if user is owner
  const requester = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      user: { email: session.user.email },
      role: 'OWNER',
    },
  });

  if (!requester) {
    return NextResponse.json({ error: 'Only owners can change roles' }, { status: 403 });
  }

  await prisma.organizationMember.update({
    where: { id: memberId },
    data: { role },
  });

  // TODO: Implement AuditLog model in Prisma schema
  console.log('AUDIT: ROLE_CHANGED', {
    orgId: organizationId,
    userId: requester.userId,
    resource: 'organization_member',
    metadata: { memberId, newRole: role },
  });

  return NextResponse.json({ message: 'Role updated' });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: organizationId, memberId } = await params;

  const requester = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      user: { email: session.user.email },
    },
  });

  if (!requester) {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 });
  }

  // Can remove self or others if admin/owner
  const canRemove = 
    requester.id === memberId || 
    ['OWNER', 'ADMIN'].includes(requester.role);

  if (!canRemove) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  await prisma.organizationMember.delete({
    where: { id: memberId },
  });

  // TODO: Implement AuditLog model in Prisma schema
  console.log('AUDIT:', requester.id === memberId ? 'LEFT_ORG' : 'MEMBER_REMOVED', {
    orgId: organizationId,
    userId: requester.userId,
    resource: 'organization_member',
    metadata: { memberId },
  });

  return NextResponse.json({ message: 'Member removed' });
}
