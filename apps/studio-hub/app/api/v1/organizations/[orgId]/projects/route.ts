/**
 * Projects API Routes
 * GET /api/v1/organizations/:orgId/projects - List projects
 * POST /api/v1/organizations/:orgId/projects - Create project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { organizationService } from '../../../../../../../../packages/core/src/services/organization';
import { projectService } from '../../../../../../../../packages/core/src/services/project';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  workspacePath: z.string().optional(),
  settings: z.record(z.any()).optional(),
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

    // Check permission
    const hasPermission = await organizationService.hasPermission(
      orgId,
      session.user.id,
      'projects:read'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as any;

    const projects = await projectService.getOrganizationProjects(orgId, status);

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
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
      'projects:create'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check project limits
    const limits = await organizationService.checkUsageLimits(orgId);
    if (limits.projects.exceeded) {
      return NextResponse.json(
        {
          error: 'Project limit exceeded',
          details: `Current plan allows ${limits.projects.limit} projects`,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = createProjectSchema.parse(body);

    const project = await projectService.createProject({
      organizationId: orgId,
      name: validatedData.name,
      description: validatedData.description,
      workspacePath: validatedData.workspacePath,
      settings: validatedData.settings,
    });

    return NextResponse.json(
      {
        success: true,
        data: project,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
