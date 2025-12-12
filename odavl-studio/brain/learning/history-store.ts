/**
 * ODAVL Brain - Training History Store
 * Phase P9: Storage and retrieval of training samples
 * 
 * Stores deployment outcomes for ML training
 * Location: .odavl/brain-history/<timestamp>.json
 */

import { writeFile, readFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { FileTypeStats } from '../runtime/runtime-deployment-confidence';
import type { GuardianReport, BaselineHistory, DeploymentDecision } from '../runtime/runtime-deployment-confidence';

/**
 * Training sample stored in history
 */
export interface StoredTrainingSample {
  timestamp: string;
  fileTypeStats: FileTypeStats;
  guardianReport: GuardianReport;
  baselineHistory: BaselineHistory;
  brainDecision: DeploymentDecision;
  outcome: boolean; // true = deployment succeeded, false = failed
  metadata?: {
    environment?: string;
    deploymentDuration?: number;
    rollbackRequired?: boolean;
  };
}

/**
 * Rolling window statistics
 */
export interface RollingWindowStats {
  totalSamples: number;
  successRate: number;
  averageConfidence: number;
  commonFailurePatterns: Array<{
    pattern: string;
    frequency: number;
  }>;
  timeRange: {
    earliest: string;
    latest: string;
  };
}

/**
 * Brain training history store
 */
export class BrainHistoryStore {
  private historyDir: string;

  constructor(historyDir: string = '.odavl/brain-history') {
    this.historyDir = historyDir;
  }

  /**
   * Save training sample to history
   */
  async saveTrainingSample(sample: StoredTrainingSample): Promise<string> {
    // Ensure directory exists
    if (!existsSync(this.historyDir)) {
      await mkdir(this.historyDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = sample.timestamp.replace(/[:.]/g, '-');
    const filename = `training-${timestamp}.json`;
    const filepath = path.join(this.historyDir, filename);

    // Save sample
    await writeFile(filepath, JSON.stringify(sample, null, 2));

    console.log(`[Brain History] 💾 Training sample saved: ${filename}`);
    return filepath;
  }

  /**
   * Load last N training samples
   */
  async loadLastNSamples(n: number): Promise<StoredTrainingSample[]> {
    if (!existsSync(this.historyDir)) {
      return [];
    }

    // Read all files
    const files = await readdir(this.historyDir);
    const jsonFiles = files.filter(f => f.startsWith('training-') && f.endsWith('.json'));

    // Sort by timestamp (newest first)
    jsonFiles.sort().reverse();

    // Load last N samples
    const samples: StoredTrainingSample[] = [];
    const limit = Math.min(n, jsonFiles.length);

    for (let i = 0; i < limit; i++) {
      try {
        const filepath = path.join(this.historyDir, jsonFiles[i]);
        const content = await readFile(filepath, 'utf-8');
        const sample = JSON.parse(content) as StoredTrainingSample;
        samples.push(sample);
      } catch (error) {
        console.warn(`[Brain History] ⚠️ Failed to load ${jsonFiles[i]}:`, error);
      }
    }

    console.log(`[Brain History] 📂 Loaded ${samples.length} training samples`);
    return samples;
  }

  /**
   * Get rolling window statistics (last N samples)
   */
  async getRollingWindowStats(windowSize: number = 50): Promise<RollingWindowStats> {
    const samples = await this.loadLastNSamples(windowSize);

    if (samples.length === 0) {
      return {
        totalSamples: 0,
        successRate: 0.5,
        averageConfidence: 75,
        commonFailurePatterns: [],
        timeRange: {
          earliest: new Date().toISOString(),
          latest: new Date().toISOString(),
        },
      };
    }

    // Calculate success rate
    const successCount = samples.filter(s => s.outcome).length;
    const successRate = successCount / samples.length;

    // Calculate average confidence
    const totalConfidence = samples.reduce((sum, s) => sum + s.brainDecision.confidence, 0);
    const averageConfidence = totalConfidence / samples.length;

    // Identify common failure patterns
    const failedSamples = samples.filter(s => !s.outcome);
    const patternCounts = new Map<string, number>();

    for (const sample of failedSamples) {
      const pattern = this.identifyFailurePattern(sample);
      patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
    }

    const commonFailurePatterns = Array.from(patternCounts.entries())
      .map(([pattern, frequency]) => ({ pattern, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    // Time range
    const timestamps = samples.map(s => s.timestamp).sort();

    return {
      totalSamples: samples.length,
      successRate,
      averageConfidence,
      commonFailurePatterns,
      timeRange: {
        earliest: timestamps[0],
        latest: timestamps[timestamps.length - 1],
      },
    };
  }

  /**
   * Identify failure pattern from sample
   */
  private identifyFailurePattern(sample: StoredTrainingSample): string {
    const { brainDecision, guardianReport } = sample;

    // Check for critical failures
    if (guardianReport.metrics.critical > 0) {
      return 'critical-test-failures';
    }

    // Check for high failures
    if (guardianReport.metrics.high > 0) {
      return 'high-severity-failures';
    }

    // Check for baseline regressions
    if (guardianReport.enforcement?.baselineComparison && 
        !guardianReport.enforcement.baselineComparison.passed) {
      return 'baseline-regression';
    }

    // Check for risk-based
    if (brainDecision.factors.riskWeight > 0.35) {
      return 'high-risk-changes';
    }

    return 'unknown-failure';
  }

  /**
   * Clear old training samples (keep last N)
   */
  async pruneHistory(keepLast: number = 200): Promise<number> {
    if (!existsSync(this.historyDir)) {
      return 0;
    }

    const files = await readdir(this.historyDir);
    const jsonFiles = files.filter(f => f.startsWith('training-') && f.endsWith('.json'));

    if (jsonFiles.length <= keepLast) {
      return 0;
    }

    // Sort by timestamp
    jsonFiles.sort();

    // Delete oldest samples
    const toDelete = jsonFiles.slice(0, jsonFiles.length - keepLast);
    let deleted = 0;

    for (const file of toDelete) {
      try {
        const filepath = path.join(this.historyDir, file);
        const fs = await import('node:fs/promises');
        await fs.unlink(filepath);
        deleted++;
      } catch (error) {
        console.warn(`[Brain History] ⚠️ Failed to delete ${file}:`, error);
      }
    }

    console.log(`[Brain History] 🧹 Pruned ${deleted} old samples`);
    return deleted;
  }

  // ============================================================================
  // Phase P10: GZIP COMPRESSION FOR OLD SAMPLES
  // ============================================================================

  /**
   * Phase P10: Compress samples older than N days
   * Keeps last 50 samples uncompressed for fast access
   */
  async compressOldSamples(days = 30): Promise<number> {
    if (!existsSync(this.historyDir)) {
      return 0;
    }

    const { gzip } = await import('node:zlib');
    const { promisify } = await import('node:util');
    const gzipAsync = promisify(gzip);
    const fs = await import('node:fs/promises');

    // Read all JSON files (not compressed)
    const files = await readdir(this.historyDir);
    const jsonFiles = files.filter(f => f.startsWith('training-') && f.endsWith('.json') && !f.endsWith('.json.gz'));

    // Sort by timestamp (newest first)
    jsonFiles.sort().reverse();

    // Keep last 50 uncompressed
    const filesToCompress = jsonFiles.slice(50);

    // Filter by age
    const now = Date.now();
    const cutoffTime = now - (days * 24 * 60 * 60 * 1000);
    let compressed = 0;

    for (const file of filesToCompress) {
      try {
        const filepath = path.join(this.historyDir, file);
        const stats = await fs.stat(filepath);

        if (stats.mtimeMs < cutoffTime) {
          // Read original file
          const content = await readFile(filepath, 'utf-8');

          // Compress
          const compressed_data = await gzipAsync(Buffer.from(content, 'utf-8'));

          // Save compressed
          const compressedPath = `${filepath}.gz`;
          await writeFile(compressedPath, compressed_data);

          // Delete original
          await fs.unlink(filepath);

          compressed++;
        }
      } catch (error) {
        console.warn(`[Brain History] ⚠️ Failed to compress ${file}:`, error);
      }
    }

    console.log(`[Brain History] 📦 Compressed ${compressed} old samples`);
    return compressed;
  }

  /**
   * Phase P10: Decompress sample if needed
   */
  async decompressSample(filepath: string): Promise<StoredTrainingSample> {
    const { gunzip } = await import('node:zlib');
    const { promisify } = await import('node:util');
    const gunzipAsync = promisify(gunzip);

    // Check if compressed
    if (filepath.endsWith('.json.gz')) {
      const compressedData = await readFile(filepath);
      const decompressed = await gunzipAsync(compressedData);
      return JSON.parse(decompressed.toString('utf-8'));
    } else {
      // Regular JSON
      const content = await readFile(filepath, 'utf-8');
      return JSON.parse(content);
    }
  }

  // ============================================================================
  // Phase P11: DISTRIBUTED HISTORY SYNC (FEDERATED)
  // ============================================================================

  /**
   * Phase P11: Export history for peer-to-peer sharing
   * Returns array of all samples with checksums
   */
  async exportHistory(): Promise<StoredTrainingSample[]> {
    if (!existsSync(this.historyDir)) {
      return [];
    }

    const files = await readdir(this.historyDir);
    const sampleFiles = files.filter(f =>
      f.startsWith('training-') && (f.endsWith('.json') || f.endsWith('.json.gz'))
    );

    const samples: StoredTrainingSample[] = [];

    for (const file of sampleFiles) {
      try {
        const filepath = path.join(this.historyDir, file);
        const sample = await this.decompressSample(filepath);

        // Add checksum for integrity verification
        const crypto = await import('node:crypto');
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(sample));
        (sample as any).checksum = hash.digest('hex');

        samples.push(sample);
      } catch (error) {
        console.warn(`[Brain History] ⚠️ Failed to export ${file}:`, error);
      }
    }

    console.log(`[Brain History] 📤 Exported ${samples.length} samples`);
    return samples;
  }

  /**
   * Phase P11: Import history from peer files
   * Supports both JSON and JSON.gz formats
   */
  async importHistory(peerHistoryFiles: string[]): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    let skipped = 0;

    for (const peerFile of peerHistoryFiles) {
      try {
        if (!existsSync(peerFile)) {
          console.warn(`[Brain History] ⚠️ Peer file not found: ${peerFile}`);
          skipped++;
          continue;
        }

        const samples = await this.decompressSample(peerFile);
        const samplesArray = Array.isArray(samples) ? samples : [samples];

        for (const sample of samplesArray) {
          const merged = await this.mergeHistory([sample]);
          if (merged > 0) imported++;
          else skipped++;
        }
      } catch (error) {
        console.warn(`[Brain History] ⚠️ Failed to import ${peerFile}:`, error);
        skipped++;
      }
    }

    console.log(`[Brain History] 📥 Imported ${imported} samples, skipped ${skipped} duplicates`);
    return { imported, skipped };
  }

  /**
   * Phase P11: Merge remote samples into local history
   * Prevents duplicates by checking timestamp + hash
   */
  async mergeHistory(remoteSamples: StoredTrainingSample[]): Promise<number> {
    if (!existsSync(this.historyDir)) {
      await mkdirp(this.historyDir);
    }

    // Get existing timestamps
    const existing = await this.exportHistory();
    const existingKeys = new Set(
      existing.map(s => `${s.timestamp}-${JSON.stringify(s.brainDecision)}`)
    );

    let merged = 0;

    for (const sample of remoteSamples) {
      const key = `${sample.timestamp}-${JSON.stringify(sample.brainDecision)}`;

      // Skip duplicates
      if (existingKeys.has(key)) {
        continue;
      }

      // Verify checksum if present
      if ((sample as any).checksum) {
        const crypto = await import('node:crypto');
        const hash = crypto.createHash('sha256');
        const sampleCopy = { ...sample };
        delete (sampleCopy as any).checksum;
        hash.update(JSON.stringify(sampleCopy));
        const computedChecksum = hash.digest('hex');

        if (computedChecksum !== (sample as any).checksum) {
          console.warn(`[Brain History] ⚠️ Checksum mismatch, skipping sample`);
          continue;
        }
      }

      // Save sample
      const timestamp = new Date(sample.timestamp).getTime();
      const filename = `training-${timestamp}.json`;
      const filepath = path.join(this.historyDir, filename);

      await writeFile(filepath, JSON.stringify(sample, null, 2), 'utf-8');
      merged++;
    }

    console.log(`[Brain History] 🔄 Merged ${merged} new samples`);
    return merged;
  }

  /**
   * Phase P11: Resolve conflicts when merging samples
   * Rule: Most recent sample wins
   */
  async resolveConflicts(
    local: StoredTrainingSample[],
    remote: StoredTrainingSample[]
  ): Promise<StoredTrainingSample[]> {
    const sampleMap = new Map<string, StoredTrainingSample>();

    // Add local samples
    for (const sample of local) {
      const key = `${sample.timestamp}`;
      sampleMap.set(key, sample);
    }

    // Add remote samples (newer timestamp wins)
    for (const sample of remote) {
      const key = `${sample.timestamp}`;
      const existing = sampleMap.get(key);

      if (!existing) {
        sampleMap.set(key, sample);
      } else {
        // Compare timestamps
        const existingTime = new Date(existing.timestamp).getTime();
        const remoteTime = new Date(sample.timestamp).getTime();

        if (remoteTime > existingTime) {
          sampleMap.set(key, sample); // Remote is newer
        }
      }
    }

    const resolved = Array.from(sampleMap.values());
    console.log(`[Brain History] ⚖️ Resolved ${resolved.length} unique samples`);
    return resolved;
  }

  /**
   * Phase P12: Update fusion weights based on predictor accuracy
   * 
   * Analyzes last N deployment outcomes to compute which predictors
   * were most accurate, then updates fusion weights accordingly.
   */
  async updateFusionWeights(lastNSamples: number = 50): Promise<void> {
    const samples = await this.getRecentSamples(lastNSamples);

    if (samples.length === 0) {
      console.log('[Brain History] ⚠️ No samples available for fusion weight update');
      return;
    }

    // Phase P12: Track predictor accuracy
    const accuracy = {
      nn: [] as number[],
      lstm: [] as number[],
      mtl: [] as number[],
      bayesian: [] as number[],
      heuristic: [] as number[],
    };

    for (const sample of samples) {
      const actualValue = sample.outcome ? 0 : 1; // 0 = success, 1 = failure

      // Extract predictions from brainDecision metadata
      const predictions = (sample.brainDecision as any).predictions || {};

      if (predictions.nnPrediction !== undefined && predictions.nnPrediction !== null) {
        const error = Math.abs(predictions.nnPrediction - actualValue);
        accuracy.nn.push(1 - error);
      }

      if (predictions.lstmPrediction !== undefined && predictions.lstmPrediction !== null) {
        const error = Math.abs(predictions.lstmPrediction - actualValue);
        accuracy.lstm.push(1 - error);
      }

      if (predictions.mtlPrediction !== undefined && predictions.mtlPrediction !== null) {
        const error = Math.abs(predictions.mtlPrediction - actualValue);
        accuracy.mtl.push(1 - error);
      }

      if (predictions.bayesianPrediction !== undefined && predictions.bayesianPrediction !== null) {
        const error = Math.abs(predictions.bayesianPrediction - actualValue);
        accuracy.bayesian.push(1 - error);
      }

      if (predictions.heuristicPrediction !== undefined && predictions.heuristicPrediction !== null) {
        const error = Math.abs(predictions.heuristicPrediction - actualValue);
        accuracy.heuristic.push(1 - error);
      }
    }

    // Phase P12: Compute mean accuracy per predictor
    const meanAccuracy = {
      nn: accuracy.nn.length > 0 ? accuracy.nn.reduce((a, b) => a + b) / accuracy.nn.length : 0.5,
      lstm: accuracy.lstm.length > 0 ? accuracy.lstm.reduce((a, b) => a + b) / accuracy.lstm.length : 0.5,
      mtl: accuracy.mtl.length > 0 ? accuracy.mtl.reduce((a, b) => a + b) / accuracy.mtl.length : 0.5,
      bayesian: accuracy.bayesian.length > 0 ? accuracy.bayesian.reduce((a, b) => a + b) / accuracy.bayesian.length : 0.5,
      heuristic: accuracy.heuristic.length > 0 ? accuracy.heuristic.reduce((a, b) => a + b) / accuracy.heuristic.length : 0.5,
    };

    // Phase P12: Normalize to weights (proportional to accuracy)
    const totalAccuracy =
      meanAccuracy.nn + meanAccuracy.lstm + meanAccuracy.mtl + meanAccuracy.bayesian + meanAccuracy.heuristic;

    const updatedWeights = {
      nn: meanAccuracy.nn / totalAccuracy,
      lstm: meanAccuracy.lstm / totalAccuracy,
      mtl: meanAccuracy.mtl / totalAccuracy,
      bayesian: meanAccuracy.bayesian / totalAccuracy,
      heuristic: meanAccuracy.heuristic / totalAccuracy,
      riskPenalty: 0.0,
      lastUpdated: new Date().toISOString(),
      basedOnSamples: samples.length,
      version: 'p12-fusion-v1',
    };

    // Phase P12: Save weights to disk
    const weightsPath = path.join(this.historyDir, 'fusion-weights.json');
    await writeFile(weightsPath, JSON.stringify(updatedWeights, null, 2), 'utf-8');

    console.log(`[Brain History] 🧠 Fusion weights updated from ${samples.length} samples`);
    console.log(`  NN: ${(updatedWeights.nn * 100).toFixed(1)}%`);
    console.log(`  LSTM: ${(updatedWeights.lstm * 100).toFixed(1)}%`);
    console.log(`  MTL: ${(updatedWeights.mtl * 100).toFixed(1)}%`);
    console.log(`  Bayesian: ${(updatedWeights.bayesian * 100).toFixed(1)}%`);
    console.log(`  Heuristic: ${(updatedWeights.heuristic * 100).toFixed(1)}%`);
  }
}

