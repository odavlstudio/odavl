/**
 * Autopilot API routes
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import type { ApiResponse, CloudJob } from '../../../shared/types/index.js';
import { generateId, cloudLogger } from '../../../shared/utils/index.js';

export const autopilotRouter = Router();

autopilotRouter.post('/run', async (req: Request, res: Response) => {
  const jobId = generateId('autopilot-job');
  cloudLogger('info', 'Autopilot cycle requested', { jobId });

  const job: CloudJob = {
    id: jobId,
    product: 'autopilot',
    action: 'cycle',
    payload: req.body,
    status: 'queued',
    createdAt: new Date().toISOString(),
  };

  const response: ApiResponse<CloudJob> = {
    success: true,
    data: job,
    timestamp: new Date().toISOString(),
  };

  res.status(202).json(response);
});

autopilotRouter.get('/status/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;
  cloudLogger('info', 'Autopilot status check', { jobId });

  const response: ApiResponse = {
    success: true,
    data: { jobId, status: 'queued' },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});
