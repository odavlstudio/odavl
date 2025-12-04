import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/trpc/router';
import { createContext } from '@/server/trpc/context';
import { logger } from '@/lib/logger';

/**
 * tRPC API route handler
 * Handles all /api/trpc/* requests
 */
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            logger.error('tRPC failed', { path: path ?? '<no-path>', message: error.message });
          }
        : undefined,
  });

export { handler as GET, handler as POST };
