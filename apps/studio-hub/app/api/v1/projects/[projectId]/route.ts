/**
 * Single Project API Routes
 * GET /api/v1/projects/:projectId - Get project details
 * PATCH /api/v1/projects/:projectId - Update project
 * DELETE /api/v1/projects/:projectId - Delete project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { organizationService } from '@odavl-studio/core/services/organization';
import { projectService } from '@odavl-studio/core/services/project';
import { z } from 'zod';

const updateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  workspacePath: z.string().optional(),
  settings: z.record(z.any()).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DELETED']).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId } = params;

    const project = await projectService.getProject(projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check permission
    const hasPermission = await organizationService.hasPermission(
      project.organizationId,
      session.user.id,
      'projects:read'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get project statistics
    const stats = await projectService.getProjectStats(projectId);

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId } = params;

    const existingProject = await projectService.getProject(projectId);

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check permission
    const hasPermission = await organizationService.hasPermission(
      existingProject.organizationId,
      session.user.id,
      'projects:update'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = updateProjectSchema.parse(body);

    const project = await projectService.updateProject(projectId, validatedData);

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId } = params;

    const project = await projectService.getProject(projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check permission
    const hasPermission = await organizationService.hasPermission(
      project.organizationId,
      session.user.id,
      'projects:delete'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    await projectService.deleteProject(projectId);

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
