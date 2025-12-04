#!/usr/bin/env node
/**
 * Parse Type Coverage Report
 * Parses type-coverage report and identifies files with low type coverage
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

async function main() {
    const workspaceRoot = process.cwd();
    const reportPath = path.join(workspaceRoot, '.odavl', 'quality', 'type-coverage-report.json');

    console.log('🔍 Parsing type coverage report...\n');

    try {
        const reportContent = await fs.readFile(reportPath, 'utf8');
        const coverage = JSON.parse(reportContent);

        const percentage = coverage.correctCount && coverage.totalCount
            ? ((coverage.correctCount / coverage.totalCount) * 100).toFixed(2)
            : 0;

        const anyUsages = coverage.any || [];

        console.log('📊 Type Coverage Analysis:\n');
        console.log(`Coverage: ${percentage}%`);
        console.log(`Total Symbols: ${coverage.totalCount || 0}`);
        console.log(`Typed Symbols: ${coverage.correctCount || 0}`);
        console.log(`'any' Usages: ${anyUsages.length}\n`);

        if (anyUsages.length > 0) {
            console.log('⚠️  Files with "any" usages:\n');

            const byFile = {};
            for (const usage of anyUsages) {
                const file = usage.file || 'unknown';
                if (!byFile[file]) byFile[file] = [];
                byFile[file].push(usage);
            }

            const files = Object.entries(byFile)
                .sort((a, b) => b[1].length - a[1].length)
                .slice(0, 15);

            for (const [file, usages] of files) {
                console.log(`  ${path.basename(file)}: ${usages.length} 'any' usages`);
            }

            if (Object.keys(byFile).length > 15) {
                console.log(`  ... and ${Object.keys(byFile).length - 15} more files\n`);
            }
        } else {
            console.log('✅ No "any" usages found!\n');
        }

        // Save analysis
        const analysisPath = path.join(workspaceRoot, '.odavl', 'quality', 'type-coverage-analysis.json');
        await fs.writeFile(analysisPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            summary: {
                percentage: parseFloat(percentage),
                totalSymbols: coverage.totalCount || 0,
                typedSymbols: coverage.correctCount || 0,
                anyUsages: anyUsages.length
            },
            details: coverage
        }, null, 2));

        console.log(`📝 Analysis saved to: ${analysisPath}\n`);

        if (parseFloat(percentage) < 90) {
            console.log('💡 Recommendations:');
            console.log('  - Replace "any" with specific types');
            console.log('  - Add return type annotations');
            console.log('  - Use "unknown" instead of "any" when type is truly unknown');
            console.log('  - Enable strict mode in tsconfig.json\n');
        }

    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error('❌ Error: type-coverage-report.json not found.');
            process.exit(1);
        }
        throw error;
    }
}

await main();
