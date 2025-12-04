/**
 * API Response Compression Middleware
 * Compresses responses to reduce bandwidth and improve performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { gzip, deflate, brotliCompress } from 'zlib';
import { promisify } from 'util';
import { logger } from '@/lib/logger';

const gzipAsync = promisify(gzip);
const deflateAsync = promisify(deflate);
const brotliAsync = promisify(brotliCompress);

// Minimum size for compression (bytes)
const MIN_COMPRESS_SIZE = 1024; // 1KB

// Content types to compress
const COMPRESSIBLE_TYPES = [
  'application/json',
  'application/javascript',
  'text/html',
  'text/css',
  'text/plain',
  'text/xml',
  'application/xml',
  'image/svg+xml',
];

/**
 * Check if response should be compressed
 */
function shouldCompress(req: NextRequest, contentType: string, contentLength: number): boolean {
  // Skip if too small
  if (contentLength < MIN_COMPRESS_SIZE) {
    return false;
  }
  
  // Skip if client doesn't support compression
  const acceptEncoding = req.headers.get('accept-encoding') || '';
  if (!acceptEncoding) {
    return false;
  }
  
  // Check content type
  return COMPRESSIBLE_TYPES.some(type => contentType.includes(type));
}

/**
 * Get best compression method supported by client
 */
function getBestEncoding(acceptEncoding: string): 'br' | 'gzip' | 'deflate' | null {
  const encodings = acceptEncoding.toLowerCase().split(',').map(e => e.trim());
  
  if (encodings.includes('br')) return 'br';
  if (encodings.includes('gzip')) return 'gzip';
  if (encodings.includes('deflate')) return 'deflate';
  
  return null;
}

/**
 * Compress data with specified encoding
 */
async function compressData(data: Buffer, encoding: 'br' | 'gzip' | 'deflate'): Promise<Buffer> {
  switch (encoding) {
    case 'br':
      return brotliAsync(data);
    case 'gzip':
      return gzipAsync(data);
    case 'deflate':
      return deflateAsync(data);
  }
}

/**
 * Compression middleware
 */
export async function compressionMiddleware(
  req: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  // Skip if compression disabled
  if (process.env.DISABLE_COMPRESSION === 'true') {
    return response;
  }
  
  // Skip if already compressed
  if (response.headers.has('content-encoding')) {
    return response;
  }
  
  const contentType = response.headers.get('content-type') || '';
  const contentLength = parseInt(response.headers.get('content-length') || '0');
  
  // Check if should compress
  if (!shouldCompress(req, contentType, contentLength)) {
    return response;
  }
  
  // Get best encoding
  const acceptEncoding = req.headers.get('accept-encoding') || '';
  const encoding = getBestEncoding(acceptEncoding);
  
  if (!encoding) {
    return response;
  }
  
  try {
    // Get response body
    const body = await response.arrayBuffer();
    const buffer = Buffer.from(body);
    
    // Compress
    const compressed = await compressData(buffer, encoding);
    
    // Calculate compression ratio
    const ratio = ((1 - compressed.length / buffer.length) * 100).toFixed(1);
    
    // Create new response with compressed body
    const headers = new Headers(response.headers);
    headers.set('Content-Encoding', encoding);
    headers.set('Content-Length', compressed.length.toString());
    headers.set('X-Compression-Ratio', `${ratio}%`);
    headers.set('Vary', 'Accept-Encoding');
    
    return new NextResponse(new Uint8Array(compressed), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    logger.error('Compression error', error as Error);
    return response;
  }
}

/**
 * API pagination utilities
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    nextCursor?: string;
    previousCursor?: string;
  };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: Required<PaginationParams>
): PaginatedResponse<T> {
  const { page, limit } = params;
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

/**
 * Parse pagination parameters from request
 */
export function parsePaginationParams(req: NextRequest): Required<PaginationParams> {
  const url = new URL(req.url);
  
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
  const cursor = url.searchParams.get('cursor') || '';
  
  return { page, limit, cursor };
}

/**
 * Calculate pagination offset
 */
export function getPaginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
