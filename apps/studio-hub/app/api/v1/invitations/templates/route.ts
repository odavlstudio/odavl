/**
 * Invitation Templates API Routes
 * GET /api/v1/invitations/templates - Get templates
 * POST /api/v1/invitations/templates - Create template
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { invitationsService } from '@odavl-studio/core/services/invitations';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const createTemplateSchema = z.object({
  name: z.string(),
  subject: z.string(),
  message: z.string(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
  expiresInDays: z.number().min(1).max(30),
  organizationId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const templates = await invitationsService.getTemplates(organizationId);

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createTemplateSchema.parse(body);

    const template = await invitationsService.createTemplate({
      ...validated,
      createdBy: session.user.id!,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
