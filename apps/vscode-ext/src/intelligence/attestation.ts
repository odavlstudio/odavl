import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { SecurityReport } from './security';
import { VerificationSummary } from './governance';
import { EnterpriseConfig } from './config';

export async function generateAttestationReport(
    report: SecurityReport,
    gates: VerificationSummary,
    workspacePath: string,
    config?: EnterpriseConfig
) {
    const attestationDir = path.join(workspacePath, '.odavl', 'attestation');
    await fs.mkdir(attestationDir, { recursive: true });
    const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
    const mdPath = path.join(attestationDir, `verify-report-${timestamp}.md`);
    const jsonPath = path.join(attestationDir, 'log.json');

    // Markdown report
    let md = `## ODAVL Security & Governance Verification\nDate: ${timestamp}\n\n### Vulnerabilities\n`;
    md += renderVulnerabilities(report);

    // Conditionally include gates section
    if (!config || config.includeGatesInReports) {
        md += renderGatesSection(gates);
    }

    await fs.writeFile(mdPath, md, 'utf8');

    // JSON log (append or create)
    let log: any[] = [];
    try {
        const prev = await fs.readFile(jsonPath, 'utf8');
        log = JSON.parse(prev);
    } catch { }
    log.push({ timestamp, report, gates });
    await fs.writeFile(jsonPath, JSON.stringify(log, null, 2), 'utf8');

    return { mdPath, jsonPath };
}

function renderVulnerabilities(report: SecurityReport): string {
    if (!report.vulnerabilities || report.vulnerabilities.length === 0) {
        return '- None found\n';
    }
    return report.vulnerabilities.map(v => {
        let vulnId = v.id ? ` (${v.id})` : '';
        return `- ${v.pkg} – ${v.severity}${vulnId}\n`;
    }).join('');
}

function renderGatesSection(gates: VerificationSummary): string {
    let section = '\n### Gates Evaluation\n| Gate | Status | Condition |\n|------|--------|-----------|\n';
    for (const g of gates.gates) {
        let statusStr = '❌ Fail';
        if (g.status === 'pass') statusStr = '✅ Pass';
        else if (g.status === 'warn') statusStr = '⚠️ Warn';
        section += `| ${g.name} | ${statusStr} | ${g.condition} |\n`;
    }
    section += `\n**Overall Compliance:** ${gates.compliance}%\n`;
    return section;
}
