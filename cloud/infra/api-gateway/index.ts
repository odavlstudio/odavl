/**
 * ODAVL Cloud API Gateway
 * REST API entry point for Insight, Autopilot, and Guardian
 */
import express from 'express';
import cors from 'cors';
import { insightRouter } from './routes/insight.js';
import { autopilotRouter } from './routes/autopilot.js';
import { guardianRouter } from './routes/guardian.js';
import { intelligenceRouter } from './routes/intelligence.js';
import { marketplaceRouter } from './routes/marketplace.js';
import { apiV1Router } from './routes/api-v1/index.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API v1 routes (public API)
app.use('/api/v1', apiV1Router);

// Product routes (legacy)
app.use('/insight', insightRouter);
app.use('/autopilot', autopilotRouter);
app.use('/guardian', guardianRouter);
app.use('/intelligence', intelligenceRouter);
app.use('/marketplace', marketplaceRouter);

// Start server
app.listen(PORT, () => {
  console.log(`ODAVL API Gateway running on port ${PORT}`);
});

export { app };
