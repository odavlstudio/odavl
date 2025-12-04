import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/extension.ts'],
  format: ['cjs'],
  dts: false,
  clean: true,
  external: ['vscode'],
  platform: 'node',
  target: 'node18',
  outDir: 'dist',
  noExternal: ['axios'],
});
