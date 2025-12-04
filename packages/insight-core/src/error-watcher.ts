/**
 * error-watcher.ts
 * Watches odavl-website-v2 project and captures runtime/build errors
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { ErrorParser } from "./error-parser";
import { InsightNotifier } from "./InsightNotifier";
import { LogWriter } from "./LogWriter";
import { logger } from './utils/logger';

export class ErrorWatcher {
    private readonly projectPath: string;
    private readonly logWriter: LogWriter;

    constructor(projectName = "odavl-website-v2") {
        this.projectPath = path.join(process.cwd(), "apps", projectName);
        this.logWriter = new LogWriter();
    }

    /**
     * Start watching for errors by running pnpm dev
     */
    start(): void {
        logger.debug("🌀 ODAVL Insight Error Watcher started");
        logger.debug(`📁 Monitoring: ${this.projectPath}\n`);

        const devProcess = spawn("pnpm", ["dev"], {
            cwd: this.projectPath,
            shell: true,
        });

        devProcess.stderr.on("data", (data) => {
            const errorText = data.toString();
            this.handleError(errorText);
        });

        devProcess.stdout.on("data", (data) => {
            // Also check stdout for error patterns
            const output = data.toString();
            if (this.looksLikeError(output)) {
                this.handleError(output);
            }
        });

        devProcess.on("error", (err) => {
            logger.error("❌ Failed to start dev server:", err.message);
        });

        process.on("SIGINT", () => {
            logger.debug("\n🛑 Stopping error watcher...");
            devProcess.kill();
            process.exit(0);
        });
    }

    private handleError(errorText: string): void {
        const parsed = ErrorParser.parse(errorText);

        if (parsed) {
            InsightNotifier.notify(parsed);
            this.logWriter.append(parsed).catch((err) => {
                logger.error("Failed to write log:", err.message);
            });
        }
    }

    private looksLikeError(text: string): boolean {
        return /error|exception|failed|cannot|undefined/i.test(text);
    }
}
