import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true, // Re-enabled: fixableIssues property added to observe-quick.ts
  splitting: false,
  sourcemap: false,
  clean: true,
  tsconfig: 'tsconfig.build.json',
  external: [
    'minimatch',
    'glob',
    'mock-aws-s3',
    'nock',
    '@mapbox/node-pre-gyp',
    '@odavl-studio/insight-core',
    '@odavl/oplayer',
    // '@odavl-studio/telemetry' removed - now bundled with engine
  ],
  esbuildOptions(options) {
    options.platform = 'node';
    options.target = 'node18';
  },
});
