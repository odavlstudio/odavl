/**
 * Autopilot Quick Fix Endpoint
 * POST /api/fix/quick
 * 
 * Fast analysis mode - optimized for speed (3-8 seconds)
 */

import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import * as autopilot from '@odavl-studio/autopilot-engine';

const router: RouterType = Router();

// ============================================================================
// Request Validation Schema
// ============================================================================

const QuickFixRequestSchema = z.object({
  workspaceRoot: z.string().min(1, 'Workspace path is required'),
  includeDecide: z.boolean().optional().default(false),
  includeAct: z.boolean().optional().default(false),
});

type QuickFixRequest = z.infer<typeof QuickFixRequestSchema>;

// ============================================================================
// GET /api/fix/quick - Health Check
// ============================================================================

router.get('/', (req, res) => {
  res.json({
    endpoint: '/api/fix/quick',
    method: 'POST',
    description: 'Fast analysis mode (3-8 seconds)',
    status: 'ready',
    features: {
      observeQuick: typeof autopilot.observeQuick === 'function',
      targetDuration: '3-8 seconds',
      detectors: ['typescript', 'imports', 'circular', 'packages', 'configs'],
      optimizations: [
        'No recursive scan',
        'Top-level files only',
        'No ML scoring',
        'Shallow analysis'
      ]
    }
  });
});

// ============================================================================
// POST /api/fix/quick - Execute Quick Analysis
// ============================================================================

router.post('/', async (req, res) => {
  try {
    // Validate request
    const request = QuickFixRequestSchema.parse(req.body);
    
    console.log(`\n⚡ Quick Fix Request:`);
    console.log(`   Workspace: ${request.workspaceRoot}`);
    console.log(`   Include Decide: ${request.includeDecide}`);
    console.log(`   Include Act: ${request.includeAct}`);

    // Set working directory (Engine v2 uses process.cwd())
    process.chdir(request.workspaceRoot);

    const startTime = Date.now();
    const results: Record<string, unknown> = {};

    // ========================================================================
    // Phase 1: OBSERVE QUICK (always)
    // ========================================================================
    console.log('⚡ Phase 1: OBSERVE QUICK');
    const metrics = await autopilot.observeQuick();
    results.observeQuick = metrics;
    
    const observeDuration = Date.now() - startTime;
    console.log(`   ✅ Analysis complete in ${observeDuration}ms (${(observeDuration / 1000).toFixed(2)}s)`);
    console.log(`   → Total issues: ${metrics.totalIssues}`);

    // ========================================================================
    // Phase 2: DECIDE (optional, for decision recommendations)
    // ========================================================================
    if (request.includeDecide) {
      console.log('🧠 Phase 2: DECIDE');
      const decision = await autopilot.decide(metrics);
      results.decide = decision;
      console.log(`   ✅ Decision made`);
    }

    // ========================================================================
    // Phase 3: ACT (optional, for auto-fix)
    // ========================================================================
    if (request.includeAct && results.decide) {
      console.log('⚡ Phase 3: ACT');
      const actResult = await autopilot.act(results.decide as string);
      results.act = actResult;
      console.log(`   ✅ Actions executed`);
    }

    const totalDuration = Date.now() - startTime;

    // ========================================================================
    // Response
    // ========================================================================
    res.json({
      success: true,
      mode: 'quick',
      duration: {
        total: `${(totalDuration / 1000).toFixed(2)}s`,
        observe: `${(observeDuration / 1000).toFixed(2)}s`,
        totalMs: totalDuration
      },
      results,
      summary: {
        totalIssues: metrics.totalIssues,
        breakdown: {
          typescript: metrics.typescript,
          imports: metrics.imports,
          circular: metrics.circular,
          packages: metrics.packages
        }
      }
    });

  } catch (error) {
    console.error('❌ Quick fix failed:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
});

export { router as quickFixRouter };
