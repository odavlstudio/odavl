// tsup.config.ts - ODAVL Insight Core Build Configuration
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    // Main exports
    'index': 'src/index.ts',
    'server': 'src/server.ts',
    
    // Detector exports (individual + combined)
    'detector/index': 'src/detector/index.ts',
    'detector/typescript': 'src/detector/typescript.ts',
    'detector/eslint': 'src/detector/eslint.ts',
    'detector/security': 'src/detector/security.ts',
    'detector/performance': 'src/detector/performance.ts',
    'detector/complexity': 'src/detector/complexity.ts',
    'detector/import': 'src/detector/import.ts',
    'detector/python': 'src/detector/python.ts',
    'detector/java': 'src/detector/java.ts',
    
    // Learning module
    'learning/index': 'src/learning/index.ts',
  },
  
  format: ['esm', 'cjs'],
  dts: true,
  
  // Code splitting configuration - DISABLED for CLI compatibility
  splitting: false,
  
  // Disable tree shaking to preserve error handling code
  treeshake: false,
  
  // Externalize Node.js built-ins
  external: [
    'fs',
    'path',
    'child_process',
    'node:child_process',  // Both with and without node: prefix
    'node:fs',
    'node:path',
    'node:util',
    'util',
    'stream',
    'events',
    'crypto',
    'typescript',  // External TypeScript package to avoid bundling issues
  ],
  
  // Minification for smaller bundles
  minify: false, // Keep readable for debugging
  
  // Source maps for debugging
  sourcemap: false,
  
  // Clean dist before build
  clean: true,
  
  // Target modern Node.js
  target: 'node18',
  
  // Bundle all dependencies except externals
  noExternal: [
    'glob',
    'jspdf',
    'jspdf-autotable',
  ],
});
