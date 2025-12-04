#!/usr/bin/env node
// ODAVL Insight Core - esbuild configuration
// Replaces tsup to fix ESM/CJS "Dynamic require not supported" error

const esbuild = require('esbuild');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Entry points matching tsup.config.ts
const entryPoints = [
  'src/index.ts',
  'src/server.ts',
  'src/detector/index.ts',
  'src/learning/index.ts'
];

// External Node.js built-ins (don't bundle these)
const external = [
  'fs', 'path', 'child_process', 'util', 'stream', 'events', 'crypto',
  'node:fs', 'node:path', 'node:child_process', 'node:util', 'node:stream', 'node:events', 'node:crypto',
  'typescript', 'eslint', '@typescript-eslint/parser', '@typescript-eslint/eslint-plugin'
];

async function build() {
  console.log('🔨 Building with esbuild (ESM + CJS)...\n');

  // Clean dist directory
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  try {
    // Build ESM with bundling but keep node: imports external
    await esbuild.build({
      entryPoints,
      outdir: 'dist',
      bundle: true,  // ← Bundle dependencies
      format: 'esm',
      platform: 'node',
      target: 'node18',
      external: external,  // Keep Node.js built-ins external
      splitting: false,
      outExtension: { '.js': '.mjs' },
      sourcemap: false,
      minify: false,
      keepNames: true,
    });
    console.log('✅ ESM build complete');

    // Build CJS with bundling
    await esbuild.build({
      entryPoints,
      outdir: 'dist',
      bundle: true,  // ← Bundle dependencies
      format: 'cjs',
      platform: 'node',
      target: 'node18',
      external: external,  // Keep Node.js built-ins external
      splitting: false,
      outExtension: { '.js': '.js' },
      sourcemap: false,
      minify: false,
      keepNames: true,
    });
    console.log('✅ CJS build complete');

    // Generate type definitions using tsc
    console.log('\n📝 Generating type definitions...');
    try {
      execSync('pnpm exec tsc --emitDeclarationOnly --declaration --skipLibCheck', {
        stdio: 'inherit',
        cwd: __dirname
      });
      console.log('✅ Type definitions generated');
    } catch (dtsErr) {
      console.warn('⚠️  Type generation failed (non-critical):', dtsErr.message);
      console.log('   Runtime builds are complete - Autopilot can still use them');
    }

    console.log('✅ Runtime builds complete - ready for Autopilot!');

    console.log('\n🎉 Build successful!');
  } catch (err) {
    console.error('❌ Build failed:', err.message);
    process.exit(1);
  }
}

build();
