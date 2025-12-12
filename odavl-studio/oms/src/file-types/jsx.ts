/**
 * OMEGA-P5: JSX File Type Definition
 * Real parser for .jsx files (JavaScript + JSX)
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { FileMetadata, FileTypeDefinition } from './ts.js';

async function parseJSXFile(filePath: string): Promise<FileMetadata> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Extract imports
    const imports = content.match(/^import\s+.*\s+from\s+['"]([^'"]+)['"]/gm) || [];
    const importPaths = imports.map((imp) => imp.match(/from\s+['"]([^'"]+)['"]/)?.[1] || '').filter(Boolean);

    // Count React components
    const components = (content.match(/function\s+[A-Z]\w+\s*\(/g) || []).length +
                      (content.match(/const\s+[A-Z]\w+\s*=\s*\(/g) || []).length +
                      (content.match(/class\s+[A-Z]\w+\s+extends/g) || []).length;

    // Count hooks
    const hooks = (content.match(/use[A-Z]\w+\(/g) || []).length;

    const complexity = Math.min(100, (components * 15) + (hooks * 5) + (lines.length / 10));

    const dependencies = importPaths.filter((imp) => !imp.startsWith('.') && !imp.startsWith('/'));

    return {
      path: filePath,
      type: 'jsx',
      size: content.length,
      complexity: Math.round(complexity),
      imports: importPaths,
      exports: [],
      functions: components,
      classes: 0,
      interfaces: 0,
      hasTests: false,
      dependencies,
    };
  } catch (error) {
    return {
      path: filePath,
      type: 'jsx',
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

export const JSXFileType: FileTypeDefinition = {
  id: 'jsx',
  extensions: ['.jsx'],
  category: 'app',
  riskWeight: 0.2,
  importance: 0.8,
  parse: parseJSXFile,
};
