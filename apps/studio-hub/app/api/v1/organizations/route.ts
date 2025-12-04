/**
 * Organizations API Routes
 * GET /api/v1/organizations - List user organizations
 * POST /api/v1/organizations - Create new organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { organizationService } from "../../../../../../packages/core/src/services/organization";
import { SubscriptionPlan } from "../../../../../../packages/types/src/multi-tenant";
import { z } from 'zod';

const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(500).optional(),
  plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const organizations = await organizationService.getUserOrganizations(session.user.id);

    return NextResponse.json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = createOrgSchema.parse(body);

    // Check if slug is available
    const existing = await organizationService.getOrganizationBySlug(validatedData.slug);
    if (existing) {
      return NextResponse.json(
        { error: 'Organization slug already taken' },
        { status: 409 }
      );
    }

    const organization = await organizationService.createOrganization({
      name: validatedData.name,
      slug: validatedData.slug,
      description: validatedData.description,
      ownerId: session.user.id,
      plan: validatedData.plan as SubscriptionPlan | undefined,
    });

    return NextResponse.json({
      success: true,
      data: organization,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}
