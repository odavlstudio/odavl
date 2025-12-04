#!/usr/bin/env node
/**
 * Parse Audit Report
 * Parses pnpm audit JSON output and identifies fixable vulnerabilities
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

function parseVulnerabilities(vulnerabilities) {
    const findings = [];
    for (const [packageName, vuln] of Object.entries(vulnerabilities)) {
        findings.push({
            package: packageName,
            severity: vuln.severity,
            via: Array.isArray(vuln.via) ? vuln.via.map(v => typeof v === 'string' ? v : v.title).join(', ') : vuln.via,
            range: vuln.range,
            fixAvailable: vuln.fixAvailable !== false,
            effects: vuln.effects || []
        });
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
    findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    return findings;
}

function getSummary(findings) {
    return {
        critical: findings.filter(f => f.severity === 'critical').length,
        high: findings.filter(f => f.severity === 'high').length,
        moderate: findings.filter(f => f.severity === 'moderate').length,
        low: findings.filter(f => f.severity === 'low').length,
        fixable: findings.filter(f => f.fixAvailable).length,
        total: findings.length
    };
}

function printSummary(summary) {
    console.log('📊 Vulnerability Summary:\n');
    console.log(`Critical: ${summary.critical}`);
    console.log(`High: ${summary.high}`);
    console.log(`Moderate: ${summary.moderate}`);
    console.log(`Low: ${summary.low}`);
    console.log(`Total: ${summary.total}`);
    console.log(`Fixable: ${summary.fixable}\n`);
}

function printFindings(findings) {
    if (findings.length === 0) {
        console.log('✅ No vulnerabilities found!\n');
        return;
    }

    console.log('🚨 Top Vulnerabilities:\n');
    for (const finding of findings.slice(0, 10)) {
        console.log(`[${finding.severity.toUpperCase()}] ${finding.package}`);
        console.log(`  Issue: ${finding.via}`);
        console.log(`  Fix Available: ${finding.fixAvailable ? '✅ Yes' : '❌ No'}`);
        console.log('');
    }

    if (findings.length > 10) {
        console.log(`... and ${findings.length - 10} more vulnerabilities\n`);
    }
}

function printRecommendations(summary) {
    if (summary.fixable > 0) {
        console.log('💡 Recommendations:');
        console.log(`  - ${summary.fixable} vulnerabilities can be fixed automatically`);
        console.log('  - Run: pnpm audit fix');
        if (summary.critical > 0 || summary.high > 0) {
            console.log('  - Consider running: pnpm audit fix --force (may introduce breaking changes)');
        }
        console.log('');
    }
}

async function main() {
    const workspaceRoot = process.cwd();
    const auditReportPath = path.join(workspaceRoot, '.odavl', 'security', 'audit-report.json');

    console.log('🔍 Parsing audit report...\n');

    try {
        const reportContent = await fs.readFile(auditReportPath, 'utf8');
        const audit = JSON.parse(reportContent);

        // Parse npm audit JSON format
        const vulnerabilities = audit.vulnerabilities || {};
        const metadata = audit.metadata || {};

        const findings = parseVulnerabilities(vulnerabilities);
        const summary = getSummary(findings);

        printSummary(summary);
        printFindings(findings);

        // Save analysis
        const analysisPath = path.join(workspaceRoot, '.odavl', 'security', 'audit-analysis.json');
        await fs.writeFile(analysisPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            summary,
            findings,
            metadata
        }, null, 2));

        console.log(`📝 Analysis saved to: ${analysisPath}\n`);

        // Recommendations
        printRecommendations(summary);

        // Exit with error if critical/high vulnerabilities found
        if (summary.critical > 0 || summary.high > 0) {
            process.exit(1);
        }

    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error('❌ Error: audit-report.json not found. Run pnpm audit first.');
            process.exit(1);
        }
        throw error;
    }
}

await main();
