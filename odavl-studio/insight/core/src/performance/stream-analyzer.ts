/**
 * Stream-Based File Analyzer
 * 
 * Memory-efficient file analysis using Node.js streams.
 * Handles large files (>100MB) without loading into memory.
 * 
 * @since Phase 1 Week 19 (December 2025)
 */

import { createReadStream, ReadStream } from 'node:fs';
import { createInterface, Interface } from 'node:readline';
import * as fs from 'node:fs/promises';
import { EventEmitter } from 'node:events';

export interface StreamAnalyzerOptions {
  chunkSize?: number; // Bytes per chunk (default: 64KB)
  maxMemoryMB?: number; // Max memory usage (default: 256MB)
  encoding?: BufferEncoding; // File encoding (default: utf-8)
  highWaterMark?: number; // Stream buffer size (default: 64KB)
}

export interface FileAnalysis {
  filePath: string;
  lines: number;
  size: number;
  encoding: string;
  chunks: number;
  duration: number;
  memoryUsed: number;
}

export interface ChunkData {
  index: number;
  lines: string[];
  startLine: number;
  endLine: number;
  bytes: number;
}

/**
 * Stream-based file analyzer
 * 
 * Processes large files efficiently using streams:
 * - No full file loading (memory-safe)
 * - Line-by-line processing
 * - Backpressure handling
 * - Memory monitoring
 */
export class StreamAnalyzer extends EventEmitter {
  private options: Required<StreamAnalyzerOptions>;
  private currentMemory: number = 0;

  constructor(options: StreamAnalyzerOptions = {}) {
    super();
    this.options = {
      chunkSize: options.chunkSize || 64 * 1024, // 64KB
      maxMemoryMB: options.maxMemoryMB || 256,
      encoding: options.encoding || 'utf-8',
      highWaterMark: options.highWaterMark || 64 * 1024,
    };
  }

  /**
   * Analyze file using streams
   */
  async analyzeFile(filePath: string): Promise<FileAnalysis> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    const stats = await fs.stat(filePath);
    let lineCount = 0;
    let chunkCount = 0;

    // Create read stream
    const stream = createReadStream(filePath, {
      encoding: this.options.encoding,
      highWaterMark: this.options.highWaterMark,
    });

    // Line-by-line reader
    const rl = createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    // Process lines in chunks
    let currentChunk: string[] = [];
    let currentChunkBytes = 0;
    let chunkStartLine = 0;

    for await (const line of rl) {
      lineCount++;
      currentChunk.push(line);
      currentChunkBytes += Buffer.byteLength(line, this.options.encoding);

      // Emit chunk when size reached
      if (currentChunkBytes >= this.options.chunkSize) {
        await this.emitChunk(currentChunk, chunkStartLine, lineCount, currentChunkBytes);
        
        chunkCount++;
        currentChunk = [];
        currentChunkBytes = 0;
        chunkStartLine = lineCount;

        // Check memory usage
        await this.checkMemoryUsage();
      }
    }

    // Emit remaining chunk
    if (currentChunk.length > 0) {
      await this.emitChunk(currentChunk, chunkStartLine, lineCount, currentChunkBytes);
      chunkCount++;
    }

    const duration = Date.now() - startTime;
    const memoryUsed = process.memoryUsage().heapUsed - startMemory;

    const analysis: FileAnalysis = {
      filePath,
      lines: lineCount,
      size: stats.size,
      encoding: this.options.encoding,
      chunks: chunkCount,
      duration,
      memoryUsed,
    };

    this.emit('complete', analysis);
    return analysis;
  }

  /**
   * Process file with custom handler
   */
  async processFile<T>(
    filePath: string,
    handler: (chunk: ChunkData) => Promise<T>
  ): Promise<T[]> {
    const results: T[] = [];
    let chunkIndex = 0;

    this.on('chunk', async (chunk: ChunkData) => {
      const result = await handler(chunk);
      results.push(result);
    });

    await this.analyzeFile(filePath);

    return results;
  }

  /**
   * Search file for pattern (stream-based)
   */
  async searchFile(filePath: string, pattern: RegExp): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    const stream = createReadStream(filePath, {
      encoding: this.options.encoding,
      highWaterMark: this.options.highWaterMark,
    });

    const rl = createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    let lineNumber = 0;

    for await (const line of rl) {
      lineNumber++;

      const matches = line.matchAll(pattern);
      for (const match of matches) {
        results.push({
          line: lineNumber,
          column: match.index || 0,
          text: line,
          match: match[0],
        });
      }
    }

    return results;
  }

  /**
   * Count lines in file (stream-based)
   */
  async countLines(filePath: string): Promise<number> {
    const stream = createReadStream(filePath, {
      encoding: this.options.encoding,
      highWaterMark: this.options.highWaterMark,
    });

    const rl = createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    let count = 0;
    for await (const _ of rl) {
      count++;
    }

    return count;
  }

  /**
   * Read file in chunks (generator)
   */
  async *readChunks(filePath: string): AsyncGenerator<ChunkData> {
    const stream = createReadStream(filePath, {
      encoding: this.options.encoding,
      highWaterMark: this.options.highWaterMark,
    });

    const rl = createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    let currentChunk: string[] = [];
    let currentChunkBytes = 0;
    let chunkStartLine = 0;
    let lineCount = 0;
    let chunkIndex = 0;

    for await (const line of rl) {
      lineCount++;
      currentChunk.push(line);
      currentChunkBytes += Buffer.byteLength(line, this.options.encoding);

      if (currentChunkBytes >= this.options.chunkSize) {
        yield {
          index: chunkIndex++,
          lines: currentChunk,
          startLine: chunkStartLine,
          endLine: lineCount,
          bytes: currentChunkBytes,
        };

        currentChunk = [];
        currentChunkBytes = 0;
        chunkStartLine = lineCount;

        await this.checkMemoryUsage();
      }
    }

    if (currentChunk.length > 0) {
      yield {
        index: chunkIndex,
        lines: currentChunk,
        startLine: chunkStartLine,
        endLine: lineCount,
        bytes: currentChunkBytes,
      };
    }
  }

  /**
   * Emit chunk with backpressure handling
   */
  private async emitChunk(
    lines: string[],
    startLine: number,
    endLine: number,
    bytes: number
  ): Promise<void> {
    const chunk: ChunkData = {
      index: 0, // Will be set by caller
      lines: [...lines],
      startLine,
      endLine,
      bytes,
    };

    // Emit chunk event
    this.emit('chunk', chunk);

    // Wait for event processing (backpressure)
    await new Promise(resolve => setImmediate(resolve));
  }

  /**
   * Check memory usage and pause if needed
   */
  private async checkMemoryUsage(): Promise<void> {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;

    this.currentMemory = heapUsedMB;
    this.emit('memory', heapUsedMB);

    // Pause if exceeding limit
    if (heapUsedMB > this.options.maxMemoryMB) {
      this.emit('memoryWarning', heapUsedMB);

      // Trigger GC if available
      if (global.gc) {
        global.gc();
      }

      // Wait for memory to stabilize
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): number {
    return this.currentMemory;
  }
}

/**
 * Search result
 */
export interface SearchResult {
  line: number;
  column: number;
  text: string;
  match: string;
}

/**
 * Helper: Create stream analyzer
 */
export function createStreamAnalyzer(options?: StreamAnalyzerOptions): StreamAnalyzer {
  return new StreamAnalyzer(options);
}

/**
 * Helper: Analyze file (one-shot)
 */
export async function analyzeFile(filePath: string, options?: StreamAnalyzerOptions): Promise<FileAnalysis> {
  const analyzer = createStreamAnalyzer(options);
  return analyzer.analyzeFile(filePath);
}

/**
 * Helper: Count lines (one-shot)
 */
export async function countLines(filePath: string, options?: StreamAnalyzerOptions): Promise<number> {
  const analyzer = createStreamAnalyzer(options);
  return analyzer.countLines(filePath);
}

/**
 * Helper: Search file (one-shot)
 */
export async function searchFile(
  filePath: string,
  pattern: RegExp,
  options?: StreamAnalyzerOptions
): Promise<SearchResult[]> {
  const analyzer = createStreamAnalyzer(options);
  return analyzer.searchFile(filePath, pattern);
}
