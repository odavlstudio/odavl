/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,

    // ===== PERFORMANCE OPTIMIZATIONS =====

    // Enable gzip compression (for development only, use CDN in production)
    compress: true,

    // Modularize large libraries (tree-shaking)
    modularizeImports: {
        // Recharts: Only import used components
        recharts: {
            transform: 'recharts/es6/{{member}}',
            skipDefaultConversion: true
        },
        // Lodash: Import individual functions
        lodash: {
            transform: 'lodash/{{member}}'
        },
        // React Icons: Import individual icons
        'react-icons': {
            transform: 'react-icons/{{member}}'
        }
    },

    experimental: {
        serverActions: {
            bodySizeLimit: '10mb'
        },
        // Optimize package imports (Next.js 13.5+)
        optimizePackageImports: [
            'recharts',
            'react-icons',
            'date-fns'
        ]
    },

    // Turbopack configuration (Next.js 16+ with empty config to silence warning)
    turbopack: {},

    // Webpack optimizations
    webpack: (config, { dev, isServer }) => {
        // Disable conflicting cache options in development
        if (dev) {
            config.cache = false;
        }

        // Exclude Playwright from client-side bundle
        if (!isServer) {
            config.resolve.alias = {
                ...config.resolve.alias,
                '@odavl-studio/guardian-core': false,
                'playwright-core': false,
                'playwright': false,
            };
        } else {
            // For server, externalize Playwright
            config.externals = [...(config.externals || []), 'playwright-core', 'playwright'];
        }

        // Ignore Playwright's binary files
        config.module.rules.push({
            test: /\.(ttf|woff|woff2|eot|html)$/,
            type: 'asset/resource',
        });

        // Enable tree shaking
        config.optimization = {
            ...config.optimization,
            usedExports: true,
            sideEffects: false
        };

        // Analyze bundle size (run with `ANALYZE=true pnpm build`)
        if (process.env.ANALYZE === 'true' && !isServer) {
            const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')();
            config.plugins.push(
                new BundleAnalyzerPlugin({
                    analyzerMode: 'static',
                    reportFilename: './bundle-analysis.html',
                    openAnalyzer: true
                })
            );
        }

        return config;
    },

    env: {
        DATABASE_URL: process.env.DATABASE_URL,
        REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
    }
};

export default nextConfig;

