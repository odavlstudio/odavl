/**
 * Project Model - User projects within organizations
 */

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  repositoryUrl?: string;
  ownerId: string;
  teamIds: string[];
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class ProjectManager {
  private projects: Map<string, Project> = new Map();

  createProject(params: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const now = new Date();
    const project: Project = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...params,
    };
    this.projects.set(project.id, project);
    return project;
  }

  getProjectById(id: string): Project | undefined {
    return this.projects.get(id);
  }

  listProjects(organizationId: string): Project[] {
    return Array.from(this.projects.values()).filter((p) => p.organizationId === organizationId);
  }

  updateProject(id: string, updates: Partial<Project>): Project | null {
    const project = this.projects.get(id);
    if (!project) return null;
    Object.assign(project, { ...updates, updatedAt: new Date() });
    return project;
  }

  deleteProject(id: string): boolean {
    return this.projects.delete(id);
  }

  addTeam(projectId: string, teamId: string): boolean {
    const project = this.projects.get(projectId);
    if (!project || project.teamIds.includes(teamId)) return false;
    project.teamIds.push(teamId);
    return true;
  }
}
