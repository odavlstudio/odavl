#!/usr/bin/env node
/**
 * Analyze Bundle Size
 * Analyzes bundle composition and identifies heavy dependencies
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';

async function analyzePackageSize(pkgPath) {
    try {
        const stats = await fs.stat(pkgPath);
        const pkgJson = JSON.parse(await fs.readFile(pkgPath, 'utf8'));

        return {
            name: pkgJson.name,
            version: pkgJson.version,
            size: stats.size,
            dependencies: Object.keys(pkgJson.dependencies || {}).length,
            devDependencies: Object.keys(pkgJson.devDependencies || {}).length
        };
    } catch {
        return null;
    }
}

async function analyzeBuildOutput() {
    const workspaceRoot = process.cwd();
    const buildDirs = ['dist', '.next', 'out', 'build'];

    const results = [];

    for (const dir of buildDirs) {
        const dirPath = path.join(workspaceRoot, dir);
        try {
            const files = await glob('**/*.{js,css}', {
                cwd: dirPath,
                absolute: true
            });

            for (const file of files) {
                const stats = await fs.stat(file);
                const relativePath = path.relative(workspaceRoot, file);

                results.push({
                    file: relativePath,
                    size: stats.size,
                    sizeKB: (stats.size / 1024).toFixed(2),
                    sizeMB: (stats.size / 1024 / 1024).toFixed(2)
                });
            }
        } catch {
            // Directory doesn't exist, skip
        }
    }

    return results.sort((a, b) => b.size - a.size);
}

async function main() {
    console.log('📦 Analyzing bundle size...\n');

    const workspaceRoot = process.cwd();

    // Analyze build output
    const buildFiles = await analyzeBuildOutput();

    if (buildFiles.length === 0) {
        console.log('⚠️  No build output found. Run build first: pnpm build\n');
        return;
    }

    const totalSize = buildFiles.reduce((sum, f) => sum + f.size, 0);
    const totalMB = (totalSize / 1024 / 1024).toFixed(2);

    console.log('📊 Bundle Analysis:\n');
    console.log(`Total Size: ${totalMB} MB`);
    console.log(`Total Files: ${buildFiles.length}\n`);

    console.log('🔝 Largest Files:\n');
    for (const file of buildFiles.slice(0, 15)) {
        const sizeLabel = file.size > 1024 * 1024
            ? `${file.sizeMB} MB`
            : `${file.sizeKB} KB`;
        console.log(`  ${sizeLabel.padStart(10)} - ${file.file}`);
    }

    if (buildFiles.length > 15) {
        console.log(`  ... and ${buildFiles.length - 15} more files\n`);
    }

    // Identify problematic files
    const largFiles = buildFiles.filter(f => f.size > 500 * 1024); // > 500KB

    if (largFiles.length > 0) {
        console.log(`\n⚠️  ${largFiles.length} files exceed 500KB threshold\n`);
    }

    // Save report
    const reportPath = path.join(workspaceRoot, '.odavl', 'performance', 'bundle-analysis.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            totalSize,
            totalMB,
            fileCount: buildFiles.length,
            largeFilesCount: largFiles.length
        },
        files: buildFiles
    }, null, 2));

    console.log(`\n📝 Report saved to: ${reportPath}`);

    // Recommendations
    if (largFiles.length > 0) {
        console.log('\n💡 Recommendations:');
        console.log('  - Consider code splitting for large files');
        console.log('  - Use dynamic imports for heavy components');
        console.log('  - Replace heavy libraries (lodash → lodash-es, moment → date-fns)');
        console.log('  - Enable tree-shaking in bundler config\n');
    }
}

await main();
