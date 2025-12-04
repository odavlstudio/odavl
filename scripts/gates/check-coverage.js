#!/usr/bin/env node
/**
 * Test Coverage Gate Checker
 * Validates test coverage against .odavl/gates.yml thresholds
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
 * Reads test coverage report from coverage/coverage-summary.json
 * @returns {object} Coverage summary with line, branch, function, statement percentages
 */
function readCoverageReport() {
    const coveragePath = path.join(ROOT, 'coverage/coverage-summary.json');

    if (!fs.existsSync(coveragePath)) {
        console.warn('⚠️ No coverage report found. Run: pnpm test:coverage');
        return null;
    }

    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    const totals = coverage.total;

    return {
        lines: totals.lines.pct,
        branches: totals.branches.pct,
        functions: totals.functions.pct,
        statements: totals.statements.pct,
        covered: {
            lines: totals.lines.covered,
            branches: totals.branches.covered,
            functions: totals.functions.covered,
            statements: totals.statements.covered
        },
        total: {
            lines: totals.lines.total,
            branches: totals.branches.total,
            functions: totals.functions.total,
            statements: totals.statements.total
        }
    };
}

/**
 * Reads test coverage gate configuration from .odavl/gates.yml
 * @returns {object} Coverage gate config (minPercentage, deltaMax, enforceBranches)
 */
function readGateConfig() {
    const gatesPath = path.join(ROOT, '.odavl/gates.yml');

    if (!fs.existsSync(gatesPath)) {
        return { minPercentage: 80, deltaMax: -5, enforceBranches: true };
    }

    const gates = yaml.load(fs.readFileSync(gatesPath, 'utf8'));
    return gates.testCoverage || { minPercentage: 80, deltaMax: -5, enforceBranches: true };
}

/**
 * Reads previous coverage from .odavl/metrics/coverage-last.json
 * @returns {object|null} Previous coverage percentages
 */
function readPreviousCoverage() {
    const prevPath = path.join(ROOT, '.odavl/metrics/coverage-last.json');

    if (!fs.existsSync(prevPath)) {
        return null;
    }

    return JSON.parse(fs.readFileSync(prevPath, 'utf8'));
}

/**
 * Saves current coverage for next comparison
 * @param {object} coverage Current coverage percentages
 */
function saveCoverage(coverage) {
    const metricsDir = path.join(ROOT, '.odavl/metrics');
    if (!fs.existsSync(metricsDir)) {
        fs.mkdirSync(metricsDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(metricsDir, 'coverage-last.json'),
        JSON.stringify(coverage, null, 2)
    );
}

/**
 * Main coverage gate check
 */
function main() {
    console.log('🧪 Checking Test Coverage Gate...\n');

    const coverage = readCoverageReport();
    if (!coverage) {
        process.exit(1);
    }

    const gateConfig = readGateConfig();
    const previous = readPreviousCoverage();

    console.log('Coverage Summary:');
    console.log(`  Lines:      ${coverage.lines.toFixed(2)}% (${coverage.covered.lines}/${coverage.total.lines})`);
    console.log(`  Branches:   ${coverage.branches.toFixed(2)}% (${coverage.covered.branches}/${coverage.total.branches})`);
    console.log(`  Functions:  ${coverage.functions.toFixed(2)}% (${coverage.covered.functions}/${coverage.total.functions})`);
    console.log(`  Statements: ${coverage.statements.toFixed(2)}% (${coverage.covered.statements}/${coverage.total.statements})`);
    console.log('');

    // Check minimum threshold
    const checkMetric = gateConfig.enforceBranches ? 'branches' : 'lines';
    const current = coverage[checkMetric];
    const threshold = gateConfig.minPercentage;

    if (current < threshold) {
        console.log(`❌ Coverage gate FAILED: ${current.toFixed(2)}% < ${threshold}%`);
        console.log(`   Metric: ${checkMetric}`);
        process.exit(1);
    }

    // Check delta (if previous exists)
    if (previous) {
        const delta = current - previous[checkMetric];
        const maxDecrease = gateConfig.deltaMax;

        if (delta < maxDecrease) {
            console.log(`❌ Coverage decreased too much: ${delta.toFixed(2)}% < ${maxDecrease}%`);
            console.log(`   Previous: ${previous[checkMetric].toFixed(2)}%`);
            console.log(`   Current:  ${current.toFixed(2)}%`);
            process.exit(1);
        }

        if (delta !== 0) {
            const change = delta > 0 ? 'increased' : 'decreased';
            console.log(`📊 Coverage ${change} by ${Math.abs(delta).toFixed(2)}%`);
        }
    }

    console.log(`✅ Coverage gate PASSED: ${current.toFixed(2)}% >= ${threshold}%`);
    saveCoverage(coverage);
    process.exit(0);
}

main();
