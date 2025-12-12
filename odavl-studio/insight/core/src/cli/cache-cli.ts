/**
 * Cache CLI Commands
 * 
 * Command-line interface for cache management.
 * 
 * @since Phase 1 Week 20 (December 2025)
 */

import { Command } from 'commander';
import { createCache } from '../cache/redis-cache';
import { createIncrementalAnalyzer } from '../analysis/incremental-analyzer';
import { createFileFilter } from '../analysis/smart-file-filter';

const program = new Command();

program
  .name('odavl-cache')
  .description('ODAVL Insight cache management')
  .version('1.0.0');

/**
 * Cache stats command
 */
program
  .command('stats')
  .description('Show cache statistics')
  .option('--host <host>', 'Redis host', 'localhost')
  .option('--port <port>', 'Redis port', '6379')
  .action(async (options) => {
    const cache = createCache({
      host: options.host,
      port: parseInt(options.port),
    });

    try {
      await cache.connect();
      const stats = await cache.getStats();

      console.log('\n=== Cache Statistics ===');
      console.log(`Hits: ${stats.hits}`);
      console.log(`Misses: ${stats.misses}`);
      console.log(`Hit Rate: ${stats.hitRate.toFixed(2)}%`);
      console.log(`Keys: ${stats.keys}`);
      console.log(`Memory: ${(stats.memory / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Avg Latency: ${stats.avgLatency.toFixed(2)} ms`);
      
      await cache.disconnect();
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Clear cache command
 */
program
  .command('clear')
  .description('Clear all cache entries')
  .option('--host <host>', 'Redis host', 'localhost')
  .option('--port <port>', 'Redis port', '6379')
  .option('--confirm', 'Skip confirmation prompt')
  .action(async (options) => {
    if (!options.confirm) {
      console.log('This will delete ALL cache entries. Use --confirm to proceed.');
      return;
    }

    const cache = createCache({
      host: options.host,
      port: parseInt(options.port),
    });

    try {
      await cache.connect();
      await cache.invalidateAll();
      console.log('✅ Cache cleared successfully');
      await cache.disconnect();
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Invalidate file command
 */
program
  .command('invalidate <file>')
  .description('Invalidate cache for specific file')
  .option('--host <host>', 'Redis host', 'localhost')
  .option('--port <port>', 'Redis port', '6379')
  .action(async (file, options) => {
    const cache = createCache({
      host: options.host,
      port: parseInt(options.port),
    });

    try {
      await cache.connect();
      await cache.invalidateFile(file);
      console.log(`✅ Invalidated cache for: ${file}`);
      await cache.disconnect();
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Invalidate directory command
 */
program
  .command('invalidate-dir <dir>')
  .description('Invalidate cache for entire directory')
  .option('--host <host>', 'Redis host', 'localhost')
  .option('--port <port>', 'Redis port', '6379')
  .action(async (dir, options) => {
    const cache = createCache({
      host: options.host,
      port: parseInt(options.port),
    });

    try {
      await cache.connect();
      await cache.invalidateDirectory(dir);
      console.log(`✅ Invalidated cache for directory: ${dir}`);
      await cache.disconnect();
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Analyze scope command
 */
program
  .command('scope [workspace]')
  .description('Show analysis scope (incremental vs full)')
  .option('--base <branch>', 'Base branch', 'main')
  .action(async (workspace, options) => {
    const root = workspace || process.cwd();
    const analyzer = createIncrementalAnalyzer(root, {
      baseBranch: options.base,
    });

    try {
      const scope = await analyzer.getScope();

      console.log('\n=== Analysis Scope ===');
      console.log(`Mode: ${scope.scope}`);
      console.log(`Branch: ${scope.branch || 'N/A'}`);
      console.log(`Clean: ${scope.isClean ? 'Yes' : 'No'}`);
      console.log(`Files: ${scope.totalFiles}`);

      if (scope.scope === 'incremental') {
        console.log(`\nBase Commit: ${scope.baseCommit.substring(0, 8)}`);
        console.log(`Current Commit: ${scope.currentCommit.substring(0, 8)}`);

        console.log('\n=== Changed Files ===');
        scope.files.forEach(file => {
          const statusIcon = {
            added: '➕',
            modified: '✏️',
            deleted: '❌',
            renamed: '📝',
            untracked: '❓',
          }[file.status];
          console.log(`${statusIcon} ${file.path}`);
        });
      }
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Filter files command
 */
program
  .command('filter [workspace]')
  .description('Show filtered files for analysis')
  .option('--extensions <exts>', 'File extensions (comma-separated)', '.ts,.js,.tsx,.jsx')
  .option('--max-size <size>', 'Max file size in MB', '10')
  .action(async (workspace, options) => {
    const root = workspace || process.cwd();
    const filter = createFileFilter({
      extensions: options.extensions.split(','),
      maxFileSize: parseInt(options.maxSize) * 1024 * 1024,
    });

    try {
      const allFiles = await filter.getAllFiles(root);
      const result = await filter.filter(allFiles, root);

      console.log('\n=== File Filter Results ===');
      console.log(`Total Files: ${result.stats.totalFiles}`);
      console.log(`Included: ${result.stats.includedFiles}`);
      console.log(`Excluded: ${result.stats.excludedFiles}`);
      console.log(`Total Size: ${(result.stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Avg Size: ${(result.stats.avgSize / 1024).toFixed(2)} KB`);

      if (result.excluded.length > 0) {
        console.log('\n=== Excluded Files (first 10) ===');
        result.excluded.slice(0, 10).forEach(file => {
          const reason = result.reasons.get(file);
          console.log(`❌ ${file} - ${reason}`);
        });

        if (result.excluded.length > 10) {
          console.log(`\n... and ${result.excluded.length - 10} more`);
        }
      }
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Reset stats command
 */
program
  .command('reset-stats')
  .description('Reset cache statistics')
  .option('--host <host>', 'Redis host', 'localhost')
  .option('--port <port>', 'Redis port', '6379')
  .action(async (options) => {
    const cache = createCache({
      host: options.host,
      port: parseInt(options.port),
    });

    try {
      await cache.connect();
      cache.resetStats();
      console.log('✅ Statistics reset');
      await cache.disconnect();
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

// Parse arguments
program.parse();

export default program;
