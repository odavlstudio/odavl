/**
 * OMEGA-P5: TypeScript Config File Type Definition
 * Real parser for *.config.ts files
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { FileMetadata, FileTypeDefinition } from './ts.js';

async function parseConfigTS(filePath: string): Promise<FileMetadata> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Detect framework
    const framework = content.includes('defineConfig') ? 'vite' :
                     content.includes('nextConfig') ? 'next' :
                     content.includes('playwright') ? 'playwright' : 'generic';

    // Extract imports
    const imports = content.match(/^import\s+.*\s+from\s+['"]([^'"]+)['"]/gm) || [];
    const importPaths = imports.map((imp) => imp.match(/from\s+['"]([^'"]+)['"]/)?.[1] || '').filter(Boolean);

    // Count exports
    const exports = (content.match(/^export\s+(default|const|function)/gm) || []).length;

    const complexity = Math.min(100, (exports * 10) + (lines.length / 10));

    return {
      path: filePath,
      type: 'config-ts',
      size: content.length,
      complexity: Math.round(complexity),
      imports: importPaths,
      exports: [framework],
      functions: 0,
      classes: 0,
      interfaces: 0,
      hasTests: false,
      dependencies: importPaths.filter((imp) => !imp.startsWith('.') && !imp.startsWith('/')),
    };
  } catch (error) {
    return {
      path: filePath,
      type: 'config-ts',
      size: 0,
      complexity: 0,
      imports: [],
      exports: [],
      functions: 0,
      classes: 0,
      interfaces: 0,
      hasTests: false,
      dependencies: [],
    };
  }
}

export const ConfigTSFileType: FileTypeDefinition = {
  id: 'config-ts',
  extensions: ['.config.ts'],
  category: 'config',
  riskWeight: 0.2,
  importance: 0.6,
  parse: parseConfigTS,
};
