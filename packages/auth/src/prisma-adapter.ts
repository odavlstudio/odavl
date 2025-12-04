/**
 * Prisma Database Adapter for AuthService
 * 
 * Implements the database operations required by AuthService using Prisma ORM.
 * This adapter bridges the gap between the generic AuthService and Prisma Client.
 * 
 * @example
 * ```typescript
 * import { PrismaClient } from '@prisma/client';
 * import { AuthService } from '@odavl-studio/auth';
 * import { createPrismaAdapter } from '@odavl-studio/auth/prisma-adapter';
 * 
 * const prisma = new PrismaClient();
 * const adapter = createPrismaAdapter(prisma);
 * const authService = new AuthService(adapter);
 * 
 * // Now you can use authService
 * const result = await authService.register({
 *   email: 'user@example.com',
 *   password: 'SecureP@ss123',
 *   name: 'John Doe'
 * });
 * ```
 */

import type { PrismaClient, User } from '@prisma/client';
import type { User as AuthUser, RegisterInput } from './auth-service.js';

/**
 * Database adapter interface required by AuthService
 */
export interface DatabaseAdapter {
  findUserByEmail(email: string): Promise<AuthUser | null>;
  findUserById(id: string): Promise<AuthUser | null>;
  createUser(input: RegisterInput & { passwordHash: string }): Promise<AuthUser>;
  updateUser(id: string, data: Partial<AuthUser>): Promise<AuthUser>;
  deleteUser(id: string): Promise<void>;
  findUserByVerificationToken(token: string): Promise<AuthUser | null>;
  findUserByPasswordResetToken(token: string): Promise<AuthUser | null>;
}

/**
 * Convert Prisma User to AuthUser format
 */
function toAuthUser(prismaUser: User): AuthUser {
  return {
    id: prismaUser.id,
    email: prismaUser.email,
    passwordHash: prismaUser.passwordHash,
    name: prismaUser.name ?? undefined,
    emailVerified: prismaUser.emailVerified,
    emailVerificationToken: prismaUser.emailVerificationToken ?? undefined,
    passwordResetToken: prismaUser.passwordResetToken ?? undefined,
    passwordResetExpiry: prismaUser.passwordResetExpiry ?? undefined,
    role: prismaUser.role,
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt,
  };
}

/**
 * Create a Prisma-based database adapter for AuthService
 * 
 * @param prisma - Prisma Client instance
 * @returns Database adapter that AuthService can use
 * 
 * @example
 * ```typescript
 * import { PrismaClient } from '@prisma/client';
 * 
 * const prisma = new PrismaClient();
 * const adapter = createPrismaAdapter(prisma);
 * ```
 */
export function createPrismaAdapter(prisma: PrismaClient): DatabaseAdapter {
  return {
    async findUserByEmail(email: string): Promise<AuthUser | null> {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return user ? toAuthUser(user) : null;
    },

    async findUserById(id: string): Promise<AuthUser | null> {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      return user ? toAuthUser(user) : null;
    },

    async createUser(input: RegisterInput & { passwordHash: string }): Promise<AuthUser> {
      const user = await prisma.user.create({
        data: {
          email: input.email,
          passwordHash: input.passwordHash,
          name: input.name,
          emailVerified: false,
          emailVerificationToken: input.emailVerificationToken,
        },
      });
      return toAuthUser(user);
    },

    async updateUser(id: string, data: Partial<AuthUser>): Promise<AuthUser> {
      const user = await prisma.user.update({
        where: { id },
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          name: data.name,
          emailVerified: data.emailVerified,
          emailVerificationToken: data.emailVerificationToken,
          passwordResetToken: data.passwordResetToken,
          passwordResetExpiry: data.passwordResetExpiry,
        },
      });
      return toAuthUser(user);
    },

    async deleteUser(id: string): Promise<void> {
      await prisma.user.delete({
        where: { id },
      });
    },

    async findUserByVerificationToken(token: string): Promise<AuthUser | null> {
      const user = await prisma.user.findUnique({
        where: { emailVerificationToken: token },
      });
      return user ? toAuthUser(user) : null;
    },

    async findUserByPasswordResetToken(token: string): Promise<AuthUser | null> {
      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpiry: {
            gt: new Date(), // Token must not be expired
          },
        },
      });
      return user ? toAuthUser(user) : null;
    },
  };
}

/**
 * Type guard to check if an error is a Prisma known request error
 */
export function isPrismaError(error: unknown): error is { code: string; meta?: Record<string, unknown> } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

/**
 * Convert Prisma errors to user-friendly messages
 */
export function handlePrismaError(error: unknown): Error {
  if (isPrismaError(error)) {
    switch (error.code) {
      case 'P2002':
        return new Error('User with this email already exists');
      case 'P2025':
        return new Error('User not found');
      case 'P2003':
        return new Error('Invalid foreign key constraint');
      default:
        return new Error(`Database error: ${error.code}`);
    }
  }
  
  if (error instanceof Error) {
    return error;
  }
  
  return new Error('Unknown database error');
}
