/**
 * Image Optimization Configuration for Next.js
 * Handles image optimization, lazy loading, and responsive images
 */

import type { ImageLoaderProps } from 'next/image';

/**
 * Custom image loader for CDN
 * Supports CloudFlare, AWS CloudFront, and local optimization
 */
export const imageLoader = ({ src, width, quality }: ImageLoaderProps): string => {
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;

  // Use CDN if available
  if (cdnUrl) {
    // CloudFlare Image Resizing
    if (cdnUrl.includes('cloudflare')) {
      return `${cdnUrl}/cdn-cgi/image/width=${width},quality=${quality || 75},format=auto/${src}`;
    }

    // AWS CloudFront with Lambda@Edge
    if (cdnUrl.includes('cloudfront')) {
      return `${cdnUrl}/${src}?w=${width}&q=${quality || 75}`;
    }

    // Generic CDN
    return `${cdnUrl}${src}?w=${width}&q=${quality || 75}`;
  }

  // Fallback to local optimization
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
};

/**
 * Device sizes for responsive images
 * Based on common breakpoints
 */
export const deviceSizes = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];

/**
 * Image sizes for srcset
 */
export const imageSizes = [16, 32, 48, 64, 96, 128, 256, 384];

/**
 * Allowed image domains
 */
export const domains = [
  'odavl.com',
  'cdn.odavl.com',
  'images.odavl.com',
  'res.cloudinary.com',
  'unsplash.com',
];

/**
 * Image formats to support
 */
export const formats = ['image/avif', 'image/webp'];

/**
 * Image optimization quality settings
 */
export const qualitySettings = {
  thumbnail: 60, // Small thumbnails
  standard: 75, // Default quality
  high: 85, // High-quality images
  lossless: 100, // No compression
};

/**
 * Blur placeholder data URL generator
 */
export const generateBlurDataURL = (width: number = 10, height: number = 10): string => {
  const canvas = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`;
};

/**
 * Get optimal image size based on viewport
 */
export const getOptimalImageSize = (containerWidth: number): number => {
  // Find the smallest device size that's larger than container
  const size = deviceSizes.find((s) => s >= containerWidth);
  return size || deviceSizes[deviceSizes.length - 1];
};

/**
 * Image priority hints
 * Determines which images should load first
 */
export const isPriorityImage = (src: string): boolean => {
  // Hero images
  if (src.includes('hero')) return true;

  // Above-the-fold images
  if (src.includes('banner')) return true;
  if (src.includes('logo')) return true;

  // First carousel/slider image
  if (src.includes('slide-1')) return true;

  return false;
};

/**
 * Lazy loading configuration
 */
export const lazyLoadConfig = {
  // Loading strategy
  loading: 'lazy' as const,

  // Root margin for IntersectionObserver
  rootMargin: '50px',

  // Threshold for visibility
  threshold: 0.01,
};

/**
 * Image cache configuration
 */
export const cacheConfig = {
  // Cache images for 1 year
  maxAge: 31536000,

  // Use stale-while-revalidate
  staleWhileRevalidate: 86400, // 1 day
};

/**
 * Image processing pipeline
 */
export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'avif' | 'webp' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'center';
  blur?: number;
  sharpen?: number;
  grayscale?: boolean;
}

/**
 * Build image URL with processing options
 */
export const buildImageUrl = (src: string, options: ImageProcessingOptions = {}): string => {
  const {
    width,
    height,
    quality = 75,
    format = 'webp',
    fit = 'cover',
    position = 'center',
    blur,
    sharpen,
    grayscale,
  } = options;

  const params = new URLSearchParams();

  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  params.append('q', quality.toString());
  params.append('fm', format);
  params.append('fit', fit);
  params.append('pos', position);

  if (blur) params.append('blur', blur.toString());
  if (sharpen) params.append('sharpen', sharpen.toString());
  if (grayscale) params.append('grayscale', 'true');

  return imageLoader({ src: `${src}?${params.toString()}`, width: width || 1920, quality });
};

/**
 * Responsive image srcset generator
 */
export const generateSrcSet = (src: string, sizes: number[] = deviceSizes): string => {
  return sizes
    .map((size) => {
      const url = imageLoader({ src, width: size, quality: 75 });
      return `${url} ${size}w`;
    })
    .join(', ');
};

/**
 * Image dimensions from URL
 * Extracts width and height from image URLs
 */
export const getImageDimensions = (src: string): { width: number; height: number } | null => {
  // Try to extract from filename (e.g., image-800x600.jpg)
  const match = src.match(/(\d+)x(\d+)/);
  if (match) {
    return {
      width: parseInt(match[1], 10),
      height: parseInt(match[2], 10),
    };
  }

  return null;
};

/**
 * Preload critical images
 */
export const preloadImage = (src: string, priority: 'high' | 'low' = 'high'): void => {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  link.fetchPriority = priority;

  document.head.appendChild(link);
};

/**
 * Image optimization metrics
 */
export const trackImagePerformance = (src: string, loadTime: number): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Image loaded: ${src} (${loadTime}ms)`);
  }

  // Send to analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'image_load', {
      image_url: src,
      load_time: loadTime,
    });
  }
};

export default imageLoader;
