import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  console.error('Error:', err);

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Standard errors
  if (err instanceof Error) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Unknown errors
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
}
