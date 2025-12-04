import { router } from './trpc';
import { insightRouter } from './routers/insight';
import { autopilotRouter } from './routers/autopilot';
import { guardianRouter } from './routers/guardian';
import { organizationRouter } from './routers/organization';

/**
 * Main tRPC application router
 * Combines all sub-routers for different features
 */
export const appRouter = router({
  insight: insightRouter,
  autopilot: autopilotRouter,
  guardian: guardianRouter,
  organization: organizationRouter,
});

// Export type definition for use in client
export type AppRouter = typeof appRouter;
