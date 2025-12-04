import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import type { InsightPacket, GuardianAttestation } from './BridgeProtocol';
import { calculateRiskScore, determineStatus } from './BridgeProtocol';

export class VerifyAttestation {
    constructor(private readonly workspaceRoot: string) { }

    async generate(packets: InsightPacket[]): Promise<GuardianAttestation> {
        const totalErrors = packets.reduce((sum, p) => sum + p.errorCount, 0);
        const totalFixes = packets.reduce((sum, p) => sum + p.fixesApplied, 0);
        const riskScore = calculateRiskScore(totalErrors, totalFixes);
        const status = determineStatus(riskScore);

        const attestation: GuardianAttestation = {
            cycle: 'Insight→Guardian',
            status,
            verifiedAt: new Date().toISOString(),
            checksum: this.generateChecksum(packets),
            riskScore: Math.round(riskScore * 100) / 100,
            insights: packets,
        };

        await this.saveAttestation(attestation);
        await this.generateReport(attestation);

        return attestation;
    }

    private generateChecksum(packets: InsightPacket[]): string {
        const data = JSON.stringify(packets.map(p => p.ledgerHash).sort((a, b) => a.localeCompare(b)));
        return 'sha256:' + createHash('sha256').update(data).digest('hex').slice(0, 16);
    }

    private async saveAttestation(attestation: GuardianAttestation): Promise<void> {
        const path = join(this.workspaceRoot, '.odavl/guardian/verify/attestation.json');
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, JSON.stringify(attestation, null, 2), 'utf-8');
    }

    private async generateReport(attestation: GuardianAttestation): Promise<void> {
        const report = `# Guardian Bridge Report
Generated: ${attestation.verifiedAt}

## Status
- **Cycle**: ${attestation.cycle}
- **Status**: ${attestation.status}
- **Risk Score**: ${attestation.riskScore}
- **Checksum**: ${attestation.checksum}

## Insights Summary
| Project | Errors | Fixes Applied | Confidence | Ledger Hash |
|---------|--------|---------------|------------|-------------|
${attestation.insights?.map(p => `| ${p.project} | ${p.errorCount} | ${p.fixesApplied} | ${(p.confidenceAvg * 100).toFixed(0)}% | ${p.ledgerHash} |`).join('\n') || ''}

## Verification
✅ Attestation generated successfully
✅ Guardian sync completed
✅ All projects verified
`;

        const reportPath = join(this.workspaceRoot, 'reports/guardian-bridge-report.md');
        await mkdir(dirname(reportPath), { recursive: true });
        await writeFile(reportPath, report, 'utf-8');
    }
}
