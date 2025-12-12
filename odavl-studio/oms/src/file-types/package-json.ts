/**
 * OMEGA-P5: package.json File Type Definition
 * Real specialized parser for package.json
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { FileMetadata, FileTypeDefinition } from './ts.js';

async function parsePackageJSON(filePath: string): Promise<FileMetadata> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');
    const pkg = JSON.parse(content);

    // Extract metadata
    const scripts = Object.keys(pkg.scripts || {});
    const deps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});
    const allDeps = [...deps, ...devDeps];

    // Detect workspace
    const isWorkspace = !!pkg.workspaces;

    const complexity = Math.min(100, (scripts.length * 2) + (allDeps.length * 0.5));

    return {
      path: filePath,
      type: 'package-json',
      size: content.length,
      complexity: Math.round(complexity),
      imports: [],
      exports: [pkg.name || 'unknown'],
      functions: scripts.length,
      classes: 0,
      interfaces: 0,
      hasTests: scripts.some((s) => s.includes('test')),
      dependencies: allDeps,
    };
  } catch (error) {
    return {
      path: filePath,
      type: 'package-json',
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

export const PackageJSONFileType: FileTypeDefinition = {
  id: 'package-json',
  extensions: ['package.json'],
  category: 'config',
  riskWeight: 0.3,
  importance: 0.9,
  parse: parsePackageJSON,
};
