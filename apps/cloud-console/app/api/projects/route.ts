/**
 * Projects API - RBAC Protected with Organization Isolation
 * Manage projects within organization boundaries
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withPermission, withOrgContext, createOrgIsolation } from '@/lib/rbac-middleware';
import { OrgContext } from '@/lib/org-context';
import { prisma } from '@/lib/prisma';
import { auditProjectChange } from '@/lib/audit';

// ============================================================================
// Request Schemas
// ============================================================================

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  repository: z.string().url().optional(),
  branch: z.string().default('main'),
  language: z.string().default('typescript'),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  repository: z.string().url().optional(),
  branch: z.string().optional(),
  language: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DELETED']).optional(),
});

// ============================================================================
// GET /api/projects - List organization projects
// ============================================================================

export const GET = withOrgContext(async (req: NextRequest, context: OrgContext) => {
  try {
    const orgIsolation = createOrgIsolation(context);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ACTIVE';

    const projects = await prisma.project.findMany({
      where: orgIsolation.where({
        status: status as any,
      }),
      select: {
        id: true,
        name: true,
        slug: true,
        repository: true,
        branch: true,
        language: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            errorSignatures: true,
            fixAttestations: true,
            auditResults: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch projects' },
      { status: 500 }
    );
  }
});

// ============================================================================
// POST /api/projects - Create project (DEVELOPER+)
// ============================================================================

export const POST = withPermission('projects:create', async (req: NextRequest, context: OrgContext) => {
  try {
    const body = await req.json();
    const data = createProjectSchema.parse(body);

    // Check for duplicate slug in organization
    const existing = await prisma.project.findFirst({
      where: {
        organizationId: context.organizationId,
        slug: data.slug,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Project with slug '${data.slug}' already exists` },
        { status: 400 }
      );
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        ...data,
        organizationId: context.organizationId,
      },
    });

    // Audit log
    await auditProjectChange(
      context.organizationId,
      context.userId,
      project.id,
      'created',
      { name: project.name, slug: project.slug }
    );

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create project' },
      { status: 500 }
    );
  }
});

// ============================================================================
// PATCH /api/projects/[id] - Update project (DEVELOPER+)
// ============================================================================

export const PATCH = withPermission('projects:update', async (req: NextRequest, context: OrgContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Verify ownership
    const orgIsolation = createOrgIsolation(context);
    await orgIsolation.requireProjectOwnership(projectId);

    const body = await req.json();
    const data = updateProjectSchema.parse(body);

    // Update project
    const project = await prisma.project.update({
      where: { id: projectId },
      data,
    });

    // Audit log
    await auditProjectChange(
      context.organizationId,
      context.userId,
      project.id,
      'updated',
      data
    );

    return NextResponse.json({ project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update project' },
      { status: 500 }
    );
  }
});

// ============================================================================
// DELETE /api/projects/[id] - Delete project (ADMIN+)
// ============================================================================

export const DELETE = withPermission('projects:delete', async (req: NextRequest, context: OrgContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Verify ownership
    const orgIsolation = createOrgIsolation(context);
    await orgIsolation.requireProjectOwnership(projectId);

    // Soft delete (update status)
    const project = await prisma.project.update({
      where: { id: projectId },
      data: { status: 'DELETED' },
    });

    // Audit log
    await auditProjectChange(
      context.organizationId,
      context.userId,
      project.id,
      'deleted',
      { name: project.name }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete project' },
      { status: 500 }
    );
  }
});
