/**
 * Intelligence API routes
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import type { ApiResponse } from '../../../shared/types/index.js';
import { RiskPredictor } from '../../../services/intelligence/predictors/risk-predictor.js';
import { HotspotDetector } from '../../../services/intelligence/predictors/hotspot-detector.js';
import { StabilityScorer } from '../../../services/intelligence/predictors/stability-score.js';
import { cloudLogger } from '../../../shared/utils/index.js';

export const intelligenceRouter = Router();

const riskPredictor = new RiskPredictor();
const hotspotDetector = new HotspotDetector();
const stabilityScorer = new StabilityScorer();

intelligenceRouter.get('/summary', async (_req: Request, res: Response) => {
  cloudLogger('info', 'Intelligence summary requested');
  
  const stability = await stabilityScorer.compute();
  
  const response: ApiResponse = {
    success: true,
    data: {
      projectHealth: stability.overall,
      trend: stability.trend,
      categories: stability.categories,
    },
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
});

intelligenceRouter.get('/predictions', async (_req: Request, res: Response) => {
  cloudLogger('info', 'Risk predictions requested');
  
  const predictions = await riskPredictor.predict(['src/index.ts', 'src/main.ts']);
  
  const response: ApiResponse = {
    success: true,
    data: { predictions },
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
});

intelligenceRouter.get('/hotspots', async (_req: Request, res: Response) => {
  cloudLogger('info', 'Hotspots requested');
  
  const hotspots = await hotspotDetector.detect();
  
  const response: ApiResponse = {
    success: true,
    data: { hotspots: hotspots.slice(0, 10) },
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
});
