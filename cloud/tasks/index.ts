/**
 * ODAVL Task Service
 * Job queue and worker orchestration (Temporal-style)
 */

import express from 'express';
import { TaskQueue } from './queue.js';
import { TaskRunner } from './runner.js';
import { TaskScheduler } from './scheduler.js';
import { WorkerPool } from './worker.js';

const app = express();
const PORT = process.env.TASKS_PORT ? parseInt(process.env.TASKS_PORT, 10) : 8092;

const queue = new TaskQueue();
const runner = new TaskRunner();
const scheduler = new TaskScheduler();
const workers = new WorkerPool({ maxWorkers: 4 });

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'tasks', workers: workers.getStatus() });
});

// Task endpoints
app.post('/tasks/enqueue', async (req, res) => {
  const { type, payload } = req.body;
  const taskId = queue.enqueue(type, payload);
  res.json({ taskId });
});

app.get('/tasks/:id', async (req, res) => {
  const status = queue.getStatus(req.params.id);
  res.json({ status });
});

app.post('/tasks/:id/cancel', async (req, res) => {
  const success = await runner.cancel(req.params.id);
  res.json({ success });
});

// Start server
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => console.log(`Task service running on port ${PORT}`));
}

export { app, TaskQueue, TaskRunner, TaskScheduler, WorkerPool };
