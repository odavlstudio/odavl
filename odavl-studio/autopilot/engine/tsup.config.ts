import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: true,
  tsconfig: 'tsconfig.build.json',
  
  // Mark problematic deps as external (will be required at runtime)
  external: [
    'minimatch',
    'glob',
    '@odavl-studio/insight-core',
    '@odavl-studio/insight-core/server',
  ],
  
  // esbuild options
  esbuildOptions(options) {
    options.platform = 'node';
    options.target = 'node18';
  },
});
