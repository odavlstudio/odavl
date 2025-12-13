/**
 * Phase 1.5: Cache Management Functions
 * Provides cache clear, stats, and inspection commands
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import * as fmt from '../utils/cli-formatter.js';

/**
 * Clear all cache files
 */
export async function clearCache(options: { dir: string }) {
  const workspaceRoot = options.dir;
  const cacheDir = path.join(workspaceRoot, '.odavl/.insight-cache');
  
  try {
    await fs.rm(cacheDir, { recursive: true, force: true });
    console.log(fmt.success('Cache cleared successfully'));
    console.log(chalk.gray(`  Removed: ${cacheDir}`));
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(fmt.info('Cache directory does not exist (already empty)'));
    } else {
      console.log(fmt.error(`Failed to clear cache: ${error.message}`));
    }
  }
}

/**
 * Show cache statistics
 */
export async function cacheStats(options: { dir: string }) {
  const workspaceRoot = options.dir;
  const cacheDir = path.join(workspaceRoot, '.odavl/.insight-cache');
  
  try {
    // Read cache metadata
    const metadataPath = path.join(cacheDir, 'metadata.json');
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    
    // Count files
    let fileCount = 0;
    let totalSize = 0;
    
    try {
      const files = await fs.readdir(cacheDir);
      fileCount = files.filter(f => f.endsWith('.json')).length;
      
      // Calculate total size
      for (const file of files) {
        const stats = await fs.stat(path.join(cacheDir, file));
        totalSize += stats.size;
      }
    } catch {
      // Ignore errors reading directory
    }
    
    console.log(fmt.header('Cache Statistics'));
    console.log(fmt.stat('Cache directory', cacheDir, 'blue'));
    console.log(fmt.stat('Cached files', fileCount, 'blue'));
    console.log(fmt.stat('Total size', `${(totalSize / 1024).toFixed(2)} KB`, 'blue'));
    console.log(fmt.stat('Last updated', metadata.lastUpdated || 'unknown', 'gray'));
    console.log('');
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(fmt.info('No cache found. Run "odavl insight analyze" to create cache.'));
    } else {
      console.log(fmt.error(`Failed to read cache stats: ${error.message}`));
    }
  }
}

/**
 * Show cached files and detectors
 */
export async function showCache(options: { dir: string; json?: boolean }) {
  const workspaceRoot = options.dir;
  const cacheDir = path.join(workspaceRoot, '.odavl/.insight-cache');
  
  try {
    // Read file hashes
    const hashesPath = path.join(cacheDir, 'file-hashes.json');
    const hashesContent = await fs.readFile(hashesPath, 'utf-8');
    const hashes = JSON.parse(hashesContent);
    
    if (options.json) {
      console.log(JSON.stringify(hashes, null, 2));
      return;
    }
    
    console.log(fmt.header('Cached Files'));
    const files = Object.keys(hashes);
    console.log(fmt.stat('Total files', files.length, 'blue'));
    console.log('');
    
    // Show first 10 files as sample
    const displayCount = Math.min(10, files.length);
    for (let i = 0; i < displayCount; i++) {
      const file = files[i];
      const hash = hashes[file].substring(0, 8); // First 8 chars of SHA-256
      console.log(chalk.gray(`  ${fmt.icons.file} ${file} ${chalk.dim(`(${hash}...)`)}`));
    }
    
    if (files.length > 10) {
      console.log(chalk.gray(`  ... and ${files.length - 10} more files`));
    }
    console.log('');
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(fmt.info('No cache found. Run "odavl insight analyze" to create cache.'));
    } else {
      console.log(fmt.error(`Failed to read cache: ${error.message}`));
    }
  }
}
