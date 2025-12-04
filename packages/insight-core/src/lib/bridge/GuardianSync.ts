import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { InsightPacket, SyncState } from './BridgeProtocol';

export class GuardianSync {
    constructor(private readonly workspaceRoot: string) { }

    async syncPackets(packets: InsightPacket[]): Promise<SyncState> {
        try {
            const syncPath = join(this.workspaceRoot, '.odavl/guardian/verify/insight-sync.json');
            await mkdir(dirname(syncPath), { recursive: true });

            const syncData = {
                synced: new Date().toISOString(),
                packets,
                count: packets.length,
            };

            await writeFile(syncPath, JSON.stringify(syncData, null, 2), 'utf-8');

            return {
                success: true,
                timestamp: new Date().toISOString(),
                packetsSent: packets.length,
            };
        } catch (err) {
            return {
                success: false,
                timestamp: new Date().toISOString(),
                packetsSent: 0,
                error: String(err),
            };
        }
    }

    async logSync(state: SyncState): Promise<void> {
        const logPath = join(this.workspaceRoot, '.odavl/guardian/verify/sync.log');
        await mkdir(dirname(logPath), { recursive: true });

        const logEntry = `[${state.timestamp}] ${state.success ? 'SUCCESS' : 'FAILED'}: ${state.packetsSent} packets${state.error ? ` - ${state.error}` : ''}\n`;

        try {
            await writeFile(logPath, logEntry, { flag: 'a', encoding: 'utf-8' });
        } catch {
            // Ignore log write failures
        }
    }
}
