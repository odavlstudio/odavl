/**
 * Role-Based Access Control (RBAC) System
 * 5 roles: viewer, developer, lead, admin, owner
 * 
 * Week 9-10: Enterprise Features
 * UNIFIED_ACTION_PLAN Phase 2 Month 3
 */

export type Role = 'viewer' | 'developer' | 'lead' | 'admin' | 'owner';

export type Permission =
    // Read permissions
    | 'read:dashboard'
    | 'read:reports'
    | 'read:insights'
    | 'read:autopilot'
    | 'read:guardian'
    | 'read:logs'
    | 'read:metrics'
    | 'read:settings'
    | 'read:users'
    | 'read:audit'
    // Write permissions
    | 'write:insights'
    | 'write:autopilot'
    | 'write:guardian'
    | 'write:settings'
    | 'write:users'
    | 'write:team'
    | 'write:billing'
    // Execute permissions
    | 'execute:autopilot'
    | 'execute:guardian'
    | 'execute:scans'
    // Admin permissions
    | 'admin:manage-roles'
    | 'admin:manage-saml'
    | 'admin:manage-api-keys'
    | 'admin:view-audit'
    | 'admin:export-data'
    | 'admin:delete-data';

export interface RoleDefinition {
    name: Role;
    displayName: string;
    description: string;
    permissions: Permission[];
    level: number; // Hierarchy level (higher = more privileged)
}

/**
 * Role hierarchy and permissions matrix
 */
export const ROLE_DEFINITIONS: Record<Role, RoleDefinition> = {
    viewer: {
        name: 'viewer',
        displayName: 'Viewer',
        description: 'Read-only access to dashboards and reports',
        level: 1,
        permissions: [
            'read:dashboard',
            'read:reports',
            'read:insights',
            'read:metrics',
        ],
    },

    developer: {
        name: 'developer',
        displayName: 'Developer',
        description: 'Can run analyses and view detailed results',
        level: 2,
        permissions: [
            'read:dashboard',
            'read:reports',
            'read:insights',
            'read:autopilot',
            'read:guardian',
            'read:metrics',
            'read:logs',
            'execute:scans',
            'write:insights',
        ],
    },

    lead: {
        name: 'lead',
        displayName: 'Tech Lead',
        description: 'Can execute automation and configure team settings',
        level: 3,
        permissions: [
            'read:dashboard',
            'read:reports',
            'read:insights',
            'read:autopilot',
            'read:guardian',
            'read:metrics',
            'read:logs',
            'read:settings',
            'execute:scans',
            'execute:autopilot',
            'execute:guardian',
            'write:insights',
            'write:autopilot',
            'write:guardian',
            'write:settings',
        ],
    },

    admin: {
        name: 'admin',
        displayName: 'Administrator',
        description: 'Full access except billing and owner operations',
        level: 4,
        permissions: [
            'read:dashboard',
            'read:reports',
            'read:insights',
            'read:autopilot',
            'read:guardian',
            'read:metrics',
            'read:logs',
            'read:settings',
            'read:users',
            'read:audit',
            'execute:scans',
            'execute:autopilot',
            'execute:guardian',
            'write:insights',
            'write:autopilot',
            'write:guardian',
            'write:settings',
            'write:users',
            'write:team',
            'admin:manage-roles',
            'admin:manage-api-keys',
            'admin:view-audit',
            'admin:export-data',
        ],
    },

    owner: {
        name: 'owner',
        displayName: 'Owner',
        description: 'Full system access including billing and SAML',
        level: 5,
        permissions: [
            'read:dashboard',
            'read:reports',
            'read:insights',
            'read:autopilot',
            'read:guardian',
            'read:metrics',
            'read:logs',
            'read:settings',
            'read:users',
            'read:audit',
            'execute:scans',
            'execute:autopilot',
            'execute:guardian',
            'write:insights',
            'write:autopilot',
            'write:guardian',
            'write:settings',
            'write:users',
            'write:team',
            'write:billing',
            'admin:manage-roles',
            'admin:manage-saml',
            'admin:manage-api-keys',
            'admin:view-audit',
            'admin:export-data',
            'admin:delete-data',
        ],
    },
};

/**
 * Check if role has specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
    const definition = ROLE_DEFINITIONS[role];
    return definition.permissions.includes(permission);
}

/**
 * Check if user can access resource
 */
export function canAccess(
    userRole: Role,
    requiredPermission: Permission
): boolean {
    return hasPermission(userRole, requiredPermission);
}

/**
 * Check if role can perform action on another role
 * (Users can only manage roles below their level)
 */
export function canManageRole(
    managerRole: Role,
    targetRole: Role
): boolean {
    const managerLevel = ROLE_DEFINITIONS[managerRole].level;
    const targetLevel = ROLE_DEFINITIONS[targetRole].level;
    
    // Owner can manage everyone
    if (managerRole === 'owner') {
        return true;
    }
    
    // Admin can manage up to lead
    if (managerRole === 'admin') {
        return targetLevel < 4;
    }
    
    // Others can only manage roles below them
    return managerLevel > targetLevel;
}

/**
 * Get all permissions for role
 */
export function getRolePermissions(role: Role): Permission[] {
    return ROLE_DEFINITIONS[role].permissions;
}

/**
 * Get role display info
 */
export function getRoleInfo(role: Role): RoleDefinition {
    return ROLE_DEFINITIONS[role];
}

/**
 * Get all available roles for user to assign
 * (Based on their own role)
 */
export function getAssignableRoles(userRole: Role): Role[] {
    const userLevel = ROLE_DEFINITIONS[userRole].level;
    
    return (Object.keys(ROLE_DEFINITIONS) as Role[]).filter(role => {
        const roleLevel = ROLE_DEFINITIONS[role].level;
        return roleLevel < userLevel;
    });
}

/**
 * Check if role has any of the permissions
 */
export function hasAnyPermission(
    role: Role,
    permissions: Permission[]
): boolean {
    return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if role has all permissions
 */
export function hasAllPermissions(
    role: Role,
    permissions: Permission[]
): boolean {
    return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Permission check middleware for Express/Next.js
 */
export function requirePermission(permission: Permission) {
    return (req: any, res: any, next: any) => {
        const user = req.user;
        
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!hasPermission(user.role, permission)) {
            return res.status(403).json({ 
                error: 'Forbidden',
                message: `Required permission: ${permission}`,
            });
        }

        next();
    };
}

/**
 * Role check middleware
 */
export function requireRole(role: Role | Role[]) {
    const roles = Array.isArray(role) ? role : [role];
    
    return (req: any, res: any, next: any) => {
        const user = req.user;
        
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!roles.includes(user.role)) {
            return res.status(403).json({ 
                error: 'Forbidden',
                message: `Required role: ${roles.join(' or ')}`,
            });
        }

        next();
    };
}

/**
 * Minimum role level middleware
 */
export function requireMinRole(minRole: Role) {
    const minLevel = ROLE_DEFINITIONS[minRole].level;
    
    return (req: any, res: any, next: any) => {
        const user = req.user;
        
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userLevel = ROLE_DEFINITIONS[user.role as Role].level;
        
        if (userLevel < minLevel) {
            return res.status(403).json({ 
                error: 'Forbidden',
                message: `Required minimum role: ${minRole}`,
            });
        }

        next();
    };
}

/**
 * Export role hierarchy for UI display
 */
export const ROLE_HIERARCHY: Role[] = [
    'viewer',
    'developer',
    'lead',
    'admin',
    'owner',
];

/**
 * Get role color for UI
 */
export function getRoleColor(role: Role): string {
    const colors: Record<Role, string> = {
        viewer: '#6B7280',     // Gray
        developer: '#3B82F6',  // Blue
        lead: '#8B5CF6',       // Purple
        admin: '#F59E0B',      // Orange
        owner: '#EF4444',      // Red
    };
    
    return colors[role];
}
