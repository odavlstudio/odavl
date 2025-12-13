/**
 * Prisma Adapter for AuthService
 * Full implementation with email verification and password reset support
 */

import type { PrismaClient } from '@prisma/client';
import type { User } from '@odavl-studio/auth';

interface DatabaseAdapter {
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(data: {
    email: string;
    passwordHash: string;
    name?: string;
    emailVerified: boolean;
    role: string;
  }): Promise<User>;
  verifyUserEmail(userId: string): Promise<void>;
  createPasswordResetToken(userId: string): Promise<string>;
  verifyPasswordResetToken(token: string): Promise<string | null>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}

export function createPrismaAdapter(prisma: PrismaClient): DatabaseAdapter {
  return {
    async findUserByEmail(email: string): Promise<User | null> {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      
      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        name: user.name ?? undefined,
        emailVerified: user.emailVerified,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    },

    async findUserById(id: string): Promise<User | null> {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      
      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        name: user.name ?? undefined,
        emailVerified: user.emailVerified,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    },

    async createUser(data: {
      email: string;
      passwordHash: string;
      name?: string;
      emailVerified: boolean;
      role: string;
    }): Promise<User> {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          name: data.name,
          emailVerified: data.emailVerified,
          role: data.role.toUpperCase() as any,
        },
      });

      return {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        name: user.name ?? undefined,
        emailVerified: user.emailVerified,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    },

    async verifyUserEmail(userId: string): Promise<void> {
      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true, emailVerificationToken: null },
      });
    },

    async createPasswordResetToken(userId: string): Promise<string> {
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordResetToken: token,
          passwordResetExpiry: expiry,
        },
      });

      return token;
    },

    async verifyPasswordResetToken(token: string): Promise<string | null> {
      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpiry: { gt: new Date() },
        },
      });

      return user?.id ?? null;
    },

    async updatePassword(userId: string, passwordHash: string): Promise<void> {
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      });
    },
  };
}
