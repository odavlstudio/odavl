/**
 * Telemetry Proxy Service
 * Ingests events from Insight, Autopilot, and Guardian
 */
import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import { TelemetryStorage } from './storage.js';
import type { CloudEvent, ApiResponse } from '../../shared/types/index.js';
import { cloudLogger, generateId, validatePayload } from '../../shared/utils/index.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8081;
const storage = new TelemetryStorage();

app.use(cors());
app.use(express.json());

app.post('/telemetry/ingest', async (req: Request, res: Response) => {
  if (!validatePayload(req.body)) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const event: CloudEvent = {
    id: generateId('event'),
    type: req.body.type as string,
    product: req.body.product as 'insight' | 'autopilot' | 'guardian',
    timestamp: new Date().toISOString(),
    data: req.body.data as Record<string, unknown>,
  };

  await storage.store(event);
  cloudLogger('info', 'Event ingested', { eventId: event.id });

  const response: ApiResponse = {
    success: true,
    timestamp: new Date().toISOString(),
  };

  res.status(201).json(response);
});

app.listen(PORT, () => {
  console.log(`Telemetry Proxy running on port ${PORT}`);
});
