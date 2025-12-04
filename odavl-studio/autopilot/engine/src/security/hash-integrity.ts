import * as fsp from "node:fs/promises";
import crypto from "crypto";
import path from "path";
import { logger } from '../utils/Logger';

export async function verifyIntegrity(filePath: string, expectedHash: string): Promise<boolean> {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

    try {
        await fsp.access(fullPath);
    } catch {
        logger.error(`❌ File not found: ${fullPath}`);
        return false;
    }

    const content = await fsp.readFile(fullPath, "utf8");
    const actualHash = crypto.createHash("sha256").update(content).digest("hex");

    // Support both with and without "sha256:" prefix
    const cleanExpected = expectedHash.replace(/^sha256:/i, "");
    const cleanActual = actualHash;

    const isValid = cleanActual === cleanExpected;

    if (isValid) {
        logger.success(`✅ Integrity verified: ${filePath}`);
    } else {
        logger.error(`❌ Integrity check failed: ${filePath}`);
        logger.error(`   Expected: sha256:${cleanExpected}`);
        logger.error(`   Actual:   sha256:${cleanActual}`);
        await logSecurityAlert(filePath, cleanExpected, cleanActual);
    }

    return isValid;
}

async function logSecurityAlert(file: string, expected: string, actual: string): Promise<void> {
    const alertPath = path.join(process.cwd(), ".odavl/security/logs/alerts.log");
    const alert = {
        type: "INTEGRITY_VIOLATION",
        file,
        expectedHash: `sha256:${expected}`,
        actualHash: `sha256:${actual}`,
        timestamp: new Date().toISOString(),
        severity: "HIGH"
    };

    await fsp.appendFile(alertPath, JSON.stringify(alert) + "\n");
}

export async function computeHash(filePath: string): Promise<string> {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    const content = await fsp.readFile(fullPath, "utf8");
    return crypto.createHash("sha256").update(content).digest("hex");
}
