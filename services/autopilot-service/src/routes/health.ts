/**
 * Health Check Endpoint
 * GET /api/health
 */

import { Router, type Router as RouterType } from 'express';
import * as autopilot from '@odavl-studio/autopilot-engine';

const router: RouterType = Router();

router.get('/', async (req, res) => {
  try {
    // Get autopilot engine information
    const engineInfo = {
      available: true,
      phases: Object.keys(autopilot).filter(key => typeof autopilot[key as keyof typeof autopilot] === 'function'),
      version: '2.0.0', // From package.json
    };

    res.json({
      service: 'autopilot-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      engine: engineInfo,
      port: process.env.PORT || 3004,
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      service: 'autopilot-service',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as healthRouter };
