// tsup.config.ts - ODAVL Insight Core Build Configuration (Pure CJS)
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    // Main exports
    'index': 'src/index.ts',
    'server': 'src/server.ts',
    'learn': 'src/learn.ts',
    'training': 'src/training.ts',
    
    // Wave 8 Phase 2: Worker script for process isolation
    'core/detector-worker': 'src/core/detector-worker.ts',
    
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
  
  format: ['cjs'],  // CJS ONLY - no ESM
  dts: false,       // Phase 5: Kotlin detector has invalid characters, skip .d.ts
  
  platform: 'node',
  bundle: true,     // MUST bundle internal files, externalize dependencies
  splitting: false,
  treeshake: false,
  
  // Externalize all dependencies to avoid bundling CJS modules
  external: [
    // Node.js built-ins (both with and without node: prefix)
    'fs', 'path', 'child_process', 'util', 'stream', 'events', 'crypto', 'tty', 'os', 'module',
    'node:fs', 'node:path', 'node:child_process', 'node:util', 'node:stream', 
    'node:events', 'node:crypto', 'node:tty', 'node:os', 'node:module',
    'node:fs/promises', 'node:worker_threads', 'node:perf_hooks',
    // Problematic CJS dependencies that cause ESM/CJS interop issues
    'graphlib',
    'debug',
    'supports-color',  // Transitive dep of debug
    'ms',              // Transitive dep of debug
    'typescript',
    'eslint',
    '@typescript-eslint/parser',
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/typescript-estree',
    '@typescript-eslint/utils',
    '@typescript-eslint/types',
    // Other npm dependencies
    'glob',
    'minimatch',
    'madge',
    'dependency-cruiser',
    'jspdf',
    'jspdf-autotable',
    'sql-query-identifier',
    'pg',
    '@anthropic-ai/sdk',
    '@next/mdx',
    '@prisma/client',
    'prisma',
    // Workspace packages
    '@odavl-studio/telemetry',
    '@odavl-studio/oms',  // Phase 5: External OMS package
  ],
  
  minify: false,
  sourcemap: false,
  clean: true,
  target: 'node18',
  
  // CJS output only - no extension customization needed
  outExtension() {
    return { js: '.cjs' };
  },
});
