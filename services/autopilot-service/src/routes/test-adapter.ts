/**
 * Test Adapter Registration Endpoint
 * GET /api/test-adapter
 */

import { Router, type Router as RouterType } from 'express';
import { AnalysisProtocol } from '@odavl/oplayer/protocols';

const router: RouterType = Router();

router.get('/', (req, res) => {
  try {
    const isRegistered = AnalysisProtocol.isAdapterRegistered();
    
    res.json({
      success: true,
      adapterRegistered: isRegistered,
      message: isRegistered 
        ? '✅ AnalysisProtocol adapter is registered and ready' 
        : '❌ AnalysisProtocol adapter is NOT registered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as testAdapterRouter };
