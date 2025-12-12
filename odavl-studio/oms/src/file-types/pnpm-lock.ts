/**
 * OMEGA-P5: pnpm-lock.yaml File Type Definition
 * Real parser for pnpm-lock.yaml
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { FileMetadata, FileTypeDefinition } from './ts.js';

async function parsePnpmLock(filePath: string): Promise<FileMetadata> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Count packages (rough estimate)
    const packages = lines.filter((line) => /^\s{2}['"][@/\w-]+['"]:\s*$/.test(line)).length;

    // Detect lockfile version
    const versionMatch = content.match(/lockfileVersion:\s*['"]?([^'"]+)['"]?/);
    const version = versionMatch ? versionMatch[1] : 'unknown';

    const complexity = Math.min(100, packages * 0.1);

    return {
      path: filePath,
      type: 'pnpm-lock',
      size: content.length,
      complexity: Math.round(complexity),
      imports: [],
      exports: [version],
      functions: 0,
      classes: packages,
      interfaces: 0,
      hasTests: false,
      dependencies: [],
    };
  } catch (error) {
    return {
      path: filePath,
      type: 'pnpm-lock',
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

export const PnpmLockFileType: FileTypeDefinition = {
  id: 'pnpm-lock',
  extensions: ['pnpm-lock.yaml'],
  category: 'config',
  riskWeight: 0.2,
  importance: 0.5,
  parse: parsePnpmLock,
};
