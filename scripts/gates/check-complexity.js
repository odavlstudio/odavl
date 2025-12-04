#!/usr/bin/env node
/**
 * Complexity Gate Checker
 * Validates cyclomatic complexity against .odavl/gates.yml thresholds
 * Week 4 Day 5 - Quality Gates Enhancement
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

/**
 * Runs ESLint complexity check and parses results
 * @returns {object} Complexity analysis with max, average, violations
 */
function analyzeComplexity() {
    try {
        // Run ESLint with complexity rule
        const cmd = 'pnpm exec eslint . --rule "complexity: [warn, 15]" --format json';
        const output = execSync(cmd, { cwd: ROOT, encoding: 'utf8' });
        const results = JSON.parse(output);

        let totalComplexity = 0;
        let functionCount = 0;
        let maxComplexity = 0;
        let maxComplexityFile = '';
        let maxComplexityFunction = '';
        const violations = [];

        for (const file of results) {
            if (file.messages.length === 0) continue;

            for (const msg of file.messages) {
                if (msg.ruleId === 'complexity') {
                    const match = msg.message.match(/complexity of (\d+)/);
                    if (match) {
                        const complexity = Number.parseInt(match[1], 10);
                        totalComplexity += complexity;
                        functionCount++;

                        if (complexity > maxComplexity) {
                            maxComplexity = complexity;
                            maxComplexityFile = file.filePath;
                            maxComplexityFunction = msg.message;
                        }

                        if (complexity > 15) {
                            violations.push({
                                file: path.relative(ROOT, file.filePath),
                                line: msg.line,
                                complexity,
                                message: msg.message
                            });
                        }
                    }
                }
            }
        }

        const average = functionCount > 0 ? totalComplexity / functionCount : 0;

        return {
            maxComplexity,
            maxComplexityFile: maxComplexityFile ? path.relative(ROOT, maxComplexityFile) : '',
            maxComplexityFunction,
            averageComplexity: average,
            functionCount,
            violations
        };
    } catch (error) {
        // ESLint returns non-zero exit code on warnings, but still outputs JSON
        if (error.stdout) {
            const results = JSON.parse(error.stdout.toString());
            // Process same as above (duplicated for error path)
            let totalComplexity = 0;
            let functionCount = 0;
            let maxComplexity = 0;
            const violations = [];

            for (const file of results) {
                for (const msg of file.messages) {
                    if (msg.ruleId === 'complexity') {
                        const match = msg.message.match(/complexity of (\d+)/);
                        if (match) {
                            const complexity = Number.parseInt(match[1], 10);
                            totalComplexity += complexity;
                            functionCount++;
                            if (complexity > maxComplexity) maxComplexity = complexity;
                            if (complexity > 15) {
                                violations.push({
                                    file: path.relative(ROOT, file.filePath),
                                    line: msg.line,
                                    complexity
                                });
                            }
                        }
                    }
                }
            }

            return {
                maxComplexity,
                averageComplexity: functionCount > 0 ? totalComplexity / functionCount : 0,
                functionCount,
                violations
            };
        }
        console.error('❌ Failed to analyze complexity:', error.message);
        process.exit(1);
    }
}

/**
 * Reads complexity gate configuration from .odavl/gates.yml
 * @returns {object} Complexity gate config
 */
function readGateConfig() {
    const gatesPath = path.join(ROOT, '.odavl/gates.yml');

    if (!fs.existsSync(gatesPath)) {
        return { maxPerFunction: 15, maxAverage: 10, deltaMax: 0, warnThreshold: 12 };
    }

    const gates = yaml.load(fs.readFileSync(gatesPath, 'utf8'));
    return gates.complexity || { maxPerFunction: 15, maxAverage: 10, deltaMax: 0, warnThreshold: 12 };
}

/**
 * Main complexity gate check
 */
function main() {
    console.log('🔍 Checking Complexity Gate...\n');

    const analysis = analyzeComplexity();
    const gateConfig = readGateConfig();

    console.log('Complexity Analysis:');
    console.log(`  Max Complexity:     ${analysis.maxComplexity}`);
    console.log(`  Average Complexity: ${analysis.averageComplexity.toFixed(2)}`);
    console.log(`  Functions Analyzed: ${analysis.functionCount}`);
    console.log(`  Violations (>15):   ${analysis.violations.length}`);
    console.log('');

    let failed = false;

    // Check max per function
    if (analysis.maxComplexity > gateConfig.maxPerFunction) {
        console.log(`❌ Max complexity ${analysis.maxComplexity} > ${gateConfig.maxPerFunction}`);
        if (analysis.maxComplexityFile) {
            console.log(`   File: ${analysis.maxComplexityFile}`);
            console.log(`   ${analysis.maxComplexityFunction}`);
        }
        failed = true;
    }

    // Check average
    if (analysis.averageComplexity > gateConfig.maxAverage) {
        console.log(`❌ Average complexity ${analysis.averageComplexity.toFixed(2)} > ${gateConfig.maxAverage}`);
        failed = true;
    }

    // List violations
    if (analysis.violations.length > 0) {
        console.log('\nComplexity Violations:');
        for (const v of analysis.violations.slice(0, 10)) { // Show first 10
            console.log(`  • ${v.file}:${v.line} - Complexity ${v.complexity}`);
        }
        if (analysis.violations.length > 10) {
            console.log(`  ... and ${analysis.violations.length - 10} more`);
        }
    }

    if (failed) {
        console.log('\n❌ Complexity gate FAILED');
        process.exit(1);
    }

    console.log('✅ Complexity gate PASSED');
    process.exit(0);
}

main();
