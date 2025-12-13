import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,  // Skip DTS for now, CLI doesn't need exported types
  clean: true,
  sourcemap: false,  // Skip sourcemaps for faster builds
  target: 'node18',
  external: [
    '@odavl-studio/oms',
    '@odavl-studio/oms/risk',
  ],
  noExternal: [
    'chalk',
    'commander',
    'ora',
  ],
});
