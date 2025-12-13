/**
 * SARIF S3 Uploader - Phase 2.2 Task 6
 * 
 * Handles uploading large SARIF reports to S3 via presigned URLs.
 * Used when analysis results exceed direct JSON upload thresholds.
 * 
 * Flow:
 * 1. Compress SARIF with gzip
 * 2. Request presigned URL from backend
 * 3. Upload compressed SARIF to S3
 * 4. Return sarifUrl for final upload payload
 */

import { gzip } from 'node:zlib';
import { promisify } from 'node:util';
import type { HttpClient } from './http-client.js';

const gzipAsync = promisify(gzip);

/**
 * Result of SARIF upload operation
 */
export interface SarifUploadResult {
  type: 'SUCCESS' | 'OFFLINE' | 'ERROR';
  sarifUrl?: string;
  errorCode?: string;
  message?: string;
}

/**
 * Parameters for SARIF upload
 */
export interface SarifUploadParams {
  httpClient: HttpClient;
  analysisId: string;
  sarif: unknown;
  estimatedSizeBytes: number;
  debug?: boolean;
}

/**
 * Presigned URL response from backend
 */
interface PresignResponse {
  uploadUrl: string;
  sarifUrl: string;
}

/**
 * Upload SARIF to cloud via S3 presigned URL
 * 
 * @param params Upload parameters
 * @returns Upload result with sarifUrl on success
 */
export async function uploadSarifToCloud(params: SarifUploadParams): Promise<SarifUploadResult> {
  const { httpClient, analysisId, sarif, estimatedSizeBytes, debug } = params;

  try {
    if (debug) {
      console.log(`[SARIF Upload] Starting upload for analysis ${analysisId}`);
      console.log(`[SARIF Upload] Estimated size: ${(estimatedSizeBytes / 1024 / 1024).toFixed(2)}MB`);
    }

    // Step 1: Serialize SARIF to JSON
    const sarifJson = JSON.stringify(sarif);
    const sarifBuffer = Buffer.from(sarifJson, 'utf-8');

    if (debug) {
      console.log(`[SARIF Upload] SARIF size before compression: ${(sarifBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    }

    // Step 2: Compress with gzip
    const compressedSarif = await gzipAsync(sarifBuffer);
    const compressedSizeBytes = compressedSarif.length;

    if (debug) {
      console.log(`[SARIF Upload] SARIF size after compression: ${(compressedSizeBytes / 1024 / 1024).toFixed(2)}MB`);
      console.log(`[SARIF Upload] Compression ratio: ${((1 - compressedSizeBytes / sarifBuffer.length) * 100).toFixed(1)}%`);
    }

    // Step 3: Request presigned URL from backend
    const presignResult = await requestPresignedUrl(httpClient, {
      analysisId,
      sizeBytes: compressedSizeBytes,
      debug,
    });

    if (presignResult.type !== 'SUCCESS') {
      return presignResult;
    }

    const { uploadUrl, sarifUrl } = presignResult.data!;

    if (debug) {
      console.log(`[SARIF Upload] Presigned URL obtained`);
      console.log(`[SARIF Upload] SARIF reference: ${sarifUrl}`);
    }

    // Step 4: Upload compressed SARIF to S3
    const uploadResult = await uploadToS3(uploadUrl, compressedSarif, debug);

    if (uploadResult.type !== 'SUCCESS') {
      return uploadResult;
    }

    if (debug) {
      console.log(`[SARIF Upload] Upload completed successfully`);
    }

    return {
      type: 'SUCCESS',
      sarifUrl,
    };
  } catch (error) {
    return handleSarifUploadException(error, debug);
  }
}

/**
 * Request presigned URL from backend
 */
async function requestPresignedUrl(
  httpClient: HttpClient,
  params: {
    analysisId: string;
    sizeBytes: number;
    debug?: boolean;
  }
): Promise<
  | { type: 'SUCCESS'; data: PresignResponse }
  | { type: 'OFFLINE'; message: string }
  | { type: 'ERROR'; errorCode: string; message: string }
> {
  const { analysisId, sizeBytes, debug } = params;

  try {
    const response = await httpClient.post<PresignResponse>('/api/cli/analysis/presign', {
      analysisId,
      sizeBytes,
      contentType: 'application/sarif+json',
    });

    if (!response.uploadUrl || !response.sarifUrl) {
      return {
        type: 'ERROR',
        errorCode: 'INVALID_PRESIGN_RESPONSE',
        message: 'Backend did not return valid presigned URL',
      };
    }

    return {
      type: 'SUCCESS',
      data: response,
    };
  } catch (error: unknown) {
    if (debug) {
      console.error('[SARIF Upload] Presign request failed:', error);
    }

    // Network errors
    if (error instanceof Error && error.message.includes('ENOTFOUND')) {
      return {
        type: 'OFFLINE',
        message: 'Cannot reach ODAVL Cloud',
      };
    }

    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return {
        type: 'OFFLINE',
        message: 'Connection refused',
      };
    }

    if (error instanceof Error && error.message.includes('timeout')) {
      return {
        type: 'OFFLINE',
        message: 'Request timeout',
      };
    }

    // API errors with status codes
    if (isApiError(error)) {
      const statusCode = error.statusCode || 0;

      if (statusCode === 401) {
        return {
          type: 'ERROR',
          errorCode: 'INVALID_TOKEN',
          message: 'Authentication required',
        };
      }

      if (statusCode === 403) {
        return {
          type: 'ERROR',
          errorCode: 'FORBIDDEN',
          message: 'Access denied',
        };
      }

      if (statusCode === 413) {
        return {
          type: 'ERROR',
          errorCode: 'PAYLOAD_TOO_LARGE',
          message: 'Analysis is too large to upload',
        };
      }

      if (statusCode === 429) {
        return {
          type: 'ERROR',
          errorCode: 'RATE_LIMITED',
          message: 'Too many requests. Please wait and try again.',
        };
      }

      if (statusCode >= 500) {
        return {
          type: 'OFFLINE',
          message: 'Server error. Please try again later.',
        };
      }

      return {
        type: 'ERROR',
        errorCode: 'API_ERROR',
        message: error.message || 'Failed to obtain presigned URL',
      };
    }

    // Unknown errors
    return {
      type: 'ERROR',
      errorCode: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error during presign request',
    };
  }
}

/**
 * Upload compressed SARIF to S3
 */
async function uploadToS3(
  uploadUrl: string,
  compressedSarif: Buffer,
  debug?: boolean
): Promise<
  | { type: 'SUCCESS' }
  | { type: 'OFFLINE'; message: string }
  | { type: 'ERROR'; errorCode: string; message: string }
> {
  try {
    if (debug) {
      console.log(`[SARIF Upload] Starting S3 upload (${(compressedSarif.length / 1024 / 1024).toFixed(2)}MB)`);
    }

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/sarif+json',
        'Content-Encoding': 'gzip',
      },
      body: new Uint8Array(compressedSarif),
    });

    if (!response.ok) {
      if (debug) {
        console.error(`[SARIF Upload] S3 upload failed with status ${response.status}`);
      }

      return {
        type: 'ERROR',
        errorCode: 'S3_UPLOAD_FAILED',
        message: `Failed to upload to S3: ${response.status} ${response.statusText}`,
      };
    }

    if (debug) {
      console.log('[SARIF Upload] S3 upload completed');
    }

    return { type: 'SUCCESS' };
  } catch (error: unknown) {
    if (debug) {
      console.error('[SARIF Upload] S3 upload exception:', error);
    }

    // Network errors
    if (error instanceof Error && error.message.includes('ENOTFOUND')) {
      return {
        type: 'OFFLINE',
        message: 'Cannot reach S3',
      };
    }

    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return {
        type: 'OFFLINE',
        message: 'Connection refused',
      };
    }

    if (error instanceof Error && error.message.includes('timeout')) {
      return {
        type: 'OFFLINE',
        message: 'Upload timeout',
      };
    }

    return {
      type: 'ERROR',
      errorCode: 'S3_UPLOAD_ERROR',
      message: error instanceof Error ? error.message : 'Unknown S3 upload error',
    };
  }
}

/**
 * Handle exceptions during SARIF upload
 */
function handleSarifUploadException(error: unknown, debug?: boolean): SarifUploadResult {
  if (debug) {
    console.error('[SARIF Upload] Unexpected exception:', error);
  }

  if (error instanceof Error) {
    // Network errors → OFFLINE
    if (
      error.message.includes('ENOTFOUND') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('timeout')
    ) {
      return {
        type: 'OFFLINE',
        message: 'Network error',
      };
    }

    return {
      type: 'ERROR',
      errorCode: 'UPLOAD_FAILED',
      message: error.message,
    };
  }

  return {
    type: 'ERROR',
    errorCode: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred during SARIF upload',
  };
}

/**
 * Type guard for API errors
 */
function isApiError(error: unknown): error is { statusCode?: number; message?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('statusCode' in error || 'message' in error)
  );
}

/**
 * Estimate compressed SARIF size (for progress UI)
 * Compression ratio is typically 70-85% for JSON
 * 
 * @param uncompressedSize Size before compression
 * @returns Estimated compressed size
 */
export function estimateCompressedSize(uncompressedSize: number): number {
  return Math.ceil(uncompressedSize * 0.25); // Assume 75% compression
}
