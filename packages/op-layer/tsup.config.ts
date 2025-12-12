import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/protocols.ts',
    'src/types.ts',
    'src/utilities.ts',
    'src/client.ts',
    'src/github.ts',
  ],
  format: ['esm', 'cjs'],
  dts: {
    // Skip generating .d.ts for files importing external dependencies
    entry: {
      index: 'src/index.ts',
      protocols: 'src/protocols.ts',
      types: 'src/types.ts',
      utilities: 'src/utilities.ts',
      client: 'src/client.ts',
      github: 'src/github.ts',
    },
  },
  external: ['@odavl-studio/insight-core'],
  splitting: true,
  clean: true,
  sourcemap: false,
  treeshake: true,
});
