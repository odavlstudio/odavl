/**
 * Authentication Middleware
 * Express middleware for JWT and API key validation
 */

import type { Request, Response, NextFunction } from 'express';
import { JWTService, type TokenPayload } from './jwt.js';
import { ApiKeyService } from './api-keys.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      apiKey?: { userId: string; scopes: string[] };
    }
  }
}

/**
 * Require JWT authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.substring(7);
  const jwt = new JWTService();
  const payload = jwt.verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = payload;
  next();
}

/**
 * Require API key authentication
 */
export async function requireApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    res.status(401).json({ error: 'Missing x-api-key header' });
    return;
  }

  const apiKeyService = new ApiKeyService();
  const validatedKey = await apiKeyService.validateApiKey(apiKey);

  if (!validatedKey) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  req.apiKey = { userId: validatedKey.userId, scopes: validatedKey.scopes };
  next();
}

/**
 * Optional authentication (JWT or API key)
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] as string;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const jwt = new JWTService();
    const payload = jwt.verifyToken(token);
    if (payload) req.user = payload;
  } else if (apiKey) {
    const apiKeyService = new ApiKeyService();
    const validatedKey = await apiKeyService.validateApiKey(apiKey);
    if (validatedKey) req.apiKey = { userId: validatedKey.userId, scopes: validatedKey.scopes };
  }

  next();
}
