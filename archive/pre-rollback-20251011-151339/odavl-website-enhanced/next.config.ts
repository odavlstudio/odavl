import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";
import createMDX from '@next/mdx';
// ODAVL-WAVE-X8-INJECT: Monitoring & Testing Infrastructure Ready
// ODAVL-RUNTIME-INJECT-TURBOPACK-ROOT: Fix multi-lockfile warning

const withNextIntl = createNextIntlPlugin();

// Bundle analyzer for performance monitoring
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
});

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  /* <ODAVL-WAVE-X9-INJECT-START> */
  // Marketing & Brand Ecosystem - Landing pages and redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/articles',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/examples',
        destination: '/showcase',
        permanent: true,
      },
    ];
  },
  /* <ODAVL-WAVE-X9-INJECT-END> */
  /* <ODAVL-WAVE-X10-INJECT-START> */
  // Self-Evolving System - Weekly evolution scheduler reference
  webpack: (config, { dev }) => {
    if (dev) {
      // Reference evolution scheduler for CI/CD integration
      config.resolve.alias['@evolution'] = './config/evolution/';
    }
    return config;
  },
  /* <ODAVL-WAVE-X10-INJECT-END> */
  /* <ODAVL-WAVE-X2-INJECT-START> */
  // Performance optimizations for <500ms load time
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn'],
    },
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
    webVitalsAttribution: ['CLS', 'LCP'],
  },

  // Enhanced security and performance headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  /* <ODAVL-WAVE-X2-INJECT-END> */
};

export default withBundleAnalyzer(withNextIntl(withMDX(nextConfig)));
