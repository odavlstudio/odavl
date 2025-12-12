/**
 * ODAVL Intelligence Service
 * AI-enhanced analytics and predictive insights
 */
import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import { AnalyticsEngine } from './analytics.js';
import { cloudLogger } from '../../shared/utils/index.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8084;
const analytics = new AnalyticsEngine();

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    service: 'intelligence',
    timestamp: new Date().toISOString() 
  });
});

app.get('/analyze', async (_req: Request, res: Response) => {
  cloudLogger('info', 'Intelligence analysis requested');
  const result = await analytics.analyze();
  res.json(result);
});

app.get('/summary', async (_req: Request, res: Response) => {
  const summary = await analytics.getSummary();
  res.json(summary);
});

app.listen(PORT, () => {
  console.log(`Intelligence Service running on port ${PORT}`);
});

export { app };
