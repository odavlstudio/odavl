// ODAVL Wave 3: Performance Budget (for governance, not CI-enforced)
const performanceBudget = {
    maxBundleKB: 1000, // main bundle ≤ 1 MB
    maxTTI: 3000, // Time To Interactive ≤ 3s
    maxLCP: 2500, // Largest Contentful Paint ≤ 2.5s
};
console.log('[ODAVL] Performance Budget:', performanceBudget);
/** @type {import('next').NextConfig} */

const withMDX = require('@next/mdx')({ extension: /\.mdx?$/ });
const nextConfig = {
    reactStrictMode: true,
    typedRoutes: true,
    pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
};
module.exports = withMDX(nextConfig);
