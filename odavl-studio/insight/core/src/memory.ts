import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { logLearning } from "./learn";
import { getRepoRoot } from "./utils/getRepoRoot";

const memoryPath = path.join(getRepoRoot(), ".odavl/insight/memory.json");

export interface MemoryRecord {
    hash: string;
    message: string;
    category: string;
    firstSeen: string;
    lastSeen: string;
    count: number;
    fixHint?: string;
}

export function generateHash(message: string, category: string) {
    return crypto.createHash("sha256").update(`${message}-${category}`).digest("hex").slice(0, 16);
}

export async function loadMemory(): Promise<Record<string, MemoryRecord>> {
    if (!fs.existsSync(memoryPath)) return {};
    const raw = await fs.promises.readFile(memoryPath, "utf8");
    return JSON.parse(raw);
}

export async function saveMemory(data: Record<string, MemoryRecord>) {
    await fs.promises.mkdir(path.dirname(memoryPath), { recursive: true });
    await fs.promises.writeFile(memoryPath, JSON.stringify(data, null, 2), "utf8");
}

export async function memorize(error: { message: string; category: string; fixHint?: string }) {
    const memory = await loadMemory();
    const hash = generateHash(error.message, error.category);
    const now = new Date().toISOString();

    if (memory[hash]) {
        memory[hash].lastSeen = now;
        memory[hash].count += 1;
        // Log learning on recurrence
        await logLearning({
            date: now.slice(0, 10),
            type: error.category,
            rootCause: error.message.slice(0, 60),
            fixHint: error.fixHint || "-"
        });
    } else {
        memory[hash] = {
            hash,
            message: error.message.slice(0, 200),
            category: error.category,
            firstSeen: now,
            lastSeen: now,
            count: 1,
            fixHint: error.fixHint,
        };
    }

    await saveMemory(memory);
    return memory[hash];
}
