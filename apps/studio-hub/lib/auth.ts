/**
 * NextAuth.js Configuration
 * Shared authentication options for Next-Auth
 * Separated from route handler to comply with Next.js 15 restrictions
 */

import { type NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GithubProvider({
      clientId: env.GITHUB_ID,
      clientSecret: env.GITHUB_SECRET,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          email: profile.email!,
          image: profile.avatar_url,
          role: 'USER',
        };
      },
    }),

    GoogleProvider({
      clientId: env.GOOGLE_ID,
      clientSecret: env.GOOGLE_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: 'USER',
        };
      },
    }),
  ],

  callbacks: {
    async session({ session, user }) {
      // Attach additional user data to session
      if (session.user) {
        return {
          ...session,
          user: {
            ...session.user,
            id: user.id,
            role: user.role,
            orgId: user.orgId ?? null,
          },
        };
      }
      return session;
    },

    async signIn({ user }) {
      // Create audit log (if enabled)
      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'SIGN_IN',
            resource: 'auth',
          },
        });
      } catch (error) {
        logger.error('Failed to create audit log', { error, userId: user.id });
        // Don't block sign-in if audit log fails
      }

      return true;
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  debug: env.NODE_ENV === 'development',
};
