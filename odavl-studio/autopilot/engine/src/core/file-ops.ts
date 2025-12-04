import * as fsp from "node:fs/promises";
import path from "node:path";

export async function safeApplyEdit(filePath: string, newContent: string) {
    try {
        await fsp.access(filePath);
    } catch {
        throw new Error(`Missing file: ${filePath}`);
    }

    const abs = path.resolve(filePath);
    const bak = abs + ".bak";
    await fsp.copyFile(abs, bak); // temp backup for rollback
    await fsp.writeFile(abs, newContent, "utf8");
}
