import { restoreSnapshot } from "./snapshots";
import { writeLedger } from "./ledger";

export async function autoRecover(snapshotId: string, error: Error) {
    console.log(`[ODAVL] Recovery triggered for snapshot ${snapshotId}`);
    try {
        restoreSnapshot(snapshotId);
        const log = {
            snapshotId,
            recoveredAt: new Date().toISOString(),
            reason: error.message,
            status: "recovered",
        };
        writeLedger(snapshotId, log);
        console.log(`[ODAVL] Snapshot ${snapshotId} restored successfully.`);
        return true;
    } catch (e) {
        console.error(`[ODAVL] Recovery failed: ${(e as Error).message}`);
        writeLedger(snapshotId, { status: "failed", error: (e as Error).message });
        return false;
    }
}
