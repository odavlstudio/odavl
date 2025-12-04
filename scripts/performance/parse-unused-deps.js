#!/usr/bin/env node
/**
 * Parse Unused Dependencies
 * Parses knip report and categorizes unused dependencies
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

async function main() {
    const workspaceRoot = process.cwd();
    const knipReportPath = path.join(workspaceRoot, '.odavl', 'performance', 'knip-report.json');

    console.log('🔍 Parsing unused dependencies report...\n');

    try {
        const reportContent = await fs.readFile(knipReportPath, 'utf8');
        const knipData = JSON.parse(reportContent);

        const unusedDeps = [];
        const unusedDevDeps = [];
        const unusedFiles = [];

        // Parse knip output structure
        for (const [workspace, data] of Object.entries(knipData)) {
            if (data.dependencies) {
                for (const dep of data.dependencies) {
                    unusedDeps.push({ workspace, dependency: dep });
                }
            }

            if (data.devDependencies) {
                for (const dep of data.devDependencies) {
                    unusedDevDeps.push({ workspace, dependency: dep });
                }
            }

            if (data.files) {
                for (const file of data.files) {
                    unusedFiles.push({ workspace, file });
                }
            }
        }

        console.log('📊 Results:\n');
        console.log(`Unused Dependencies: ${unusedDeps.length}`);
        console.log(`Unused Dev Dependencies: ${unusedDevDeps.length}`);
        console.log(`Unused Files: ${unusedFiles.length}\n`);

        if (unusedDeps.length > 0) {
            console.log('📦 Unused Dependencies:\n');
            for (const { workspace, dependency } of unusedDeps.slice(0, 10)) {
                console.log(`  ${workspace}: ${dependency}`);
            }
            if (unusedDeps.length > 10) {
                console.log(`  ... and ${unusedDeps.length - 10} more\n`);
            }
        }

        if (unusedDevDeps.length > 0) {
            console.log('\n🔧 Unused Dev Dependencies:\n');
            for (const { workspace, dependency } of unusedDevDeps.slice(0, 10)) {
                console.log(`  ${workspace}: ${dependency}`);
            }
            if (unusedDevDeps.length > 10) {
                console.log(`  ... and ${unusedDevDeps.length - 10} more\n`);
            }
        }

        // Save analysis
        const analysisPath = path.join(workspaceRoot, '.odavl', 'performance', 'unused-deps-analysis.json');
        await fs.writeFile(analysisPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            summary: {
                unusedDeps: unusedDeps.length,
                unusedDevDeps: unusedDevDeps.length,
                unusedFiles: unusedFiles.length
            },
            dependencies: unusedDeps,
            devDependencies: unusedDevDeps,
            files: unusedFiles
        }, null, 2));

        console.log(`\n📝 Analysis saved to: ${analysisPath}`);

        if (unusedDeps.length > 0 || unusedDevDeps.length > 0) {
            console.log('\n💡 Next Steps:');
            console.log('  1. Review the unused dependencies list');
            console.log('  2. Verify they are truly unused (false positives possible)');
            console.log('  3. Run: node scripts/performance/remove-unused-deps.js');
            console.log('  4. Test thoroughly after removal\n');
        } else {
            console.log('\n✅ No unused dependencies detected!\n');
        }

    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error('❌ Error: knip-report.json not found. Run knip first.');
            process.exit(1);
        }
        throw error;
    }
}

await main();
