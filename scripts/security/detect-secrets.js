#!/usr/bin/env node
/**
 * Detect Hardcoded Secrets
 * Scans codebase for potential hardcoded secrets like API keys, passwords, tokens
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';

// Regex patterns for common secret types
const SECRET_PATTERNS = [
    {
        name: 'API Key',
        pattern: /['"]?([A-Z_]+)?API[_-]?KEY['"]?\s*[:=]\s*['"]([A-Za-z0-9_-]{20,})['"]?/gi,
        severity: 'high'
    },
    {
        name: 'AWS Access Key',
        pattern: /AKIA[0-9A-Z]{16}/g,
        severity: 'critical'
    },
    {
        name: 'Password',
        pattern: /['"]?password['"]?\s*[:=]\s*['"](?!.*\$\{)([^'"]{8,})['"]?/gi,
        severity: 'high'
    },
    {
        name: 'Private Key',
        pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
        severity: 'critical'
    },
    {
        name: 'GitHub Token',
        pattern: /gh[pousr]_\w{36,}/g,
        severity: 'critical'
    },
    {
        name: 'Generic Secret',
        pattern: /['"]?secret['"]?\s*[:=]\s*['"](?!.*\$\{)([^'"]{15,})['"]?/gi,
        severity: 'medium'
    },
    {
        name: 'Bearer Token',
        pattern: /['"]?bearer\s+[A-Za-z0-9._~+/]+=*['"]?/gi,
        severity: 'high'
    },
    {
        name: 'Database URL',
        pattern: /(?:postgres|mysql|mongodb):\/\/[^:]+:[^@]+@[^/]+/gi,
        severity: 'high'
    }
];

async function scanFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        const findings = [];

        for (const { name, pattern, severity } of SECRET_PATTERNS) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                const lineNumber = content.substring(0, match.index).split('\n').length;
                findings.push({
                    file: filePath,
                    line: lineNumber,
                    secretType: name,
                    severity,
                    match: match[0].substring(0, 50) + (match[0].length > 50 ? '...' : ''),
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
    console.log('🔍 Scanning for hardcoded secrets...\n');

    // Find all source files
    const files = await glob('**/*.{ts,js,tsx,jsx,json,env}', {
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
        for (const finding of allFindings.slice(0, 20)) {
            console.log(`[${finding.severity.toUpperCase()}] ${finding.secretType}`);
            console.log(`  File: ${finding.file}:${finding.line}:${finding.column}`);
            console.log(`  Match: ${finding.match}`);
            console.log('');
        }

        if (allFindings.length > 20) {
            console.log(`... and ${allFindings.length - 20} more findings\n`);
        }
    } else {
        console.log('✅ No hardcoded secrets detected!\n');
    }

    // Save report
    const reportPath = path.join(workspaceRoot, '.odavl', 'security', 'secrets-report.json');
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
