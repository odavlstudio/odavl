import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    learning: 'src/learning.ts',
    runtime: 'src/runtime.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
  external: [
    '@odavl/core',
    '@odavl-studio/insight-core',
    '@odavl-studio/autopilot-engine',
    '@odavl-studio/guardian-core',
    '@tensorflow/tfjs-node',
    'mock-aws-s3',
    /^node:.*/,
  ],
  noExternal: [],
  treeshake: true,
  target: 'es2022',
  minify: false,
  bundle: true,
  skipNodeModulesBundle: true,
});
