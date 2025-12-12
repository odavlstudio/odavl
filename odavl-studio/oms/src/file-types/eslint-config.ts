/**
 * OMEGA-P5: ESLint Config File Type Definition
 * Real parser for ESLint config files
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { FileMetadata, FileTypeDefinition } from './ts.js';

async function parseESLintConfig(filePath: string): Promise<FileMetadata> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');

    // Count rules
    const rules = (content.match(/["'][\w-/]+["']\s*:\s*[["']/g) || []).length;

    // Count plugins
    const plugins = (content.match(/plugins:\s*\[/g) || []).length;

    // Count extends
    const extendsMatch = content.match(/extends:\s*\[([^\]]+)\]/);
    const extendsCount = extendsMatch ? extendsMatch[1].split(',').length : 0;

    const complexity = Math.min(100, (rules * 1) + (plugins * 5) + (extendsCount * 3));

    return {
      path: filePath,
      type: 'eslint-config',
      size: content.length,
      complexity: Math.round(complexity),
      imports: [],
      exports: [],
      functions: rules,
      classes: plugins,
      interfaces: extendsCount,
      hasTests: false,
      dependencies: [],
    };
  } catch (error) {
    return {
      path: filePath,
      type: 'eslint-config',
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

export const ESLintConfigFileType: FileTypeDefinition = {
  id: 'eslint-config',
  extensions: ['.eslintrc.json', '.eslintrc.js', 'eslint.config.js', 'eslint.config.mjs'],
  category: 'config',
  riskWeight: 0.1,
  importance: 0.4,
  parse: parseESLintConfig,
};
