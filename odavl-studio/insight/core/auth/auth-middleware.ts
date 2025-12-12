/**
 * @fileoverview Authentication Middleware
 * JWT validation, session management, RBAC for Express/Fastify
 */

import { Request, Response, NextFunction } from 'express';
import { SSOIntegration, TokenValidationResult } from './sso-integration';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  tenantId: string;
}

export interface AuthMiddlewareOptions {
  jwtSecret: string;
  sessionService?: SSOIntegration;
  requireRoles?: string[];
  requirePermissions?: string[];
  auditLog?: boolean;
}

/**
 * Extend Express Request with authenticated user
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionId?: string;
    }
  }
}

export class AuthMiddleware {
  /**
   * JWT authentication middleware
   */
  static authenticate(secret: string, auditLog = true) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.status(401).json({ error: 'No token provided' });
          return;
        }

        const token = authHeader.substring(7);

        // Validate JWT
        const result: TokenValidationResult = await SSOIntegration.validateJWT(token, secret);
        if (!result.valid) {
          res.status(401).json({ error: result.error });
          return;
        }

        // Attach user to request
        req.user = result.payload as AuthenticatedUser;

        // Audit log
        if (auditLog) {
          console.log(`[AUTH] User ${req.user?.email} authenticated - ${req.method} ${req.path}`);
        }

        next();
      } catch (error) {
        res.status(401).json({ error: 'Authentication failed' });
      }
    };
  }

  /**
   * Session-based authentication middleware
   */
  static authenticateSession(sessionService: SSOIntegration) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Extract session ID from cookie
        const sessionId = req.cookies?.['odavl-session'];
        if (!sessionId) {
          res.status(401).json({ error: 'No session found' });
          return;
        }

        // Validate session
        const session = await sessionService.getSession(sessionId);
        if (!session) {
          res.status(401).json({ error: 'Invalid session' });
          return;
        }

        // Attach user to request
        req.user = session as AuthenticatedUser;
        req.sessionId = sessionId;

        next();
      } catch (error) {
        res.status(401).json({ error: 'Authentication failed' });
      }
    };
  }

  /**
   * Role-based access control middleware
   */
  static requireRoles(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const hasRole = roles.some(role => req.user?.roles.includes(role));
      if (!hasRole) {
        res.status(403).json({
          error: 'Insufficient permissions',
          required: roles,
          actual: req.user.roles,
        });
        return;
      }

      next();
    };
  }

  /**
   * Permission-based access control middleware
   */
  static requirePermissions(...permissions: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const hasPermission = permissions.every(perm => req.user?.permissions.includes(perm));
      if (!hasPermission) {
        res.status(403).json({
          error: 'Insufficient permissions',
          required: permissions,
          actual: req.user.permissions,
        });
        return;
      }

      next();
    };
  }

  /**
   * Resource-based access control (check resource ownership)
   */
  static requireResourceAccess(getResourceOwner: (req: Request) => Promise<string>) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      try {
        const ownerId = await getResourceOwner(req);

        // Check if user is owner or has admin role
        if (req.user.id !== ownerId && !req.user.roles.includes('admin')) {
          res.status(403).json({ error: 'Access denied to this resource' });
          return;
        }

        next();
      } catch (error) {
        res.status(500).json({ error: 'Failed to verify resource access' });
      }
    };
  }

  /**
   * Tenant isolation middleware
   */
  static requireTenant(tenantId: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      if (req.user.tenantId !== tenantId) {
        res.status(403).json({ error: 'Access denied - wrong tenant' });
        return;
      }

      next();
    };
  }

  /**
   * Audit logging middleware
   */
  static auditLog(options: { logSuccess?: boolean; logFailure?: boolean } = {}) {
    const { logSuccess = true, logFailure = true } = options;

    return (req: Request, res: Response, next: NextFunction): void => {
      const startTime = Date.now();

      // Capture response
      const originalSend = res.send;
      res.send = function (data: any): Response {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        if ((logSuccess && statusCode < 400) || (logFailure && statusCode >= 400)) {
          const logEntry = {
            timestamp: new Date().toISOString(),
            userId: req.user?.id || 'anonymous',
            email: req.user?.email || 'anonymous',
            method: req.method,
            path: req.path,
            statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
          };

          console.log('[AUDIT]', JSON.stringify(logEntry));
        }

        return originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Rate limiting middleware
   */
  static rateLimit(options: { maxRequests: number; windowMs: number }) {
    const requests = new Map<string, number[]>();

    return (req: Request, res: Response, next: NextFunction): void => {
      const key = req.user?.id || req.ip || 'anonymous';
      const now = Date.now();
      const windowStart = now - options.windowMs;

      // Get request timestamps for this key
      let timestamps = requests.get(key) || [];

      // Remove old timestamps
      timestamps = timestamps.filter(ts => ts > windowStart);

      // Check rate limit
      if (timestamps.length >= options.maxRequests) {
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil((timestamps[0] + options.windowMs - now) / 1000),
        });
        return;
      }

      // Add current timestamp
      timestamps.push(now);
      requests.set(key, timestamps);

      next();
    };
  }
}
