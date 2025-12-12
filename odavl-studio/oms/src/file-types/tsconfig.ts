/**
 * OMEGA-P5: tsconfig.json File Type Definition
 * Real specialized parser for tsconfig.json
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { FileMetadata, FileTypeDefinition } from './ts.js';

async function parseTSConfig(filePath: string): Promise<FileMetadata> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');
    const config = JSON.parse(content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''));

    // Extract compiler options
    const compilerOpts = config.compilerOptions || {};
    const target = compilerOpts.target || 'unknown';
    const module = compilerOpts.module || 'unknown';
    const strict = compilerOpts.strict ? 'strict' : 'loose';

    // Count includes/excludes
    const includes = (config.include || []).length;
    const excludes = (config.exclude || []).length;

    // Count path mappings
    const paths = Object.keys(compilerOpts.paths || {}).length;

    const complexity = Math.min(100, (includes * 2) + (excludes * 2) + (paths * 5));

    return {
      path: filePath,
      type: 'tsconfig',
      size: content.length,
      complexity: Math.round(complexity),
      imports: [],
      exports: [target, module, strict],
      functions: 0,
      classes: 0,
      interfaces: paths,
      hasTests: false,
      dependencies: [],
    };
  } catch (error) {
    return {
      path: filePath,
      type: 'tsconfig',
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

export const TSConfigFileType: FileTypeDefinition = {
  id: 'tsconfig',
  extensions: ['tsconfig.json', 'tsconfig.build.json', 'tsconfig.*.json'],
  category: 'config',
  riskWeight: 0.2,
  importance: 0.7,
  parse: parseTSConfig,
};
