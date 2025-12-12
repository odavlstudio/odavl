/**
 * ODAVL Marketplace Service
 * Extension ecosystem and developer publishing platform
 */
import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import { PackageRegistry } from './registry.js';
import { cloudLogger } from '../shared/utils/index.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8085;
const registry = new PackageRegistry();

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    service: 'marketplace',
    timestamp: new Date().toISOString() 
  });
});

app.get('/packages', async (_req: Request, res: Response) => {
  cloudLogger('info', 'Marketplace packages list requested');
  const packages = await registry.list();
  res.json({ packages });
});

app.get('/package/:id', async (req: Request, res: Response) => {
  const pkg = await registry.get(req.params.id);
  res.json({ package: pkg });
});

app.listen(PORT, () => {
  console.log(`Marketplace Service running on port ${PORT}`);
});

export { app };
