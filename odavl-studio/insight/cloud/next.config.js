/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    
    // TypeScript configuration
    typescript: {
        ignoreBuildErrors: false, // Enforce type safety in production
    },
    
    // ESLint configuration
    eslint: {
        ignoreDuringBuilds: false,
    },
    
    // Performance optimizations
    compress: true, // Enable gzip compression
    poweredByHeader: false, // Remove X-Powered-By header
    generateEtags: true, // Enable ETags for caching
    
    // Security headers
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload', // 2 years
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
                    },
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on',
                    },
                ],
            },
            {
                // Cache static assets for 1 year
                source: '/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                // Cache images for 1 week
                source: '/images/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=604800, stale-while-revalidate=86400',
                    },
                ],
            },
            {
                // No caching for API routes
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, must-revalidate',
                    },
                ],
            },
        ];
    },
    
    // Redirects for old URLs
    async redirects() {
        return [
            {
                source: '/login',
                destination: '/auth/login',
                permanent: true,
            },
            {
                source: '/register',
                destination: '/auth/register',
                permanent: true,
            },
        ];
    },
    
    // Build optimizations
    swcMinify: true, // Use SWC minifier (faster than Terser)
    productionBrowserSourceMaps: false, // Disable source maps in production
    optimizeFonts: true, // Enable font optimization
    
    // Server configuration
    skipTrailingSlashRedirect: true,
    skipMiddlewareUrlNormalize: true,
    serverExternalPackages: ['bcryptjs', 'jsonwebtoken'],
    
    // Bundle analyzer (only in development)
    ...(process.env.ANALYZE === 'true' && {
        webpack: (config, { isServer }) => {
            if (!isServer) {
                const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
                config.plugins.push(
                    new BundleAnalyzerPlugin({
                        analyzerMode: 'static',
                        reportFilename: './bundle-analysis.html',
                        openAnalyzer: false,
                    })
                );
            }
            return config;
        },
    }),
};

module.exports = nextConfig;
