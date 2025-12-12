/**
 * Autopilot Cloud Runner
 * Executes O-D-A-V-L cycles in cloud environment
 */
import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import { jobRunner } from '../../infra/compute/runner.js';
import type { CloudJob, ApiResponse } from '../../shared/types/index.js';
import { cloudLogger, generateId } from '../../shared/utils/index.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8082;

app.use(cors());
app.use(express.json());

app.post('/run', async (req: Request, res: Response) => {
  const jobId = generateId('autopilot-run');
  cloudLogger('info', 'Autopilot run requested', { jobId });

  const job: CloudJob = {
    id: jobId,
    product: 'autopilot',
    action: 'cycle',
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
  console.log(`Autopilot Runner on port ${PORT}`);
});
