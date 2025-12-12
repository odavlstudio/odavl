/**
 * OMEGA-P5: JavaScript File Type Definition
 * Real parser for .js files
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { FileMetadata, FileTypeDefinition } from './ts.js';

/**
 * Parse JavaScript file and extract metadata
 */
async function parseJSFile(filePath: string): Promise<FileMetadata> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Extract imports (ES6 and CommonJS)
    const esImports = content.match(/^import\s+.*\s+from\s+['"]([^'"]+)['"]/gm) || [];
    const cjsRequires = content.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g) || [];
    const importPaths = [
      ...esImports.map((imp) => imp.match(/from\s+['"]([^'"]+)['"]/)?.[1] || ''),
      ...cjsRequires.map((req) => req.match(/['"]([^'"]+)['"]/)?.[1] || ''),
    ].filter(Boolean);

    // Extract exports
    const exports = content.match(/^export\s+(default\s+)?(function|const|class|var|let)\s+(\w+)/gm) || [];
    const moduleExports = content.match(/module\.exports\s*=\s*(\w+)/g) || [];
    const exportNames = [...exports, ...moduleExports].map((exp) => exp.split(/\s+/).pop() || '').filter(Boolean);

    // Count functions
    const functions = (content.match(/function\s+\w+\s*\(/g) || []).length +
                     (content.match(/const\s+\w+\s*=\s*\([^)]*\)\s*=>/g) || []).length;

    // Count classes
    const classes = (content.match(/class\s+\w+/g) || []).length;

    // Calculate complexity
    const complexity = Math.min(100, (functions * 5) + (classes * 10) + (lines.length / 10));

    // Extract dependencies
    const dependencies = importPaths.filter((imp) => !imp.startsWith('.') && !imp.startsWith('/'));

    return {
      path: filePath,
      type: 'javascript',
      size: content.length,
      complexity: Math.round(complexity),
      imports: importPaths,
      exports: exportNames,
      functions,
      classes,
      interfaces: 0,
      hasTests: filePath.includes('.test.') || filePath.includes('.spec.'),
      dependencies,
    };
  } catch (error) {
    console.error(`Failed to parse JS file ${filePath}:`, error);
    return {
      path: filePath,
      type: 'javascript',
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

export const JSFileType: FileTypeDefinition = {
  id: 'javascript',
  extensions: ['.js', '.mjs', '.cjs'],
  category: 'code',
  riskWeight: 0.2,
  importance: 0.7,
  parse: parseJSFile,
};
