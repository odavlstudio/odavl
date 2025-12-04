#!/usr/bin/env tsx
/**
 * ODAVL Metrics Archiving Script
 * Archives metrics files older than 30 days to compressed tar.gz archives
 * 
 * Usage:
 *   pnpm archive:metrics
 *   tsx scripts/archive-old-metrics.ts
 * 
 * Recommended: Run monthly via cron or GitHub Actions
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';
import tar from 'tar';

const METRICS_DIR = path.join(process.cwd(), '.odavl/metrics');
const ACTIVE_DIR = path.join(METRICS_DIR, 'active');
const ARCHIVED_DIR = path.join(METRICS_DIR, 'archived');
const RETENTION_DAYS = 30;

interface MetricsFile {
  name: string;
  path: string;
  timestamp: number;
  age: number;
}

async function ensureDirectories(): Promise<void> {
  await fs.mkdir(ACTIVE_DIR, { recursive: true });
  await fs.mkdir(ARCHIVED_DIR, { recursive: true });
}

async function getMetricsFiles(): Promise<MetricsFile[]> {
  try {
    const files = await fs.readdir(METRICS_DIR);
    const now = Date.now();
    const metricsFiles: MetricsFile[] = [];

    for (const file of files) {
      if (!file.startsWith('run-') || !file.endsWith('.json')) {
        continue;
      }

      const filePath = path.join(METRICS_DIR, file);
      const stats = await fs.stat(filePath);
      
      // Extract timestamp from filename (e.g., run-1763261061595.json)
      const match = file.match(/run-(\d+)\.json/);
      const timestamp = match ? parseInt(match[1]) : stats.mtimeMs;
      
      const age = Math.floor((now - timestamp) / (1000 * 60 * 60 * 24));

      metricsFiles.push({
        name: file,
        path: filePath,
        timestamp,
        age
      });
    }

    return metricsFiles;
  } catch (error) {
    console.error('❌ Error reading metrics directory:', error);
    return [];
  }
}

async function archiveFiles(files: MetricsFile[]): Promise<void> {
  if (files.length === 0) {
    console.log('✅ No files to archive');
    return;
  }

  // Group files by month
  const filesByMonth = new Map<string, MetricsFile[]>();
  
  for (const file of files) {
    const date = new Date(file.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!filesByMonth.has(monthKey)) {
      filesByMonth.set(monthKey, []);
    }
    filesByMonth.get(monthKey)!.push(file);
  }

  console.log(`📦 Archiving ${files.length} files into ${filesByMonth.size} archive(s)...\n`);

  for (const [month, monthFiles] of filesByMonth.entries()) {
    const archivePath = path.join(ARCHIVED_DIR, `metrics-${month}.tar.gz`);
    
    console.log(`📦 Creating archive: metrics-${month}.tar.gz (${monthFiles.length} files)`);

    try {
      // Create tar.gz archive
      await tar.create(
        {
          gzip: true,
          file: archivePath,
          cwd: METRICS_DIR
        },
        monthFiles.map(f => f.name)
      );

      // Delete archived files
      for (const file of monthFiles) {
        await fs.unlink(file.path);
      }

      const stats = await fs.stat(archivePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`   ✅ Archived ${monthFiles.length} files (${sizeMB} MB)`);
    } catch (error) {
      console.error(`   ❌ Failed to archive ${month}:`, error);
    }
  }
}

async function generateSummary(allFiles: MetricsFile[]): Promise<void> {
  const summary = {
    lastUpdated: new Date().toISOString(),
    totalRuns: allFiles.length,
    oldestRun: allFiles.length > 0 ? new Date(Math.min(...allFiles.map(f => f.timestamp))).toISOString() : null,
    newestRun: allFiles.length > 0 ? new Date(Math.max(...allFiles.map(f => f.timestamp))).toISOString() : null,
    retentionDays: RETENTION_DAYS,
    activeFiles: allFiles.filter(f => f.age <= RETENTION_DAYS).length,
    archivedFiles: allFiles.filter(f => f.age > RETENTION_DAYS).length
  };

  const summaryPath = path.join(METRICS_DIR, 'summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log('\n📊 Metrics Summary:');
  console.log(`   Total runs: ${summary.totalRuns}`);
  console.log(`   Active files: ${summary.activeFiles}`);
  console.log(`   Archived files: ${summary.archivedFiles}`);
  console.log(`   Oldest run: ${summary.oldestRun || 'N/A'}`);
  console.log(`   Newest run: ${summary.newestRun || 'N/A'}`);
}

async function moveActiveFiles(files: MetricsFile[]): Promise<void> {
  const activeFiles = files.filter(f => f.age <= RETENTION_DAYS);
  
  if (activeFiles.length === 0) {
    return;
  }

  console.log(`\n📁 Moving ${activeFiles.length} active files to active/ directory...`);

  for (const file of activeFiles) {
    const newPath = path.join(ACTIVE_DIR, file.name);
    try {
      await fs.rename(file.path, newPath);
    } catch (error) {
      // File might already be in active/
      if ((error as any).code !== 'ENOENT') {
        console.error(`   ⚠️ Failed to move ${file.name}:`, error);
      }
    }
  }
  
  console.log(`   ✅ Moved ${activeFiles.length} files to active/`);
}

async function main(): Promise<void> {
  console.log('🗜️  ODAVL Metrics Archiving\n');
  console.log(`📅 Retention: ${RETENTION_DAYS} days\n`);

  await ensureDirectories();

  const allFiles = await getMetricsFiles();
  
  if (allFiles.length === 0) {
    console.log('✅ No metrics files found');
    return;
  }

  console.log(`📊 Found ${allFiles.length} metrics files`);

  const oldFiles = allFiles.filter(f => f.age > RETENTION_DAYS);
  const activeFiles = allFiles.filter(f => f.age <= RETENTION_DAYS);

  console.log(`   - ${oldFiles.length} old files (>${RETENTION_DAYS} days)`);
  console.log(`   - ${activeFiles.length} active files (<=${RETENTION_DAYS} days)\n`);

  if (oldFiles.length > 0) {
    await archiveFiles(oldFiles);
  } else {
    console.log('✅ No old files to archive\n');
  }

  await moveActiveFiles(activeFiles);
  await generateSummary(allFiles);

  console.log('\n✅ Archiving complete!');
}

main().catch(error => {
  console.error('💥 Archiving failed:', error);
  process.exit(1);
});
