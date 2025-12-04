import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/worker.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  outDir: 'dist',
  shims: true
});
