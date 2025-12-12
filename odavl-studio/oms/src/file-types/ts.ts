/**
 * OMEGA-P5: TypeScript File Type Definition
 * Real AST-based parser for .ts files
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';

export interface FileMetadata {
  path: string;
  type: string;
  size: number;
  complexity: number;
  imports: string[];
  exports: string[];
  functions: number;
  classes: number;
  interfaces: number;
  hasTests: boolean;
  dependencies: string[];
}

export interface FileTypeDefinition {
  id: string;
  extensions: string[];
  category: 'config' | 'code' | 'infra' | 'docs' | 'app';
  riskWeight: number;
  importance: number;
  parse: (filePath: string) => Promise<FileMetadata>;
}

/**
 * Parse TypeScript file and extract metadata
 * OMEGA-P5: Real implementation using regex patterns (safe, no full AST)
 */
async function parseTypeScriptFile(filePath: string): Promise<FileMetadata> {
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
    const exports = content.match(/^export\s+(class|interface|function|const|type|enum)\s+(\w+)/gm) || [];
    const exportNames = exports.map((exp) => {
      const match = exp.match(/export\s+(?:class|interface|function|const|type|enum)\s+(\w+)/);
      return match ? match[1] : '';
    }).filter(Boolean);

    // Count functions
    const functions = (content.match(/function\s+\w+\s*\(/g) || []).length +
                     (content.match(/const\s+\w+\s*=\s*\([^)]*\)\s*=>/g) || []).length;

    // Count classes
    const classes = (content.match(/class\s+\w+/g) || []).length;

    // Count interfaces
    const interfaces = (content.match(/interface\s+\w+/g) || []).length;

    // Check for test file
    const hasTests = filePath.includes('.test.') || filePath.includes('.spec.') || content.includes('describe(') || content.includes('it(');

    // Calculate complexity (simple heuristic)
    const complexity = Math.min(100, (functions * 5) + (classes * 10) + (interfaces * 3) + (lines.length / 10));

    // Extract dependencies (from imports)
    const dependencies = importPaths.filter((imp) => !imp.startsWith('.') && !imp.startsWith('/'));

    return {
      path: filePath,
      type: 'typescript',
      size: content.length,
      complexity: Math.round(complexity),
      imports: importPaths,
      exports: exportNames,
      functions,
      classes,
      interfaces,
      hasTests,
      dependencies,
    };
  } catch (error) {
    console.error(`Failed to parse TypeScript file ${filePath}:`, error);
    return {
      path: filePath,
      type: 'typescript',
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
 * TypeScript File Type Definition
 * OMEGA-P5: Risk and importance based on ODAVL intelligence
 */
export const TypeScriptFileType: FileTypeDefinition = {
  id: 'typescript',
  extensions: ['.ts'],
  category: 'code',
  riskWeight: 0.2, // Medium risk (code changes)
  importance: 0.8, // High importance (core source)
  parse: parseTypeScriptFile,
};
