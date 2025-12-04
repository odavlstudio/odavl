import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import type { InsightPacket } from './BridgeProtocol';

export class GuardianBridge {
    constructor(private readonly workspaceRoot: string) { }

    async buildPacket(project: string): Promise<InsightPacket> {
        const errorCount = await this.getErrorCount();
        const fixesApplied = await this.getFixesApplied();
        const confidenceAvg = await this.getAvgConfidence();
        const ledgerHash = await this.getLedgerHash();

        return {
            project,
            errorCount,
            fixesApplied,
            confidenceAvg,
            timestamp: new Date().toISOString(),
            ledgerHash,
        };
    }

    private async getErrorCount(): Promise<number> {
        try {
            const path = join(this.workspaceRoot, '.odavl/insight/errors/errors.json');
            const data = await readFile(path, 'utf-8');
            const errors = JSON.parse(data);
            return Array.isArray(errors) ? errors.length : 0;
        } catch {
            return 0;
        }
    }

    private async getFixesApplied(): Promise<number> {
        try {
            const path = join(this.workspaceRoot, '.odavl/insight/fixes/ledger.json');
            const data = await readFile(path, 'utf-8');
            const ledger = JSON.parse(data);
            return Array.isArray(ledger) ? ledger.filter(e => e.status === 'applied').length : 0;
        } catch {
            return 0;
        }
    }

    private async getAvgConfidence(): Promise<number> {
        try {
            const path = join(this.workspaceRoot, '.odavl/insight/fixes/suggestions.json');
            const data = await readFile(path, 'utf-8');
            const suggestions = JSON.parse(data);
            if (!Array.isArray(suggestions) || suggestions.length === 0) return 0;
            const total = suggestions.reduce((sum, s) => sum + (s.confidence || 0), 0);
            return total / suggestions.length;
        } catch {
            return 0;
        }
    }

    private async getLedgerHash(): Promise<string> {
        try {
            const path = join(this.workspaceRoot, '.odavl/insight/fixes/ledger.json');
            const data = await readFile(path, 'utf-8');
            return createHash('sha256').update(data).digest('hex').slice(0, 16);
        } catch {
            return '0000000000000000';
        }
    }
}
