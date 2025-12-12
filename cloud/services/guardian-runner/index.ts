/**
 * Guardian Cloud Runner
 * Executes website tests in cloud environment
 */
import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import { jobRunner } from '../../infra/compute/runner.js';
import type { CloudJob, ApiResponse } from '../../shared/types/index.js';
import { cloudLogger, generateId } from '../../shared/utils/index.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8083;

app.use(cors());
app.use(express.json());

app.post('/test', async (req: Request, res: Response) => {
  const jobId = generateId('guardian-test');
  cloudLogger('info', 'Guardian test requested', { jobId });

  const job: CloudJob = {
    id: jobId,
    product: 'guardian',
    action: 'test',
    payload: req.body,
    status: 'queued',
    createdAt: new Date().toISOString(),
  };

  await jobRunner.enqueue(job);

  const response: ApiResponse<CloudJob> = {
    success: true,
    data: job,
    timestamp: new Date().toISOString(),
  };

  res.status(202).json(response);
});

app.listen(PORT, () => {
  console.log(`Guardian Runner on port ${PORT}`);
});
