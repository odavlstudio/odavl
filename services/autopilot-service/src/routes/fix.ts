/**
 * Autopilot Fix Endpoint
 * POST /api/fix
 * 
 * Execute autonomous code fixes using O-D-A-V-L cycle
 */

import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import * as autopilot from '@odavl-studio/autopilot-engine';

const router: RouterType = Router();

// ============================================================================
// Request Validation Schema
// ============================================================================

const FixRequestSchema = z.object({
  workspaceRoot: z.string().min(1, 'Workspace path is required'),
  mode: z
    .enum(['observe', 'quick', 'decide', 'act', 'verify', 'learn', 'loop'])
    .default('loop'),
  maxFiles: z.number().min(1).max(50).optional().default(10),
  maxLOC: z.number().min(10).max(200).optional().default(40),
  recipe: z.string().optional(), // Specific recipe to execute
});

type FixRequest = z.infer<typeof FixRequestSchema>;

// ============================================================================
// GET /api/fix - Health Check for Fix Endpoint
// ============================================================================

router.get('/', (req, res) => {
  res.json({
    endpoint: '/api/fix',
    method: 'POST',
    description: 'Execute autonomous code fixes',
    status: 'ready',
    engine: {
      available: typeof autopilot.observe === 'function',
      phases: ['observe', 'decide', 'act', 'verify', 'learn'],
    },
  });
});

// ============================================================================
// POST /api/fix - Execute Autopilot Cycle
// ============================================================================

router.post('/', async (req, res) => {
  try {
    // Validate request
    const request = FixRequestSchema.parse(req.body);
    
    console.log(`\n🔍 Autopilot Fix Request:`);
    console.log(`   Workspace: ${request.workspaceRoot}`);
    console.log(`   Mode: ${request.mode}`);
    console.log(`   Max Files: ${request.maxFiles}`);
    console.log(`   Max LOC: ${request.maxLOC}`);

    // Set working directory for engine (required by Engine v2 API)
    process.chdir(request.workspaceRoot);

    const results: Record<string, unknown> = {};

    // ========================================================================
    // Execute O-D-A-V-L Phases
    // ========================================================================

    // QUICK MODE: Fast analysis (3-8 seconds)
    if (request.mode === 'quick') {
      console.log('⚡ QUICK MODE: Fast analysis...');
      const startTime = Date.now();
      
      const metrics = await autopilot.observeQuick();
      results.observeQuick = metrics;
      
      const duration = Date.now() - startTime;
      console.log(`   ✅ Quick analysis complete in ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
      console.log(`   → Total issues: ${metrics.totalIssues}`);
      
      // Return immediately for quick mode
      return res.json({
        success: true,
        mode: 'quick',
        duration: `${(duration / 1000).toFixed(2)}s`,
        results
      });
    }

    if (request.mode === 'observe' || request.mode === 'loop') {
      console.log('📊 Phase 1: OBSERVE');
      const metrics = await autopilot.observe();
      results.observe = metrics;
      console.log(`   ✅ Metrics collected: ${JSON.stringify(metrics).substring(0, 100)}...`);
    }

    if (request.mode === 'decide' || request.mode === 'loop') {
      console.log('🧠 Phase 2: DECIDE');
      if (!results.observe) {
        results.observe = await autopilot.observe(request.workspaceRoot);
      }
      const decision = await autopilot.decide(results.observe as any);
      results.decide = decision;
      console.log(`   ✅ Decision: ${JSON.stringify(decision).substring(0, 100)}...`);
    }

    if (request.mode === 'act' || request.mode === 'loop') {
      console.log('⚡ Phase 3: ACT');
      if (!results.decide) {
        const metrics = await autopilot.observe();
        results.decide = await autopilot.decide(metrics);
      }
      // Note: maxFiles/maxLOC now read from .odavl/gates.yml by engine
      const actResult = await autopilot.act(results.decide as string);
      results.act = actResult;
      console.log(`   ✅ Changes applied`);
    }

    if (request.mode === 'verify' || request.mode === 'loop') {
      console.log('✓ Phase 4: VERIFY');
      const beforeMetrics = results.observe as any;
      const recipeId = results.decide as string;
      const verification = await autopilot.verify(beforeMetrics, recipeId);
      results.verify = verification;
      console.log(`   ✅ Verification: ${JSON.stringify(verification).substring(0, 100)}...`);
    }

    if (request.mode === 'learn' || request.mode === 'loop') {
      console.log('📚 Phase 5: LEARN');
      const recipeId = results.decide as string;
      const verification = results.verify as any;
      const success = verification.gatesPassed === true;
      const learning = await autopilot.learn(recipeId, success);
      results.learn = learning;
      console.log(`   ✅ Learning updated`);
    }

    console.log('✅ Autopilot cycle completed successfully\n');

    // Return results
    res.json({
      success: true,
      mode: request.mode,
      workspace: request.workspaceRoot,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Autopilot Fix Error:', error);
    
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
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
});

export { router as fixRouter };
