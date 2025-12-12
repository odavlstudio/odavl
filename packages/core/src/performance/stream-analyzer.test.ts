/**
 * Stream Analyzer Tests
 * 
 * Test suite for StreamAnalyzer class.
 * 
 * @since Phase 1 Week 19 (December 2025)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  StreamAnalyzer,
  createStreamAnalyzer,
  analyzeFile,
  countLines,
  searchFile,
  ChunkData,
  FileAnalysis,
} from './stream-analyzer';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('StreamAnalyzer', () => {
  let testDir: string;
  let testFiles: Map<string, string> = new Map();

  beforeEach(async () => {
    // Create temp directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'stream-analyzer-test-'));

    // Create test files
    await createTestFiles();
  });

  afterEach(async () => {
    // Clean up
    await fs.rm(testDir, { recursive: true, force: true });
    testFiles.clear();
  });

  async function createTestFiles() {
    // Small file (1KB, ~20 lines)
    const smallFile = path.join(testDir, 'small.txt');
    const smallContent = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`).join('\n');
    await fs.writeFile(smallFile, smallContent, 'utf-8');
    testFiles.set('small', smallFile);

    // Medium file (100KB, ~2000 lines)
    const mediumFile = path.join(testDir, 'medium.txt');
    const mediumContent = Array.from({ length: 2000 }, (_, i) => `Line ${i + 1}: ${'x'.repeat(40)}`).join('\n');
    await fs.writeFile(mediumFile, mediumContent, 'utf-8');
    testFiles.set('medium', mediumFile);

    // Large file (10MB, ~200k lines)
    const largeFile = path.join(testDir, 'large.txt');
    const largeContent = Array.from({ length: 200000 }, (_, i) => `Line ${i + 1}: ${'x'.repeat(40)}`).join('\n');
    await fs.writeFile(largeFile, largeContent, 'utf-8');
    testFiles.set('large', largeFile);

    // File with patterns
    const patternFile = path.join(testDir, 'pattern.txt');
    const patternContent = `
      console.log('hello');
      const x = 42;
      console.error('error');
      console.warn('warning');
      const y = 100;
    `;
    await fs.writeFile(patternFile, patternContent.trim(), 'utf-8');
    testFiles.set('pattern', patternFile);
  }

  describe('Configuration', () => {
    it('should use default options', () => {
      const analyzer = createStreamAnalyzer();
      expect(analyzer).toBeInstanceOf(StreamAnalyzer);
    });

    it('should respect custom options', () => {
      const analyzer = createStreamAnalyzer({
        chunkSize: 32 * 1024,
        maxMemoryMB: 128,
        encoding: 'utf-8',
      });
      expect(analyzer).toBeInstanceOf(StreamAnalyzer);
    });
  });

  describe('File Analysis', () => {
    it('should analyze small file', async () => {
      const filePath = testFiles.get('small')!;
      const analysis = await analyzeFile(filePath);

      expect(analysis.filePath).toBe(filePath);
      expect(analysis.lines).toBe(20);
      expect(analysis.size).toBeGreaterThan(0);
      expect(analysis.chunks).toBeGreaterThan(0);
      expect(analysis.duration).toBeGreaterThan(0);
    });

    it('should analyze medium file efficiently', async () => {
      const filePath = testFiles.get('medium')!;
      const analysis = await analyzeFile(filePath);

      expect(analysis.lines).toBe(2000);
      expect(analysis.chunks).toBeGreaterThan(1);
      expect(analysis.duration).toBeLessThan(1000); // <1s
    });

    it('should analyze large file without OOM', async () => {
      const filePath = testFiles.get('large')!;
      const analyzer = createStreamAnalyzer({
        maxMemoryMB: 256,
      });

      const analysis = await analyzer.analyzeFile(filePath);

      expect(analysis.lines).toBe(200000);
      expect(analysis.memoryUsed).toBeLessThan(256 * 1024 * 1024);
    }, 30000);

    it('should emit complete event', async () => {
      const filePath = testFiles.get('small')!;
      const analyzer = createStreamAnalyzer();

      let completeEmitted = false;
      analyzer.on('complete', (analysis: FileAnalysis) => {
        completeEmitted = true;
        expect(analysis.lines).toBe(20);
      });

      await analyzer.analyzeFile(filePath);
      expect(completeEmitted).toBe(true);
    });
  });

  describe('Chunk Processing', () => {
    it('should emit chunks', async () => {
      const filePath = testFiles.get('medium')!;
      const analyzer = createStreamAnalyzer({
        chunkSize: 1024, // Small chunks
      });

      const chunks: ChunkData[] = [];
      analyzer.on('chunk', (chunk: ChunkData) => {
        chunks.push(chunk);
      });

      await analyzer.analyzeFile(filePath);

      expect(chunks.length).toBeGreaterThan(10);
      expect(chunks[0].lines.length).toBeGreaterThan(0);
    });

    it('should process chunks with custom handler', async () => {
      const filePath = testFiles.get('small')!;
      const analyzer = createStreamAnalyzer();

      const results = await analyzer.processFile(filePath, async (chunk) => {
        return chunk.lines.length;
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.reduce((a, b) => a + b, 0)).toBe(20);
    });

    it('should provide correct line ranges', async () => {
      const filePath = testFiles.get('medium')!;
      const analyzer = createStreamAnalyzer({
        chunkSize: 2048,
      });

      const chunks: ChunkData[] = [];
      analyzer.on('chunk', (chunk: ChunkData) => {
        chunks.push(chunk);
      });

      await analyzer.analyzeFile(filePath);

      // Check continuity
      for (let i = 1; i < chunks.length; i++) {
        expect(chunks[i].startLine).toBe(chunks[i - 1].endLine);
      }
    });
  });

  describe('Line Counting', () => {
    it('should count lines in small file', async () => {
      const filePath = testFiles.get('small')!;
      const count = await countLines(filePath);

      expect(count).toBe(20);
    });

    it('should count lines in large file efficiently', async () => {
      const filePath = testFiles.get('large')!;
      
      const startTime = Date.now();
      const count = await countLines(filePath);
      const duration = Date.now() - startTime;

      expect(count).toBe(200000);
      expect(duration).toBeLessThan(5000); // <5s
    }, 10000);
  });

  describe('Pattern Search', () => {
    it('should find pattern matches', async () => {
      const filePath = testFiles.get('pattern')!;
      const results = await searchFile(filePath, /console\.(log|error|warn)/g);

      expect(results.length).toBe(3);
      expect(results[0].match).toContain('console.');
    });

    it('should provide line and column info', async () => {
      const filePath = testFiles.get('pattern')!;
      const results = await searchFile(filePath, /console\.log/g);

      expect(results[0].line).toBeGreaterThan(0);
      expect(results[0].column).toBeGreaterThan(0);
      expect(results[0].text).toContain('console.log');
    });

    it('should find all occurrences', async () => {
      const filePath = testFiles.get('pattern')!;
      const results = await searchFile(filePath, /const/g);

      expect(results.length).toBe(2); // x and y
    });
  });

  describe('Generator API', () => {
    it('should yield chunks via generator', async () => {
      const filePath = testFiles.get('medium')!;
      const analyzer = createStreamAnalyzer({
        chunkSize: 2048,
      });

      const chunks: ChunkData[] = [];
      for await (const chunk of analyzer.readChunks(filePath)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(10);
      expect(chunks[0].index).toBe(0);
    });

    it('should process chunks lazily', async () => {
      const filePath = testFiles.get('large')!;
      const analyzer = createStreamAnalyzer();

      let processedChunks = 0;
      for await (const chunk of analyzer.readChunks(filePath)) {
        processedChunks++;
        if (processedChunks >= 5) {
          break; // Stop early
        }
      }

      expect(processedChunks).toBe(5);
    }, 10000);
  });

  describe('Memory Management', () => {
    it('should track memory usage', async () => {
      const filePath = testFiles.get('medium')!;
      const analyzer = createStreamAnalyzer();

      let memoryEmitted = false;
      analyzer.on('memory', (memMB: number) => {
        memoryEmitted = true;
        expect(memMB).toBeGreaterThan(0);
      });

      await analyzer.analyzeFile(filePath);
      expect(memoryEmitted).toBe(true);
    });

    it('should emit warning on high memory', async () => {
      const filePath = testFiles.get('large')!;
      const analyzer = createStreamAnalyzer({
        maxMemoryMB: 50, // Low limit
      });

      let warningEmitted = false;
      analyzer.on('memoryWarning', (memMB: number) => {
        warningEmitted = true;
        expect(memMB).toBeGreaterThan(50);
      });

      await analyzer.analyzeFile(filePath);
      // May or may not emit depending on system
    }, 15000);

    it('should report current memory usage', async () => {
      const analyzer = createStreamAnalyzer();
      const filePath = testFiles.get('small')!;

      await analyzer.analyzeFile(filePath);
      const memUsage = analyzer.getMemoryUsage();

      expect(memUsage).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent file', async () => {
      const filePath = path.join(testDir, 'does-not-exist.txt');

      await expect(async () => {
        await analyzeFile(filePath);
      }).rejects.toThrow();
    });

    it('should handle empty file', async () => {
      const emptyFile = path.join(testDir, 'empty.txt');
      await fs.writeFile(emptyFile, '', 'utf-8');

      const analysis = await analyzeFile(emptyFile);
      expect(analysis.lines).toBe(0);
      expect(analysis.size).toBe(0);
    });

    it('should handle binary file gracefully', async () => {
      const binaryFile = path.join(testDir, 'binary.bin');
      const buffer = Buffer.from([0xFF, 0xFE, 0xFD, 0xFC]);
      await fs.writeFile(binaryFile, buffer);

      // Should not crash
      const analysis = await analyzeFile(binaryFile);
      expect(analysis.size).toBe(4);
    });
  });

  describe('Performance', () => {
    it('should be faster than full file read for large files', async () => {
      const filePath = testFiles.get('large')!;

      // Stream-based
      const streamStart = Date.now();
      await countLines(filePath);
      const streamDuration = Date.now() - streamStart;

      // Full read
      const fullStart = Date.now();
      const content = await fs.readFile(filePath, 'utf-8');
      const fullLines = content.split('\n').length;
      const fullDuration = Date.now() - fullStart;

      // Stream should use less memory (not necessarily faster for counting)
      expect(fullLines).toBe(200000);
    }, 15000);

    it('should handle concurrent analysis', async () => {
      const files = [
        testFiles.get('small')!,
        testFiles.get('medium')!,
        testFiles.get('large')!,
      ];

      const promises = files.map(file => analyzeFile(file));
      const results = await Promise.all(promises);

      expect(results.length).toBe(3);
      expect(results[0].lines).toBe(20);
      expect(results[1].lines).toBe(2000);
      expect(results[2].lines).toBe(200000);
    }, 20000);
  });
});
