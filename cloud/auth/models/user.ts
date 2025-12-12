/**
 * User Model - Core user entity
 */

export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
  OWNER = 'owner',
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  organizationId?: string;
  role: UserRole;
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export class UserManager {
  private users: Map<string, User> = new Map();

  createUser(params: Omit<User, 'id' | 'createdAt'>): User {
    const user: User = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...params,
    };
    this.users.set(user.id, user);
    return user;
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find((u) => u.email === email);
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const user = this.users.get(id);
    if (!user) return null;
    Object.assign(user, updates);
    return user;
  }

  deleteUser(id: string): boolean {
    return this.users.delete(id);
  }
}
