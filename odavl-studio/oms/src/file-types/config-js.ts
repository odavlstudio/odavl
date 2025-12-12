/**
 * OMEGA-P5: JavaScript Config File Type Definition
 * Real parser for *.config.js files
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { FileMetadata, FileTypeDefinition } from './ts.js';

async function parseConfigJS(filePath: string): Promise<FileMetadata> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Detect module type
    const moduleType = content.includes('module.exports') ? 'cjs' : 'esm';

    // Extract imports/requires
    const esImports = content.match(/^import\s+.*\s+from\s+['"]([^'"]+)['"]/gm) || [];
    const cjsRequires = content.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g) || [];
    const importPaths = [
      ...esImports.map((imp) => imp.match(/from\s+['"]([^'"]+)['"]/)?.[1] || ''),
      ...cjsRequires.map((req) => req.match(/['"]([^'"]+)['"]/)?.[1] || ''),
    ].filter(Boolean);

    const complexity = Math.min(100, (importPaths.length * 5) + (lines.length / 10));

    return {
      path: filePath,
      type: 'config-js',
      size: content.length,
      complexity: Math.round(complexity),
      imports: importPaths,
      exports: [moduleType],
      functions: 0,
      classes: 0,
      interfaces: 0,
      hasTests: false,
      dependencies: importPaths.filter((imp) => !imp.startsWith('.') && !imp.startsWith('/')),
    };
  } catch (error) {
    return {
      path: filePath,
      type: 'config-js',
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

export const ConfigJSFileType: FileTypeDefinition = {
  id: 'config-js',
  extensions: ['.config.js', '.config.mjs', '.config.cjs'],
  category: 'config',
  riskWeight: 0.2,
  importance: 0.6,
  parse: parseConfigJS,
};
