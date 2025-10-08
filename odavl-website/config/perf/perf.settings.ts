// ODAVL WAVE X-2 Performance Settings
// Target: <500ms load time, Lighthouse ≥99

export const perfSettings = {
  // Core Web Vitals targets
  targets: {
    LCP: 1200,      // Largest Contentful Paint (ms)
    FID: 100,       // First Input Delay (ms)  
    CLS: 0.1,       // Cumulative Layout Shift
    TTFB: 200,      // Time to First Byte (ms)
    FCP: 800,       // First Contentful Paint (ms)
    loadTime: 500,  // Total load time target (ms)
  },
  
  // Lighthouse score targets
  lighthouse: {
    performance: 99,
    accessibility: 100,
    bestPractices: 100,
    seo: 100,
    pwa: 95,
  },
  
  // Bundle size limits
  bundles: {
    maxJSSize: 244000,      // 244KB gzipped
    maxCSSSize: 50000,      // 50KB gzipped
    maxImageSize: 500000,   // 500KB per image
    maxFontSize: 200000,    // 200KB total fonts
  },
  
  // Cache settings
  cache: {
    staticAssets: '31536000',    // 1 year
    dynamicContent: '3600',      // 1 hour
    fonts: '31536000',           // 1 year
    images: '2592000',           // 30 days
  },
  
  // Optimization flags
  optimization: {
    swcMinify: true,
    compilerRemoveConsole: true,
    modularizeImports: true,
    bundleAnalyzer: false,
    experimentalOptimizePackageImports: true,
  },
} as const;