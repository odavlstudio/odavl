import { autoRecover } from "./recovery";

export async function handleOdavlError(snapshotId: string | null, err: unknown) {
    console.error(`[ODAVL] ❌ Error: ${(err as Error).message}`);
    if (snapshotId) {
        await autoRecover(snapshotId, err as Error);
    } else {
        console.error("[ODAVL] No snapshot found — cannot recover automatically.");
    }
    process.exit(1);
}
