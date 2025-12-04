'use client';

import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/trpc/router';
import superjson from 'superjson';

/**
 * Create tRPC React hooks
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Get base URL for API calls
 */
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser should use relative path
    return '';
  }

  // SSR should use vercel url
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Dev SSR should use localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * Create tRPC client
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        // You can pass any HTTP headers you wish here
        async headers() {
          return {
            // Add any custom headers here
          };
        },
      }),
    ],
  });
}
