/**
 * Custom error classes for ODAVL SDK
 */

export class ODAVLError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ODAVLError';
    Object.setPrototypeOf(this, ODAVLError.prototype);
  }
}

export class RateLimitError extends ODAVLError {
  constructor(
    message: string,
    public readonly retryAfter: number,
    public readonly limit: number,
    public readonly remaining: number
  ) {
    super(message, 429, 'TOO_MANY_REQUESTS');
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class UnauthorizedError extends ODAVLError {
  constructor(message: string) {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends ODAVLError {
  constructor(message: string) {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends ODAVLError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
