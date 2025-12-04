#!/usr/bin/env node
/**
 * Detect Unsafe APIs
 * Scans for unsafe API usage (eval, innerHTML, dangerouslySetInnerHTML)
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';

// Unsafe API patterns
const UNSAFE_PATTERNS = [
    {
        name: 'eval()',
        pattern: /\beval\s*\(/g,
        severity: 'critical',
        recommendation: 'Use JSON.parse() or safer alternatives'
    },
    {
        name: 'Function constructor',
        pattern: /\bnew\s+Function\s*\(/g,
        severity: 'critical',
        recommendation: 'Avoid dynamic code execution'
    },
    {
        name: 'innerHTML',
        pattern: /\.innerHTML\s*=/g,
        severity: 'high',
        recommendation: 'Use textContent or sanitize with DOMPurify'
    },
    {
        name: 'dangerouslySetInnerHTML',
        pattern: /dangerouslySetInnerHTML\s*=/g,
        severity: 'high',
        recommendation: 'Sanitize HTML with DOMPurify or use safe alternatives'
    },
    {
        name: 'document.write',
        pattern: /document\.write\s*\(/g,
        severity: 'medium',
        recommendation: 'Use DOM manipulation methods'
    },
    {
        name: 'setTimeout with string',
        pattern: /setTimeout\s*\(\s*['"`]/g,
        severity: 'medium',
        recommendation: 'Use function callbacks instead of string evaluation'
    },
    {
        name: 'setInterval with string',
        pattern: /setInterval\s*\(\s*['"`]/g,
        severity: 'medium',
        recommendation: 'Use function callbacks instead of string evaluation'
    }
];

async function scanFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        const findings = [];

        for (const { name, pattern, severity, recommendation } of UNSAFE_PATTERNS) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                const lineNumber = content.substring(0, match.index).split('\n').length;
                const lineContent = content.split('\n')[lineNumber - 1].trim();

                findings.push({
                    file: filePath,
                    line: lineNumber,
                    apiName: name,
                    severity,
                    recommendation,
                    code: lineContent.substring(0, 80) + (lineContent.length > 80 ? '...' : ''),
                    column: match.index - content.lastIndexOf('\n', match.index)
                });
            }
        }

        return findings;
    } catch (error) {
        console.error(`Error scanning ${filePath}: ${error.message}`);
        return [];
    }
}

async function main() {
    const workspaceRoot = process.cwd();
    console.log('🔍 Scanning for unsafe API usage...\n');

    // Find all source files
    const files = await glob('**/*.{ts,js,tsx,jsx}', {
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

    console.log(`Scanning ${files.length} files...\n`);

    let allFindings = [];
    for (const file of files) {
        const findings = await scanFile(path.join(workspaceRoot, file));
        allFindings = allFindings.concat(findings);
    }

    // Group by severity
    const bySeverity = {
        critical: allFindings.filter(f => f.severity === 'critical'),
        high: allFindings.filter(f => f.severity === 'high'),
        medium: allFindings.filter(f => f.severity === 'medium')
    };

    // Output results
    console.log('📊 Results:\n');
    console.log(`Critical: ${bySeverity.critical.length}`);
    console.log(`High: ${bySeverity.high.length}`);
    console.log(`Medium: ${bySeverity.medium.length}`);
    console.log(`Total: ${allFindings.length}\n`);

    if (allFindings.length > 0) {
        console.log('🚨 Findings:\n');
        for (const finding of allFindings.slice(0, 15)) {
            console.log(`[${finding.severity.toUpperCase()}] ${finding.apiName}`);
            console.log(`  File: ${finding.file}:${finding.line}:${finding.column}`);
            console.log(`  Code: ${finding.code}`);
            console.log(`  Fix: ${finding.recommendation}`);
            console.log('');
        }

        if (allFindings.length > 15) {
            console.log(`... and ${allFindings.length - 15} more findings\n`);
        }
    } else {
        console.log('✅ No unsafe API usage detected!\n');
    }

    // Save report
    const reportPath = path.join(workspaceRoot, '.odavl', 'security', 'unsafe-api-report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        totalFiles: files.length,
        findings: allFindings,
        summary: {
            critical: bySeverity.critical.length,
            high: bySeverity.high.length,
            medium: bySeverity.medium.length,
            total: allFindings.length
        }
    }, null, 2));

    console.log(`📝 Report saved to: ${reportPath}`);

    // Exit with error if critical or high severity found
    if (bySeverity.critical.length > 0 || bySeverity.high.length > 0) {
        process.exit(1);
    }
}

await main();
