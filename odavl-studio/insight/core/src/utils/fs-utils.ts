/**
 * Phase 1.4.2 – Incremental Core Engine (ICE)
 * File System Utilities for Incremental Analysis
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Compute SHA-256 hash of file contents
 * @param filePath Absolute path to file
 * @returns Hex-encoded hash string
 */
export async function hashFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (error: any) {
    // If file can't be read, return empty hash (will trigger full analysis)
    return '';
  }
}

/**
 * Compute hashes for multiple files in parallel
 * @param filePaths Array of absolute file paths
 * @returns Map of filePath → hash
 */
export async function hashFiles(filePaths: string[]): Promise<Map<string, string>> {
  const results = await Promise.all(
    filePaths.map(async (filePath) => {
      const hash = await hashFile(filePath);
      return [filePath, hash] as [string, string];
    })
  );
  return new Map(results);
}

/**
 * Ensure directory exists, create if missing
 * @param dirPath Directory path
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error: any) {
    // Directory might already exist, that's fine
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Read JSON file safely, return default value on error
 * @param filePath Path to JSON file
 * @param defaultValue Default value if file doesn't exist or is invalid
 * @returns Parsed JSON or default value
 */
export async function readJsonSafe<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Write JSON file with pretty formatting
 * @param filePath Path to JSON file
 * @param data Data to serialize
 */
export async function writeJson(filePath: string, data: any): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, content, 'utf8');
}
