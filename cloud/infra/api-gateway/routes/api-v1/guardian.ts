/**
 * API v1 - Guardian Routes
 * Trigger Guardian website tests
 */

import { Router } from 'express';

const router = Router();

router.post('/test', async (req, res) => {
  const { url, suites } = req.body;
  // Skeleton: Would trigger Guardian test
  res.json({
    testId: `guardian-${Date.now()}`,
    url,
    suites: suites || ['accessibility', 'performance', 'security'],
    status: 'queued',
  });
});

router.get('/test/:testId', async (req, res) => {
  const { testId } = req.params;
  // Skeleton: Would fetch test results
  res.json({
    testId,
    status: 'completed',
    results: {
      accessibility: { score: 95, issues: [] },
      performance: { score: 88, lcp: 1200 },
      security: { score: 100, vulnerabilities: [] },
    },
  });
});

export { router as guardianRouter };
