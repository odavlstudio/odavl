/**
 * LogWriter.ts
 * Appends errors to .odavl/insight/logs/errors.json with rotation
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { ParsedError } from "./error-parser";

export class LogWriter {
    private readonly logPath: string;
    private readonly maxSizeBytes = 1024 * 1024; // 1MB

    constructor(baseDir = ".odavl/insight/logs") {
        this.logPath = path.join(process.cwd(), baseDir, "errors.json");
    }

    /**
     * Append error to log file, rotate if exceeds 1MB
     */
    async append(error: ParsedError): Promise<void> {
        await this.ensureLogDirectory();
        await this.rotateIfNeeded();

        const errors = await this.readErrors();
        errors.push(error);

        await fs.writeFile(this.logPath, JSON.stringify(errors, null, 2), "utf-8");
    }

    private async ensureLogDirectory(): Promise<void> {
        const dir = path.dirname(this.logPath);
        await fs.mkdir(dir, { recursive: true });
    }

    private async rotateIfNeeded(): Promise<void> {
        try {
            const stats = await fs.stat(this.logPath);
            if (stats.size >= this.maxSizeBytes) {
                const timestamp = Date.now();
                const archivePath = this.logPath.replace(".json", `-${timestamp}.json`);
                await fs.rename(this.logPath, archivePath);
            }
        } catch {
            // File doesn't exist yet, no rotation needed
        }
    }

    private async readErrors(): Promise<ParsedError[]> {
        try {
            const content = await fs.readFile(this.logPath, "utf-8");
            return JSON.parse(content);
        } catch {
            return [];
        }
    }
}
