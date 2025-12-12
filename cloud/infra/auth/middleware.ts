/**
 * Express authentication middleware
 */
import type { Request, Response, NextFunction } from 'express';
import { authService } from './index.js';
import { cloudLogger, formatError } from '../../shared/utils/index.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    cloudLogger('warn', 'Missing authorization header');
    res.status(401).json({ error: 'Authorization required' });
    return;
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const user = await authService.validateToken(token);

    if (!user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Attach user to request
    (req as Request & { user: unknown }).user = user;
    next();
  } catch (error: unknown) {
    cloudLogger('error', 'Auth middleware error', { error: formatError(error) });
    res.status(500).json({ error: 'Authentication failed' });
  }
}

export async function requireApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey || !(await authService.verifyApiKey(apiKey))) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  next();
}
