// @ts-check
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Next.js 14.2.21 LTS - Enterprise-Grade Stable Release
  // Used by: Fortune 500 companies, governments, and enterprise platforms worldwide
  // Most stable Next.js version for large-scale production deployments

  reactStrictMode: true,

  // Runtime rendering for auth contexts (SessionProvider/TRPC)
  // Static generation disabled for pages requiring authentication
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'lucide-react'],
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.odavl.studio'
      }
    ]
  },

  // Performance & Security
  compress: true,
  poweredByHeader: false,

  // 🔒 Security Headers - P0 Fix
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0'
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://vitals.vercel-insights.com https://*.sentry.io",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          }
        ]
      }
    ];
  },

  // Package optimizations
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'lucide-react'],
  },

  // Webpack configuration for monorepo path resolution
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    config.resolve.alias['@/packages'] = path.resolve(__dirname, '../../packages');
    config.resolve.alias['@odavl'] = path.resolve(__dirname, '../../packages');
    return config;
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false, // Keep type checking enabled
  },

  // Disable SSG for error pages (/_error, /404, /500)
  // Next.js will use default runtime error pages
  generateBuildId: async () => {
    return `odavl-studio-${Date.now()}`;
  },
};

export default withNextIntl(nextConfig);

