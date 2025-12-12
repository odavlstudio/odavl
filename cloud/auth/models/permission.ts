/**
 * Permission Model - Role-based access control
 */

export enum ResourceType {
  PROJECT = 'project',
  TEAM = 'team',
  ORGANIZATION = 'organization',
  MARKETPLACE = 'marketplace',
}

export enum Action {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin',
}

export interface Permission {
  id: string;
  userId: string;
  resourceType: ResourceType;
  resourceId: string;
  actions: Action[];
  createdAt: Date;
}

export class PermissionManager {
  private permissions: Map<string, Permission> = new Map();

  grantPermission(params: Omit<Permission, 'id' | 'createdAt'>): Permission {
    const permission: Permission = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...params,
    };
    this.permissions.set(permission.id, permission);
    return permission;
  }

  checkPermission(userId: string, resourceType: ResourceType, resourceId: string, action: Action): boolean {
    return Array.from(this.permissions.values()).some(
      (p) =>
        p.userId === userId &&
        p.resourceType === resourceType &&
        p.resourceId === resourceId &&
        (p.actions.includes(action) || p.actions.includes(Action.ADMIN))
    );
  }

  revokePermission(id: string): boolean {
    return this.permissions.delete(id);
  }

  listPermissions(userId: string): Permission[] {
    return Array.from(this.permissions.values()).filter((p) => p.userId === userId);
  }
}
