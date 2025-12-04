import express, { type Request, type Response, type NextFunction } from 'express';
import { GuardianScheduler } from '@odavl-studio/guardian-workers';
import type { AuthRequest } from '../auth.js';
import {
  CreateTestSchema,
  UpdateTestSchema,
  GetExecutionsQuerySchema,
  GetTrendQuerySchema,
} from '../validation.js';

export function createTestRoutes(scheduler: GuardianScheduler): express.Router {
  const router = express.Router();

  // Create scheduled test
  router.post('/', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = CreateTestSchema.parse(req.body);
      const testId = scheduler.createTest({
        name: validatedData.name,
        url: validatedData.url,
        schedule: validatedData.schedule,
        enabled: validatedData.enabled,
        detectors: validatedData.detectors,
      });

      const test = scheduler.getTest(testId);
      res.status(201).json({
        success: true,
        data: test,
      });
    } catch (error) {
      next(error);
    }
  });

  // List all tests
  router.get('/', (req: AuthRequest, res: Response): void => {
    const tests = scheduler.listTests();
    res.json({
      success: true,
      data: tests,
    });
  });

  // Get single test
  router.get('/:id', (req: AuthRequest, res: Response): void => {
    const test = scheduler.getTest(req.params.id);
    if (!test) {
      res.status(404).json({ error: 'Test not found' });
      return;
    }
    res.json({
      success: true,
      data: test,
    });
  });

  // Update test
  router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = UpdateTestSchema.parse(req.body);
      scheduler.updateTest(req.params.id, validatedData);
      const test = scheduler.getTest(req.params.id);
      res.json({
        success: true,
        data: test,
      });
    } catch (error) {
      next(error);
    }
  });

  // Delete test
  router.delete('/:id', (req: AuthRequest, res: Response): void => {
    scheduler.deleteTest(req.params.id);
    res.json({
      success: true,
      message: 'Test deleted',
    });
  });

  // Execute test immediately
  router.post('/:id/execute', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await scheduler.executeTest(req.params.id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get test executions
  router.get('/:id/executions', (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const { limit } = GetExecutionsQuerySchema.parse(req.query);
      const executions = scheduler.getExecutions(req.params.id, limit);
      res.json({
        success: true,
        data: executions,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get test statistics
  router.get('/:id/stats', (req: AuthRequest, res: Response): void => {
    const stats = scheduler.getTestStats(req.params.id);
    res.json({
      success: true,
      data: stats,
    });
  });

  // Get trend analysis
  router.get('/:id/trends', (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const { days } = GetTrendQuerySchema.parse(req.query);
      const analysis = scheduler.getTrendAnalysis(req.params.id, days);
      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
