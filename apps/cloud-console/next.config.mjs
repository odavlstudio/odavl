/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  }
];

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Skip default error pages (use App Router error.tsx instead)
  generateEtags: false,
  compress: false,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:8090',
  },
  webpack: (config, { isServer }) => {
    // Ignore optional pino dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-elasticsearch': false,
      'fastbench': false,
      'desm': false,
      'tap': false,
    };
    
    // Ignore test files in node_modules
    config.module = config.module || {};
    config.module.exprContextCritical = false;
    
    return config;
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/app/dashboard',
        permanent: false,
      },
      {
        source: '/dashboard',
        destination: '/app/dashboard',
        permanent: false,
      },
      {
        source: '/projects',
        destination: '/app/projects',
        permanent: false,
      },
      {
        source: '/settings',
        destination: '/app/settings',
        permanent: false,
      },
      {
        source: '/billing',
        destination: '/app/billing',
        permanent: false,
      },
      {
        source: '/marketplace',
        destination: '/app/marketplace',
        permanent: false,
      },
      {
        source: '/intelligence',
        destination: '/app/intelligence',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
