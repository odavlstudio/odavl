// RBAC System Configuration
export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  actions: ('read' | 'write' | 'delete' | 'admin')[];
}

export const ROLES: Record<string, Role> = {
  admin: {
    id: 'admin',
    name: 'Administrator',
    permissions: [
      { resource: '*', actions: ['read', 'write', 'delete', 'admin'] }
    ]
  },
  developer: {
    id: 'developer',
    name: 'Developer',
    permissions: [
      { resource: 'projects', actions: ['read', 'write'] },
      { resource: 'detections', actions: ['read'] },
      { resource: 'dashboards', actions: ['read', 'write'] }
    ]
  },
  viewer: {
    id: 'viewer',
    name: 'Viewer',
    permissions: [
      { resource: 'projects', actions: ['read'] },
      { resource: 'detections', actions: ['read'] },
      { resource: 'dashboards', actions: ['read'] }
    ]
  }
};