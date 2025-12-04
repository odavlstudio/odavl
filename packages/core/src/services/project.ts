/**
 * Project Service
 * Manages organization projects and workspaces
 */

import { prisma } from '@/lib/prisma';
import type { Project, ProjectStatus } from '@odavl/types/multi-tenant';

export class ProjectService {
  /**
   * Create project
   */
  async createProject(data: {
    organizationId: string;
    name: string;
    description?: string;
    workspacePath?: string;
    settings?: Record<string, any>;
  }): Promise<Project> {
    const project = await prisma.project.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        description: data.description,
        workspacePath: data.workspacePath,
        settings: data.settings || {},
        status: 'ACTIVE',
      },
    });

    return project as any;
  }

  /**
   * Get project by ID
   */
  async getProject(id: string): Promise<Project | null> {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        errorSignatures: {
          take: 10,
          orderBy: {
            lastSeen: 'desc',
          },
        },
      },
    });

    return project as any;
  }

  /**
   * Get organization projects
   */
  async getOrganizationProjects(
    organizationId: string,
    status?: ProjectStatus
  ): Promise<Project[]> {
    const projects = await prisma.project.findMany({
      where: {
        organizationId,
        ...(status ? { status } : {}),
      },
      include: {
        _count: {
          select: {
            errorSignatures: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return projects as any;
  }

  /**
   * Update project
   */
  async updateProject(
    id: string,
    data: {
      name?: string;
      description?: string;
      workspacePath?: string;
      settings?: Record<string, any>;
      status?: ProjectStatus;
    }
  ): Promise<Project> {
    const project = await prisma.project.update({
      where: { id },
      data,
    });

    return project as any;
  }

  /**
   * Delete project
   */
  async deleteProject(id: string): Promise<void> {
    await prisma.project.update({
      where: { id },
      data: {
        status: 'DELETED',
      },
    });
  }

  /**
   * Archive project
   */
  async archiveProject(id: string): Promise<Project> {
    const project = await prisma.project.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
      },
    });

    return project as any;
  }

  /**
   * Restore archived project
   */
  async restoreProject(id: string): Promise<Project> {
    const project = await prisma.project.update({
      where: { id },
      data: {
        status: 'ACTIVE',
      },
    });

    return project as any;
  }

  /**
   * Update last sync timestamp
   */
  async updateLastSync(id: string): Promise<void> {
    await prisma.project.update({
      where: { id },
      data: {
        lastSyncAt: new Date(),
      },
    });
  }

  /**
   * Get project statistics
   */
  async getProjectStats(id: string): Promise<{
    totalErrors: number;
    criticalErrors: number;
    resolvedErrors: number;
    lastAnalysis?: Date;
  }> {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        errorSignatures: {
          select: {
            severity: true,
            status: true,
            lastSeen: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const totalErrors = project.errorSignatures.length;
    const criticalErrors = project.errorSignatures.filter(
      (e) => e.severity === 'critical' || e.severity === 'high'
    ).length;
    const resolvedErrors = project.errorSignatures.filter(
      (e) => e.status === 'resolved'
    ).length;

    const lastAnalysis = project.errorSignatures.length > 0
      ? new Date(
          Math.max(
            ...project.errorSignatures.map((e) => new Date(e.lastSeen).getTime())
          )
        )
      : undefined;

    return {
      totalErrors,
      criticalErrors,
      resolvedErrors,
      lastAnalysis,
    };
  }
}

export const projectService = new ProjectService();
