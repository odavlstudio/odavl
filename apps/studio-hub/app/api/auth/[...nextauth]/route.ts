/**
 * NextAuth.js Route Handler
 * Handles authentication endpoints for GitHub & Google OAuth
 * Auth configuration moved to lib/auth.ts for Next.js 15 compatibility
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// NOTE: Do NOT re-export authOptions here - Next.js 15 route handlers can only export GET/POST/etc
// Import authOptions directly from '@/lib/auth' in API routes that need it
