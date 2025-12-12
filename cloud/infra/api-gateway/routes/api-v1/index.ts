/**
 * API v1 Router Aggregator
 * Mounts all v1 routes
 */

import { Router } from 'express';
import { authRouter } from './auth.js';
import { projectsRouter } from './projects.js';
import { insightRouter } from './insight.js';
import { autopilotRouter } from './autopilot.js';
import { guardianRouter } from './guardian.js';

const apiV1Router = Router();

// Mount sub-routers
apiV1Router.use('/auth', authRouter);
apiV1Router.use('/projects', projectsRouter);
apiV1Router.use('/insight', insightRouter);
apiV1Router.use('/autopilot', autopilotRouter);
apiV1Router.use('/guardian', guardianRouter);

// Health check for API v1
apiV1Router.get('/health', (_req, res) => {
  res.json({
    version: 'v1',
    status: 'ok',
    endpoints: ['/auth', '/projects', '/insight', '/autopilot', '/guardian'],
  });
});

export { apiV1Router };
