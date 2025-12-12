import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: true,
  clean: true,
  minify: true,
  bundle: true,
  // Only external Node.js built-ins and readline/promises
  external: [
    'readline/promises',
    'fs',
    'path',
    'os',
    'child_process',
    'crypto',
    'stream',
    'util',
    'events',
    'buffer',
    'url',
    'http',
    'https',
    'net',
    'tls',
    'zlib',
    'process'
  ],
  esbuildOptions(options) {
    options.platform = 'node';
    options.target = 'node18';
  },
});
