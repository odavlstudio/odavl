import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts', 'src/index.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  target: 'node20',
  outDir: 'dist',
});
