/**
 * API Authentication Utilities
 * Verifies API keys and enforces RBAC
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export interface ApiKeyAuth {
  userId: string;
  organizationId: string;
  scopes: string[];
}

/**
 * Verify API key and return user/org context
 */
export async function verifyApiKey(apiKey: string): Promise<ApiKeyAuth> {
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  const key = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: {
      user: {
        include: {
          memberships: {
            take: 1,
            include: { organization: true },
          },
        },
      },
    },
  });

  if (!key || key.revokedAt) {
    throw new Error('Invalid API key');
  }

  // Update last used
  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  const org = key.user.memberships[0]?.organization;
  if (!org) {
    throw new Error('No organization found');
  }

  return {
    userId: key.userId,
    organizationId: org.id,
    scopes: key.scopes,
  };
}

/**
 * Check if API key has required scope
 */
export function hasScope(auth: ApiKeyAuth, requiredScope: string): boolean {
  return auth.scopes.includes(requiredScope) || auth.scopes.includes('*');
}
