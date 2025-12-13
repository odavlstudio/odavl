// ODAVL Insight Phase 12 – Batch 12.1 completed
// Schema definition for incoming insight events from external projects

import { z } from 'zod';

export const InsightEventSchema = z.object({
    projectId: z.string(),
    timestamp: z.string().datetime(),
    error: z.object({
        message: z.string(),
        stack: z.array(z.string()),
        type: z.string(),
        module: z.string().optional(),
        file: z.string().optional(),
        line: z.number().optional(),
        column: z.number().optional(),
    }),
    env: z.object({
        runtime: z.string(),
        framework: z.string().optional(),
        versions: z.record(z.string()).optional(),
    }),
    meta: z.record(z.any()).optional(),
});

export type InsightEvent = z.infer<typeof InsightEventSchema>;
