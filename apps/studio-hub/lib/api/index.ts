/**
 * API Utilities - Centralized exports
 *
 * Import all API utilities from one place:
 * import { handleApiError, ApiErrors, createSuccessResponse } from '@/lib/api';
 */

// Error handling
export {
  ApiErrorCode,
  createErrorResponse,
  handleApiError,
  withErrorHandler,
  ApiErrors,
  type ApiErrorResponse,
} from './error-handler';

// Request validation
export {
  validateRequestBody,
  validateQueryParams,
  getPaginationParams,
  requireEnvVar,
  validateMethod,
  CommonSchemas,
} from './validation';

// Response formatting
export {
  createSuccessResponse,
  createPaginatedResponse,
  createNoContentResponse,
  createCreatedResponse,
  createAcceptedResponse,
  getCorsHeaders,
  handleCorsPreflightRequest,
  withCorsHeaders,
  type ApiSuccessResponse,
} from './response';
