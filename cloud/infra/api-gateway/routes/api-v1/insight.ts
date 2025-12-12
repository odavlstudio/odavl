/**
 * API v1 - Insight Routes
 * Trigger Insight analysis
 */

import { Router } from 'express';

const router = Router();

router.post('/run', async (req, res) => {
  const { projectId, detectors } = req.body;
  // Skeleton: Would trigger Insight analysis
  res.json({
    runId: `insight-${Date.now()}`,
    projectId,
    detectors: detectors || ['typescript', 'eslint', 'security'],
    status: 'queued',
    estimatedDuration: 60,
  });
});

router.get('/run/:runId', async (req, res) => {
  const { runId } = req.params;
  // Skeleton: Would fetch run status
  res.json({
    runId,
    status: 'completed',
    issues: [
      { severity: 'error', message: 'Unused variable', file: 'src/index.ts', line: 10 },
    ],
  });
});

export { router as insightRouter };
