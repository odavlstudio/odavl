/**
 * Bulk Invitations API Route
 * POST /api/v1/invitations/bulk - Create bulk invitations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { invitationsService } from '../../../../../../../packages/core/src/services/invitations';
import { authOptions } from '@/lib/auth';

const bulkInvitationSchema = z.object({
  organizationId: z.string(),
  emails: z.array(z.string().email()).min(1).max(100),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
  message: z.string().optional(),
  subject: z.string().optional(),
  templateId: z.string().optional(),
  batchName: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = bulkInvitationSchema.parse(body);

    const batch = await invitationsService.createBulkInvitations({
      ...validated,
      createdBy: session.user.id!,
      createdByEmail: session.user.email!,
    });

    // TODO: Process bulk email sending in background job

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating bulk invitations:', error);
    return NextResponse.json(
      { error: 'Failed to create bulk invitations' },
      { status: 500 }
    );
  }
}
