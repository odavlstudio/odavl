/**
 * Session Management Utilities
 * Handles session hardening and device tracking
 */

import { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';

export interface DeviceInfo {
  userAgent: string;
  ip: string;
  lastActiveAt: Date;
}

/**
 * Regenerate session token for security
 */
export async function regenerateSession(sessionToken: string): Promise<string> {
  const session = await prisma.session.findUnique({
    where: { sessionToken },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  const newToken = generateSecureToken();

  await prisma.session.update({
    where: { sessionToken },
    data: { sessionToken: newToken },
  });

  return newToken;
}

/**
 * Track device for session
 */
export async function trackDevice(
  sessionToken: string,
  deviceInfo: DeviceInfo
): Promise<void> {
  // Store device metadata in session
  await prisma.session.update({
    where: { sessionToken },
    data: {
      // Extend Session model to include device info
    },
  });
}

function generateSecureToken(): string {
  return crypto.randomUUID();
}
