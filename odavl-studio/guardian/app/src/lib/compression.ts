import compression from 'compression';
import type { Request, Response } from 'express';
import logger from './logger';

/**
 * Compression middleware configuration
 * 
 * This middleware applies gzip/brotli compression to API responses
 * to reduce bandwidth usage and improve response times.
 * 
 * Best Practices:
 * - Only compress responses >= 1KB (threshold)
 * - Skip compression for binary/image responses
 * - Use Brotli (br) if client supports it, fallback to gzip
 * - Compression level 6 (balance speed vs size)
 */

// Minimum response size to compress (1KB)
const COMPRESSION_THRESHOLD = 1024;

// Compression level (0-9, higher = better compression but slower)
// 6 is a good balance for production
const COMPRESSION_LEVEL = 6;

/**
 * Content types that should NOT be compressed
 * (already compressed or binary formats)
 */
const EXCLUDED_CONTENT_TYPES = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/x-icon',

    // Videos
    'video/mp4',
    'video/mpeg',
    'video/webm',
    'video/ogg',

    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'audio/ogg',

    // Archives (already compressed)
    'application/zip',
    'application/gzip',
    'application/x-gzip',
    'application/x-tar',
    'application/x-bzip2',
    'application/x-7z-compressed',
    'application/x-rar-compressed',

    // PDFs
    'application/pdf'
];

/**
 * Filter function to determine if response should be compressed
 */
function shouldCompress(req: Request, res: Response): boolean {
    // Check if response is already compressed
    if (res.getHeader('Content-Encoding')) {
        return false;
    }

    // Get content type
    const contentType = res.getHeader('Content-Type');
    if (typeof contentType === 'string') {
        // Check if content type is in excluded list
        const isExcluded = EXCLUDED_CONTENT_TYPES.some(type =>
            contentType.toLowerCase().includes(type.toLowerCase())
        );

        if (isExcluded) {
            return false;
        }
    }

    // Use default compression filter (checks Accept-Encoding)
    return compression.filter(req, res);
}

/**
 * Create compression middleware with Guardian-specific configuration
 */
export function createCompressionMiddleware() {
    return compression({
        // Only compress responses >= 1KB
        threshold: COMPRESSION_THRESHOLD,

        // Compression level (6 = balanced)
        level: COMPRESSION_LEVEL,

        // Custom filter to exclude certain content types
        filter: shouldCompress,

        // Memory level (1-9, higher = more memory but faster)
        memLevel: 8,

        // Strategy (Z_DEFAULT_STRATEGY is best for most cases)
        strategy: 0 // Z_DEFAULT_STRATEGY
    });
}

/**
 * Log compression statistics (for debugging/monitoring)
 */
export function logCompressionStats(
    originalSize: number,
    compressedSize: number,
    contentType: string
) {
    const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(2);
    const saved = (originalSize - compressedSize) / 1024;

    logger.info(
        `[Compression] ${contentType}: ${originalSize}→${compressedSize} bytes ` +
        `(${ratio}% reduction, ${saved.toFixed(2)} KB saved)`
    );
}

/**
 * Middleware to track compression effectiveness
 * (optional, use in development for monitoring)
 */
export function compressionStatsMiddleware() {
    return (req: Request, res: Response, next: () => void) => {
        const originalWrite = res.write.bind(res);
        const originalEnd = res.end.bind(res);

        let originalSize = 0;
        let compressedSize = 0;

        // Intercept write()
        res.write = function (chunk: unknown, ...args: unknown[]): boolean {
            if (Buffer.isBuffer(chunk)) {
                originalSize += chunk.length;
            } else if (typeof chunk === 'string') {
                originalSize += Buffer.byteLength(chunk);
            }
            return originalWrite(chunk, ...(args as [any, any]));
        };

        // Intercept end()
        res.end = function (chunk: unknown, ...args: unknown[]): Response {
            if (chunk) {
                if (Buffer.isBuffer(chunk)) {
                    compressedSize += chunk.length;
                } else if (typeof chunk === 'string') {
                    compressedSize += Buffer.byteLength(chunk);
                }
            }

            // Log stats if compression was applied
            const encoding = res.getHeader('Content-Encoding');
            if (encoding && originalSize > 0 && compressedSize > 0) {
                const contentType = res.getHeader('Content-Type') || 'unknown';
                logCompressionStats(originalSize, compressedSize, contentType as string);
            }

            return originalEnd(chunk, ...(args as [any]));
        };

        next();
    };
}

/**
 * Get compression configuration for Next.js
 * (add to next.config.js)
 */
export function getNextCompressionConfig() {
    return {
        compress: true, // Enable Next.js built-in compression
        // Note: Next.js uses gzip by default
        // For Brotli, use a reverse proxy (nginx, Cloudflare)

        // Exclude static assets from compression (already compressed)
        webpack: (config: { plugins: unknown[] }) => {
            // Next.js handles this automatically
            return config;
        }
    };
}

// ===== COMPRESSION BEST PRACTICES =====

/**
 * PRODUCTION RECOMMENDATIONS:
 * 
 * 1. Use a reverse proxy (nginx, Cloudflare) for Brotli compression
 *    - Brotli offers 15-20% better compression than gzip
 *    - nginx: `brotli on; brotli_types text/plain text/css application/json;`
 * 
 * 2. Set appropriate Cache-Control headers
 *    - Compressed responses should be cacheable
 *    - Add `Vary: Accept-Encoding` header
 * 
 * 3. Monitor compression effectiveness
 *    - Track compression ratio in Prometheus metrics
 *    - Alert if compression ratio drops (indicates issues)
 * 
 * 4. CDN integration
 *    - Cloudflare: Automatic Brotli compression for Pro+ plans
 *    - CloudFront: Configure compression in behaviors
 * 
 * 5. Exclude small responses
 *    - Responses < 1KB may actually increase in size
 *    - overhead of compression headers + algorithm
 * 
 * 6. Pre-compress static assets
 *    - For Next.js static assets, pre-generate .gz/.br files
 *    - nginx can serve pre-compressed files directly
 * 
 * 7. Test with realistic data
 *    - JSON API responses compress well (60-80% reduction)
 *    - HTML compresses well (70-90% reduction)
 *    - Already compressed data (images, videos) gains nothing
 */

export default createCompressionMiddleware;
