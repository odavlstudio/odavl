import express, { type Response, type NextFunction } from 'express';
import type { GuardianScheduler } from '@odavl-studio/guardian-workers';
import type { AuthRequest } from '../auth.js';
import {
  CreateAlertRuleSchema,
  UpdateAlertRuleSchema,
  AcknowledgeAlertSchema,
  GetAlertsQuerySchema,
} from '../validation.js';

export function createAlertRoutes(scheduler: GuardianScheduler): express.Router {
  const router = express.Router();
  const alertManager = scheduler.getAlertManager();

  // Create alert rule
  router.post('/rules', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = CreateAlertRuleSchema.parse(req.body);
      const ruleId = alertManager.createRule({
        testId: validatedData.testId,
        name: validatedData.name,
        enabled: validatedData.enabled,
        conditions: validatedData.conditions,
        channels: validatedData.channels,
        severity: validatedData.severity,
        cooldown: validatedData.cooldown,
        escalationDelay: validatedData.escalationDelay,
      });

      const rule = alertManager.getRule(ruleId);
      res.status(201).json({
        success: true,
        data: rule,
      });
    } catch (error) {
      next(error);
    }
  });

  // List alert rules
  router.get('/rules', (req: AuthRequest, res: Response): void => {
    const testId = req.query.testId as string | undefined;
    const rules = alertManager.listRules(testId);
    res.json({
      success: true,
      data: rules,
    });
  });

  // Get single alert rule
  router.get('/rules/:id', (req: AuthRequest, res: Response): void => {
    const rule = alertManager.getRule(req.params.id);
    if (!rule) {
      res.status(404).json({ error: 'Alert rule not found' });
      return;
    }
    res.json({
      success: true,
      data: rule,
    });
  });

  // Update alert rule
  router.patch('/rules/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = UpdateAlertRuleSchema.parse(req.body);
      alertManager.updateRule(req.params.id, validatedData);
      const rule = alertManager.getRule(req.params.id);
      res.json({
        success: true,
        data: rule,
      });
    } catch (error) {
      next(error);
    }
  });

  // Delete alert rule
  router.delete('/rules/:id', (req: AuthRequest, res: Response): void => {
    alertManager.deleteRule(req.params.id);
    res.json({
      success: true,
      message: 'Alert rule deleted',
    });
  });

  // List alerts
  router.get('/', (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const filters = GetAlertsQuerySchema.parse(req.query);
      const alerts = alertManager.getAlerts(filters);
      res.json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      next(error);
    }
  });

  // Acknowledge alert
  router.post('/:id/acknowledge', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { acknowledgedBy } = AcknowledgeAlertSchema.parse(req.body);
      alertManager.acknowledgeAlert(req.params.id, acknowledgedBy);
      res.json({
        success: true,
        message: 'Alert acknowledged',
      });
    } catch (error) {
      next(error);
    }
  });

  // Resolve alert
  router.post('/:id/resolve', (req: AuthRequest, res: Response): void => {
    alertManager.resolveAlert(req.params.id);
    res.json({
      success: true,
      message: 'Alert resolved',
    });
  });

  return router;
}
