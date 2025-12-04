#!/usr/bin/env node
/**
 * Bundle Size Gate Checker
 * Validates bundle size against .odavl/gates.yml thresholds
 * Week 4 Day 5 - Quality Gates Enhancement
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

/**
 * Analyzes build output directories for bundle sizes
 * @returns {object} Bundle analysis with total size, largest chunks
 */
function analyzeBundleSize() {
    const buildDirs = ['dist', '.next', 'out', 'build'];
    let totalSize = 0;
    const chunks = [];

    for (const dir of buildDirs) {
        const buildPath = path.join(ROOT, dir);
        if (!fs.existsSync(buildPath)) continue;

        const files = fs.readdirSync(buildPath, { recursive: true });

        for (const file of files) {
            if (typeof file !== 'string') continue;

            const filePath = path.join(buildPath, file);

            // Skip directories and certain file types
            if (!fs.statSync(filePath).isFile()) continue;
            if (file.endsWith('.map')) continue;
            if (file.includes('node_modules')) continue;
            if (file.includes('vendor')) continue;

            const stats = fs.statSync(filePath);
            totalSize += stats.size;

            chunks.push({
                file: path.relative(ROOT, filePath),
                size: stats.size,
                sizeKB: (stats.size / 1024).toFixed(2),
                sizeMB: (stats.size / 1024 / 1024).toFixed(2)
            });
        }
    }

    // Sort by size descending
    chunks.sort((a, b) => b.size - a.size);

    return {
        totalSize,
        totalSizeKB: (totalSize / 1024).toFixed(2),
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        chunkCount: chunks.length,
        largestChunk: chunks[0] || null,
        chunks: chunks.slice(0, 15) // Top 15 largest files
    };
}

/**
 * Reads bundle size gate configuration from .odavl/gates.yml
 * @returns {object} Bundle size gate config
 */
function readGateConfig() {
    const gatesPath = path.join(ROOT, '.odavl/gates.yml');

    if (!fs.existsSync(gatesPath)) {
        return { maxTotalMB: 5, maxChunkKB: 500, deltaMaxPercent: 10 };
    }

    const gates = yaml.load(fs.readFileSync(gatesPath, 'utf8'));
    return gates.bundleSize || { maxTotalMB: 5, maxChunkKB: 500, deltaMaxPercent: 10 };
}

/**
 * Reads previous bundle size from .odavl/metrics/bundle-last.json
 * @returns {object|null} Previous bundle size
 */
function readPreviousBundleSize() {
    const prevPath = path.join(ROOT, '.odavl/metrics/bundle-last.json');

    if (!fs.existsSync(prevPath)) {
        return null;
    }

    return JSON.parse(fs.readFileSync(prevPath, 'utf8'));
}

/**
 * Saves current bundle size for next comparison
 * @param {object} analysis Current bundle analysis
 */
function saveBundleSize(analysis) {
    const metricsDir = path.join(ROOT, '.odavl/metrics');
    if (!fs.existsSync(metricsDir)) {
        fs.mkdirSync(metricsDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(metricsDir, 'bundle-last.json'),
        JSON.stringify({ totalSize: analysis.totalSize, timestamp: new Date().toISOString() }, null, 2)
    );
}

/**
 * Main bundle size gate check
 */
function main() {
    console.log('📦 Checking Bundle Size Gate...\n');

    const analysis = analyzeBundleSize();
    const gateConfig = readGateConfig();
    const previous = readPreviousBundleSize();

    console.log('Bundle Size Analysis:');
    console.log(`  Total Size:     ${analysis.totalSizeMB} MB (${analysis.totalSizeKB} KB)`);
    console.log(`  Chunk Count:    ${analysis.chunkCount}`);

    if (analysis.largestChunk) {
        console.log(`  Largest Chunk:  ${analysis.largestChunk.file}`);
        console.log(`                  ${analysis.largestChunk.sizeKB} KB`);
    }
    console.log('');

    let failed = false;

    // Check total size
    const totalMB = analysis.totalSize / 1024 / 1024;
    if (totalMB > gateConfig.maxTotalMB) {
        console.log(`❌ Total bundle size ${totalMB.toFixed(2)}MB > ${gateConfig.maxTotalMB}MB`);
        failed = true;
    }

    // Check largest chunk
    if (analysis.largestChunk) {
        const chunkKB = analysis.largestChunk.size / 1024;
        if (chunkKB > gateConfig.maxChunkKB) {
            console.log(`❌ Largest chunk ${chunkKB.toFixed(2)}KB > ${gateConfig.maxChunkKB}KB`);
            console.log(`   File: ${analysis.largestChunk.file}`);
            failed = true;
        }
    }

    // Check delta (if previous exists)
    if (previous) {
        const delta = analysis.totalSize - previous.totalSize;
        const percentChange = (delta / previous.totalSize) * 100;

        if (percentChange > gateConfig.deltaMaxPercent) {
            console.log(`❌ Bundle size increased by ${percentChange.toFixed(2)}% > ${gateConfig.deltaMaxPercent}%`);
            console.log(`   Previous: ${(previous.totalSize / 1024 / 1024).toFixed(2)}MB`);
            console.log(`   Current:  ${totalMB.toFixed(2)}MB`);
            failed = true;
        }

        if (delta !== 0) {
            const change = delta > 0 ? 'increased' : 'decreased';
            const deltaMB = Math.abs(delta / 1024 / 1024);
            console.log(`📊 Bundle size ${change} by ${deltaMB.toFixed(2)}MB (${Math.abs(percentChange).toFixed(2)}%)`);
        }
    }

    // Show top 5 largest files
    console.log('\nTop 5 Largest Files:');
    for (const chunk of analysis.chunks.slice(0, 5)) {
        console.log(`  ${chunk.sizeKB.padStart(8)} KB  ${chunk.file}`);
    }

    if (failed) {
        console.log('\n❌ Bundle size gate FAILED');
        process.exit(1);
    }

    console.log('\n✅ Bundle size gate PASSED');
    saveBundleSize(analysis);
    process.exit(0);
}

main();
