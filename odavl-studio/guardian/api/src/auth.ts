import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'odavl-guardian-secret-change-in-production';
const API_KEYS = (process.env.API_KEYS || '').split(',').filter(Boolean);

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    role: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  // Check for API Key
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // API Key authentication
    if (API_KEYS.includes(token)) {
      req.user = {
        id: 'api-key-user',
        name: 'API Key User',
        role: 'admin',
      };
      next();
      return;
    }

    // JWT authentication
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        name: string;
        role: string;
      };
      req.user = decoded;
      next();
      return;
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
  }

  res.status(401).json({ error: 'Invalid authorization format' });
}

export function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== role && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

export function generateToken(user: { id: string; name: string; role: string }): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}
