/**
 * Autopilot Decide Endpoint
 * POST /api/decide
 * 
 * Execute Phase 2: Decide on actions based on metrics
 */

import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import * as autopilot from '@odavl-studio/autopilot-engine';

const router: RouterType = Router();

// ============================================================================
// Request Validation Schema
// ============================================================================

const DecideRequestSchema = z.object({
  metrics: z.any(), // Metrics from observe phase
  workspaceRoot: z.string().optional(),
});

type DecideRequest = z.infer<typeof DecideRequestSchema>;

// ============================================================================
// POST /api/decide - Execute Decide Phase
// ============================================================================

router.post('/', async (req, res) => {
  try {
    const request = DecideRequestSchema.parse(req.body);
    
    console.log(`\n🧠 DECIDE Phase - Analyzing metrics...`);

    const decision = await autopilot.decide(request.metrics);

    console.log(`✅ Decision made successfully\n`);

    res.json({
      success: true,
      phase: 'decide',
      decision,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Decide Phase Error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as decideRouter };
