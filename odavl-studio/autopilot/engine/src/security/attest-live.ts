import crypto from "crypto";
import * as fsp from "node:fs/promises";
import path from "path";
import { logger } from '../utils/Logger';

interface AttestationEntry {
    file: string;
    hash: string;
    timestamp: string;
    algorithm: string;
}

export async function liveAttest(filePath: string): Promise<string> {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

    try {
        await fsp.access(fullPath);
    } catch {
        throw new Error(`File not found: ${fullPath}`);
    }

    const content = await fsp.readFile(fullPath, "utf8");
    const hash = crypto.createHash("sha256").update(content).digest("hex");

    const entry: AttestationEntry = {
        file: filePath,
        hash: `sha256:${hash}`,
        timestamp: new Date().toISOString(),
        algorithm: "SHA-256"
    };

    const logPath = path.join(process.cwd(), ".odavl/security/logs/attest.log");
    const logDir = path.dirname(logPath);

    try {
        await fsp.access(logDir);
    } catch {
        await fsp.mkdir(logDir, { recursive: true });
    }

    await fsp.appendFile(logPath, JSON.stringify(entry) + "\n");
    logger.success(`✅ Attestation: ${entry.hash}`);

    return hash;
}

export async function getAttestationHistory(filePath: string): Promise<AttestationEntry[]> {
    const logPath = path.join(process.cwd(), ".odavl/security/logs/attest.log");

    try {
        await fsp.access(logPath);
    } catch {
        return [];
    }

    const content = await fsp.readFile(logPath, "utf8");
    const lines = content.split("\n").filter(Boolean);
    return lines
        .map(line => JSON.parse(line) as AttestationEntry)
        .filter(entry => entry.file === filePath);
}
