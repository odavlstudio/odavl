import { promises as fs } from "node:fs";
import path from "node:path";
import type { GridPacket } from "./GridProtocol";
import { GridProtocol } from "./GridProtocol";
import { TrustRegistry } from "./TrustRegistry";

interface SyncLog {
    timestamp: string;
    peersSynced: number;
    packetsReceived: number;
    packetsVerified: number;
    packetsFailed: number;
}

export class SyncService {
    private readonly protocol: GridProtocol;
    private readonly trustRegistry: TrustRegistry;
    private readonly syncLogDir: string;

    constructor(trustRegistry: TrustRegistry, basePath: string = ".odavl/grid") {
        this.protocol = new GridProtocol();
        this.trustRegistry = trustRegistry;
        this.syncLogDir = path.join(process.cwd(), basePath);
    }

    async sync(nodeId: string, publicKey: string): Promise<SyncLog> {
        const peers = await this.fetchPeers();
        let packetsReceived = 0;
        let packetsVerified = 0;
        let packetsFailed = 0;

        for (const peer of peers) {
            const packets = await this.exchangeWithPeer(peer);
            packetsReceived += packets.length;

            for (const packet of packets) {
                const dataToVerify = JSON.stringify({
                    nodeId: packet.nodeId,
                    timestamp: packet.timestamp,
                    type: packet.type,
                    payload: packet.payload,
                });

                const isValid = await this.protocol.verifyMessage(packet.signature, dataToVerify, publicKey);

                if (isValid) {
                    packetsVerified += 1;
                    this.trustRegistry.recordVerifiedPacket(packet.nodeId);
                } else {
                    packetsFailed += 1;
                    this.trustRegistry.recordInvalidPacket(packet.nodeId);
                }
            }
        }

        const log: SyncLog = {
            timestamp: new Date().toISOString(),
            peersSynced: peers.length,
            packetsReceived,
            packetsVerified,
            packetsFailed,
        };

        await this.saveSyncLog(log);
        await this.trustRegistry.save();

        return log;
    }

    private async fetchPeers(): Promise<string[]> {
        // Mock: return empty array for now (would fetch from registry)
        return [];
    }

    private async exchangeWithPeer(_peer: string): Promise<GridPacket[]> {
        // Mock: return empty array (would exchange via API)
        return [];
    }

    private async saveSyncLog(log: SyncLog): Promise<void> {
        await fs.mkdir(this.syncLogDir, { recursive: true });
        const filename = `sync-log-${Date.now()}.json`;
        const filepath = path.join(this.syncLogDir, filename);
        await fs.writeFile(filepath, JSON.stringify(log, null, 2));
    }
}
