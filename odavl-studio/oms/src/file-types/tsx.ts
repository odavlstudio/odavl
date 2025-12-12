/**
 * OMEGA-P5: TypeScript React (TSX) File Type Definition
 * Real parser for .tsx files (TypeScript + JSX)
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { FileMetadata, FileTypeDefinition } from './ts.js';

/**
 * Parse TSX file and extract metadata
 * OMEGA-P5: Real implementation extending TypeScript parser
 */
async function parseTSXFile(filePath: string): Promise<FileMetadata> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Extract imports
    const imports = content.match(/^import\s+.*\s+from\s+['"]([^'"]+)['"]/gm) || [];
    const importPaths = imports.map((imp) => {
      const match = imp.match(/from\s+['"]([^'"]+)['"]/);
      return match ? match[1] : '';
    }).filter(Boolean);

    // Extract exports
    const exports = content.match(/^export\s+(default\s+)?(class|function|const|interface|type)\s+(\w+)/gm) || [];
    const exportNames = exports.map((exp) => exp.split(/\s+/).pop() || '').filter(Boolean);

    // Count React components (function/class components)
    const components = (content.match(/function\s+[A-Z]\w+\s*\(/g) || []).length +
                      (content.match(/const\s+[A-Z]\w+\s*[:=]\s*\(/g) || []).length +
                      (content.match(/class\s+[A-Z]\w+\s+extends\s+(React\.)?Component/g) || []).length;

    // Count hooks usage
    const hooks = (content.match(/use[A-Z]\w+\(/g) || []).length;

    // Calculate complexity (TSX specific)
    const complexity = Math.min(100, (components * 15) + (hooks * 5) + (lines.length / 10));

    // Extract dependencies
    const dependencies = importPaths.filter((imp) => !imp.startsWith('.') && !imp.startsWith('/'));

    return {
      path: filePath,
      type: 'tsx',
      size: content.length,
      complexity: Math.round(complexity),
      imports: importPaths,
      exports: exportNames,
      functions: components,
      classes: (content.match(/class\s+[A-Z]\w+/g) || []).length,
      interfaces: (content.match(/interface\s+\w+/g) || []).length,
      hasTests: filePath.includes('.test.') || filePath.includes('.spec.'),
      dependencies,
    };
  } catch (error) {
    console.error(`Failed to parse TSX file ${filePath}:`, error);
    return {
      path: filePath,
      type: 'tsx',
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

/**
 * TSX File Type Definition
 * OMEGA-P5: High importance for React apps
 */
export const TSXFileType: FileTypeDefinition = {
  id: 'tsx',
  extensions: ['.tsx'],
  category: 'app',
  riskWeight: 0.2, // Medium risk (UI components)
  importance: 0.9, // Very high importance (app layer)
  parse: parseTSXFile,
};
