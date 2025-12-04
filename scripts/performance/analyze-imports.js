#!/usr/bin/env node
/**
 * Analyze Imports
 * Analyzes import patterns and identifies performance bottlenecks
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';

const SLOW_LIBRARIES = [
    'moment',
    'lodash',
    'rxjs',
    'date-fns',
    '@mui/material',
    'antd'
];

async function analyzeFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.split('\n');

        const imports = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            // Match various import patterns
            const patterns = [
                /import\s+(?:(?:\{[^}]+\})|(?:\*\s+as\s+\w+)|(?:\w+))\s+from\s+['"]([^'"]+)['"]/,
                /import\s+['"]([^'"]+)['"]/,
                /require\s*\(\s*['"]([^'"]+)['"]\s*\)/
            ];

            for (const pattern of patterns) {
                const match = line.match(pattern);
                if (match) {
                    const importPath = match[1];

                    imports.push({
                        file: filePath,
                        line: lineNumber,
                        import: importPath,
                        type: getImportType(line),
                        isBarrel: importPath.endsWith('/index') || !importPath.includes('/'),
                        isSlow: SLOW_LIBRARIES.some(lib => importPath.startsWith(lib))
                    });
                }
            }
        }

        return imports;
    } catch (error) {
        console.error(`Error analyzing ${filePath}: ${error.message}`);
        return [];
    }
}

function getImportType(line) {
    if (line.includes('import * as')) return 'namespace';
    if (line.includes('import {')) return 'named';
    if (line.includes('import type')) return 'type';
    if (line.includes('require(')) return 'require';
    return 'default';
}

async function main() {
    const workspaceRoot = process.cwd();
    console.log('🔍 Analyzing import patterns...\n');

    // Find all source files
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
        cwd: workspaceRoot,
        ignore: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.next/**',
            '**/out/**',
            '**/*.test.*',
            '**/*.spec.*',
            '.odavl/**'
        ]
    });

    console.log(`Analyzing ${files.length} files...\n`);

    let allImports = [];
    for (const file of files) {
        const imports = await analyzeFile(path.join(workspaceRoot, file));
        allImports = allImports.concat(imports);
    }

    // Analyze patterns
    const slowImports = allImports.filter(i => i.isSlow);
    const namespaceImports = allImports.filter(i => i.type === 'namespace');
    const barrelImports = allImports.filter(i => i.isBarrel);

    console.log('📊 Import Analysis:\n');
    console.log(`Total Imports: ${allImports.length}`);
    console.log(`Slow Library Imports: ${slowImports.length}`);
    console.log(`Namespace Imports: ${namespaceImports.length}`);
    console.log(`Barrel Imports: ${barrelImports.length}\n`);

    if (slowImports.length > 0) {
        console.log('⚠️  Slow Library Imports:\n');
        const grouped = {};
        for (const imp of slowImports) {
            const lib = SLOW_LIBRARIES.find(l => imp.import.startsWith(l));
            if (!grouped[lib]) grouped[lib] = [];
            grouped[lib].push(imp);
        }

        for (const [lib, imports] of Object.entries(grouped)) {
            console.log(`  ${lib}: ${imports.length} imports`);
        }
        console.log('');
    }

    // Save report
    const reportPath = path.join(workspaceRoot, '.odavl', 'performance', 'import-analysis.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            totalImports: allImports.length,
            slowImports: slowImports.length,
            namespaceImports: namespaceImports.length,
            barrelImports: barrelImports.length
        },
        imports: allImports,
        recommendations: generateRecommendations(slowImports, namespaceImports, barrelImports)
    }, null, 2));

    console.log(`📝 Report saved to: ${reportPath}\n`);

    // Recommendations
    if (slowImports.length > 0 || namespaceImports.length > 5) {
        console.log('💡 Recommendations:');
        if (slowImports.length > 0) {
            console.log('  - Replace moment with date-fns or dayjs');
            console.log('  - Use lodash-es instead of lodash for tree-shaking');
        }
        if (namespaceImports.length > 5) {
            console.log('  - Convert namespace imports to named imports');
        }
        if (barrelImports.length > 20) {
            console.log('  - Use direct imports instead of barrel files');
        }
        console.log('');
    }
}

function generateRecommendations(slow, namespace, barrel) {
    const recs = [];

    if (slow.length > 0) {
        recs.push('Replace heavy libraries with lighter alternatives');
    }
    if (namespace.length > 5) {
        recs.push('Convert namespace imports to named imports for better tree-shaking');
    }
    if (barrel.length > 20) {
        recs.push('Use direct imports to reduce unnecessary code loading');
    }

    return recs;
}

await main();
