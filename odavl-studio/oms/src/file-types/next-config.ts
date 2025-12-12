/**
 * OMEGA-P5: Next.js Config File Type Definition
 * Real parser for next.config.* files
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { FileMetadata, FileTypeDefinition } from './ts.js';

async function parseNextConfig(filePath: string): Promise<FileMetadata> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Detect features
    const features: string[] = [];
    if (content.includes('webpack:')) features.push('webpack');
    if (content.includes('redirects:')) features.push('redirects');
    if (content.includes('rewrites:')) features.push('rewrites');
    if (content.includes('headers:')) features.push('headers');
    if (content.includes('images:')) features.push('images');
    if (content.includes('experimental:')) features.push('experimental');

    // Extract imports
    const imports = content.match(/^import\s+.*\s+from\s+['"]([^'"]+)['"]/gm) || [];
    const requires = content.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g) || [];
    const deps = [
      ...imports.map((imp) => imp.match(/from\s+['"]([^'"]+)['"]/)?.[1] || ''),
      ...requires.map((req) => req.match(/['"]([^'"]+)['"]/)?.[1] || ''),
    ].filter(Boolean);

    const complexity = Math.min(100, (features.length * 10) + (lines.length / 5));

    return {
      path: filePath,
      type: 'next-config',
      size: content.length,
      complexity: Math.round(complexity),
      imports: deps,
      exports: features,
      functions: 0,
      classes: 0,
      interfaces: 0,
      hasTests: false,
      dependencies: deps.filter((d) => !d.startsWith('.') && !d.startsWith('/')),
    };
  } catch (error) {
    return {
      path: filePath,
      type: 'next-config',
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

export const NextConfigFileType: FileTypeDefinition = {
  id: 'next-config',
  extensions: ['next.config.js', 'next.config.ts', 'next.config.mjs'],
  category: 'config',
  riskWeight: 0.2,
  importance: 0.8,
  parse: parseNextConfig,
};
