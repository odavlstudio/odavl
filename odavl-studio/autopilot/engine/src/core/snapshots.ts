import * as fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export async function createSnapshot(paths: string[]) {
    const id = crypto.randomUUID();
    const root = process.cwd();
    const dir = path.join(root, ".odavl", "snapshots", id);

    try {
        await fsp.access(dir);
    } catch {
        await fsp.mkdir(dir, { recursive: true });
    }

    for (const p of paths) {
        try {
            await fsp.access(p);
            await fsp.copyFile(p, path.join(dir, path.basename(p)));
        } catch {
            // File doesn't exist, skip
        }
    }
    return id;
}

export async function restoreSnapshot(id: string) {
    const root = process.cwd();
    const dir = path.join(root, ".odavl", "snapshots", id);

    try {
        await fsp.access(dir);
    } catch {
        throw new Error(`Snapshot not found: ${id}`);
    }

    const files = await fsp.readdir(dir);
    for (const f of files) {
        const src = path.join(dir, f);
        const dest = path.join(root, f);
        await fsp.copyFile(src, dest);
    }
    console.log(`[ODAVL] Snapshot ${id} restored.`);
}
