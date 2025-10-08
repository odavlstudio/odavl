// ODAVL WAVE X-2 Next.js Optimizations
// Advanced performance configuration for <500ms load time

export const nextOptimizations = {
  // Compiler optimizations
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn'],
    },
    reactRemoveProperties: true,
    styledComponents: false,
  },
  
  // SWC minification
  swcMinify: true,
  
  // Experimental optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-icons',
    ],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
    optimizeCss: true,
    gzipSize: true,
  },
  
  // Image optimization enhancements
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000, // 30 days
    unoptimized: false,
    loader: 'default',
    quality: 85,
    priority: true,
  },
  
  // Output optimization
  output: 'standalone',
  generateEtags: true,
  compress: true,
  
  // Headers for performance
  headers: [
    {
      source: '/_next/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};