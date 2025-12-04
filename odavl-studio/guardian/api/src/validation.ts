import { z } from 'zod';

// Test validation schemas
export const CreateTestSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url(),
  schedule: z.string().regex(/^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})$/),
  enabled: z.boolean().default(true),
  detectors: z.array(z.enum([
    'white-screen', '404', 'console-error', 'react-error',
    'performance', 'accessibility', 'security', 'seo', 'mobile'
  ])).optional(),
  timeout: z.number().min(1000).max(300000).optional(),
});

export const UpdateTestSchema = CreateTestSchema.partial();

export const ExecuteTestSchema = z.object({
  testId: z.string().uuid(),
});

// Alert rule validation schemas
export const CreateAlertRuleSchema = z.object({
  testId: z.string().uuid(),
  name: z.string().min(1).max(200),
  enabled: z.boolean().default(true),
  conditions: z.array(z.object({
    type: z.enum(['score_below', 'score_above', 'issues_above', 'duration_above', 'failure_rate', 'trend_degrading']),
    threshold: z.number(),
    duration: z.number().optional(),
  })),
  channels: z.array(z.enum(['email', 'slack', 'discord', 'webhook', 'pagerduty', 'sms'])),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  cooldown: z.number().min(0).default(60),
  escalationDelay: z.number().min(0).optional(),
});

export const UpdateAlertRuleSchema = CreateAlertRuleSchema.partial();

export const AcknowledgeAlertSchema = z.object({
  acknowledgedBy: z.string().min(1).max(200),
});

// Query parameter schemas
export const GetExecutionsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const GetTrendQuerySchema = z.object({
  days: z.coerce.number().min(1).max(365).default(30),
});

export const GetAlertsQuerySchema = z.object({
  testId: z.string().uuid().optional(),
  status: z.enum(['pending', 'sent', 'acknowledged', 'resolved', 'failed']).optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

// Export types
export type CreateTestInput = z.infer<typeof CreateTestSchema>;
export type UpdateTestInput = z.infer<typeof UpdateTestSchema>;
export type CreateAlertRuleInput = z.infer<typeof CreateAlertRuleSchema>;
export type UpdateAlertRuleInput = z.infer<typeof UpdateAlertRuleSchema>;
