/**
 * Autopilot Observe Endpoint
 * POST /api/observe
 * 
 * Execute Phase 1: Collect metrics from workspace
 */

import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import * as autopilot from '@odavl-studio/autopilot-engine';

const router: RouterType = Router();

// ============================================================================
// Request Validation Schema
// ============================================================================

const ObserveRequestSchema = z.object({
  workspaceRoot: z.string().min(1, 'Workspace path is required'),
});

type ObserveRequest = z.infer<typeof ObserveRequestSchema>;

// ============================================================================
// POST /api/observe - Execute Observe Phase
// ============================================================================

router.post('/', async (req, res) => {
  try {
    const request = ObserveRequestSchema.parse(req.body);
    
    console.log(`\n📊 OBSERVE Phase - Workspace: ${request.workspaceRoot}`);

    // Set working directory (Engine v2 uses process.cwd())
    process.chdir(request.workspaceRoot);

    const metrics = await autopilot.observe();

    console.log(`✅ Metrics collected successfully\n`);

    res.json({
      success: true,
      phase: 'observe',
      workspace: request.workspaceRoot,
      metrics,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Observe Phase Error:', error);
    
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

export { router as observeRouter };
