/**
 * Custom error classes for ODAVL Cloud Client
 */

export class ODAVLCloudError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ODAVLCloudError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends ODAVLCloudError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
    this.name = 'AuthenticationError';
  }
}

export class QuotaExceededError extends ODAVLCloudError {
  constructor(
    message: string,
    public current: number,
    public limit: number,
    public upgradeUrl?: string
  ) {
    super(message, 'QUOTA_EXCEEDED', 429, { current, limit, upgradeUrl });
    this.name = 'QuotaExceededError';
  }
}

export class NetworkError extends ODAVLCloudError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', undefined, details);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends ODAVLCloudError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends ODAVLCloudError {
  constructor(
    message: string,
    public retryAfter: number
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429, { retryAfter });
    this.name = 'RateLimitError';
  }
}
