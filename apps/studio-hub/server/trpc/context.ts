import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';

/**
 * Creates context for tRPC procedures
 * - Includes authenticated user session
 * - Provides Prisma client access
 * - Used for authorization checks
 */
export async function createContext() {
  const session = await getServerSession(authOptions);

  return {
    session,
    prisma,
    user: session?.user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

/**
 * Helper to ensure user is authenticated
 * Throws if no session exists
 */
export function requireAuth(ctx: Context): asserts ctx is Context & {
  session: Session;
  user: NonNullable<Session['user']>;
} {
  if (!ctx.session || !ctx.user) {
    throw new Error('Unauthorized - please sign in');
  }
}

/**
 * Helper to ensure user has access to organization
 */
export async function requireOrgAccess(ctx: Context, orgId: string) {
  requireAuth(ctx);

  const user = await ctx.prisma.user.findFirst({
    where: {
      id: ctx.user.id,
      orgId,
    },
  });

  if (!user) {
    throw new Error('Forbidden - no access to this organization');
  }

  return user;
}

