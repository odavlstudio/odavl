/**
 * Project Service Stub
 * Original implementation used organizationId field (studio-hub uses orgId)
 */

export interface CreateProjectData {
  organizationId?: string;
  orgId?: string;
  name: string;
  description?: string;
  workspacePath?: string;
  repoUrl?: string;
  settings?: Record<string, any>;
  status?: string;
}

export class ProjectService {
  async createProject(data: CreateProjectData): Promise<any> {
    throw new Error('ProjectService not implemented in packages/core. Use app-specific project service.');
  }

  async getProject(projectId: string): Promise<any> {
    throw new Error('ProjectService not implemented in packages/core. Use app-specific project service.');
  }

  async updateProject(projectId: string, data: Partial<CreateProjectData>): Promise<any> {
    throw new Error('ProjectService not implemented in packages/core. Use app-specific project service.');
  }

  async deleteProject(projectId: string): Promise<void> {
    throw new Error('ProjectService not implemented in packages/core. Use app-specific project service.');
  }

  async getOrganizationProjects(orgId: string, status?: string): Promise<any[]> {
    throw new Error('ProjectService not implemented in packages/core. Use app-specific project service.');
  }

  async getUserProjects(userId: string): Promise<any[]> {
    throw new Error('ProjectService not implemented in packages/core. Use app-specific project service.');
  }

  async getProjectStats(projectId: string): Promise<any> {
    throw new Error('ProjectService not implemented in packages/core. Use app-specific project service.');
  }
}

export const projectService = new ProjectService();
