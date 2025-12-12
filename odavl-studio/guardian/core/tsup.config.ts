import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts', 'src/guardian-cli.ts', 'src/runtime/guardian-ci.ts'],
  format: ['esm'],
  dts: false, // Temporarily disabled due to Brain module resolution issues
  clean: true,
  external: ['@odavl-studio/telemetry', '@odavl/brain/runtime', '@odavl-studio/brain/runtime'],
  esbuildOptions(options) {
    options.platform = 'node';
    options.target = 'node18';
  },
});
