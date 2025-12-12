/**
 * OMEGA-P5: JSON File Type Definition
 * Real JSON parser with validation
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { FileMetadata, FileTypeDefinition } from './ts.js';

/**
 * Parse JSON file and extract metadata
 * OMEGA-P5: Real implementation with safe JSON parsing
 */
async function parseJSONFile(filePath: string): Promise<FileMetadata> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Analyze structure
    const depth = calculateJSONDepth(data);
    const keys = Object.keys(data);
    const arrayCount = countArrays(data);
    const objectCount = countObjects(data);

    // Determine if config file
    const isConfig = filePath.includes('config') || 
                    filePath.endsWith('tsconfig.json') ||
                    filePath.endsWith('eslint.json') ||
                    filePath.endsWith('.eslintrc.json');

    // Determine if package manifest
    const isPackage = filePath.endsWith('package.json') ||
                     filePath.endsWith('package-lock.json') ||
                     filePath.endsWith('pnpm-lock.yaml');

    // Calculate complexity
    const complexity = Math.min(100, (depth * 10) + (keys.length) + (arrayCount * 2) + (objectCount * 3));

    // Extract dependencies if package.json
    let dependencies: string[] = [];
    if (isPackage && data.dependencies) {
      dependencies = Object.keys(data.dependencies);
    }
    if (isPackage && data.devDependencies) {
      dependencies = [...dependencies, ...Object.keys(data.devDependencies)];
    }

    return {
      path: filePath,
      type: 'json',
      size: content.length,
      complexity: Math.round(complexity),
      imports: [],
      exports: keys,
      functions: 0,
      classes: 0,
      interfaces: 0,
      hasTests: false,
      dependencies,
    };
  } catch (error) {
    console.error(`Failed to parse JSON file ${filePath}:`, error);
    return {
      path: filePath,
      type: 'json',
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
 * Calculate JSON depth (nesting level)
 */
function calculateJSONDepth(obj: any, currentDepth = 0): number {
  if (typeof obj !== 'object' || obj === null) {
    return currentDepth;
  }

  let maxDepth = currentDepth;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const depth = calculateJSONDepth(obj[key], currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }
  }

  return maxDepth;
}

/**
 * Count arrays in JSON structure
 */
function countArrays(obj: any): number {
  if (!obj || typeof obj !== 'object') return 0;
  
  let count = Array.isArray(obj) ? 1 : 0;
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      count += countArrays(obj[key]);
    }
  }
  
  return count;
}

/**
 * Count objects in JSON structure
 */
function countObjects(obj: any): number {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return 0;
  
  let count = 1;
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      count += countObjects(obj[key]);
    }
  }
  
  return count;
}

/**
 * JSON File Type Definition
 * OMEGA-P5: Higher risk for config files
 */
export const JSONFileType: FileTypeDefinition = {
  id: 'json',
  extensions: ['.json'],
  category: 'config',
  riskWeight: 0.3, // High risk (config changes affect runtime)
  importance: 0.7, // Important (configuration)
  parse: parseJSONFile,
};
