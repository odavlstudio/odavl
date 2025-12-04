import { writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

interface LedgerEntry {
    file: string;
    fix: string;
    confidence: number;
    status: string;
    timestamp: string;
    signature?: string;
}

export class AutoFixLedger {
    private readonly ledgerPath = '.odavl/insight/fixes/ledger.json';
    private entries: LedgerEntry[] = [];

    async record(entry: LedgerEntry): Promise<void> {
        const signature = this.generateSignature(entry);
        this.entries.push({ ...entry, signature });

        if (this.entries.length > 50) {
            this.entries = this.entries.slice(-50);
        }

        await this.save();
    }

    private generateSignature(entry: LedgerEntry): string {
        const data = `${entry.file}${entry.fix}${entry.timestamp}`;
        return createHash('sha256').update(data).digest('hex').slice(0, 16);
    }

    private async save(): Promise<void> {
        const data = JSON.stringify(this.entries, null, 2);
        await writeFile(this.ledgerPath, data, 'utf-8');
    }

    async load(): Promise<void> {
        try {
            const data = await readFile(this.ledgerPath, 'utf-8');
            this.entries = JSON.parse(data);
        } catch {
            this.entries = [];
        }
    }
}
