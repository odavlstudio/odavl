import { promises as fs } from "node:fs";
import path from "node:path";
import type { StackFrame } from "./StackModel";
import { logger } from '../../utils/logger';

export class StackReporter {
    private readonly reportsDir: string;

    constructor(baseDir = ".odavl/insight/reports") {
        this.reportsDir = path.join(process.cwd(), baseDir);
    }

    printSummary(frame: StackFrame): void {
        const CYAN = "\x1b[36m";
        const YELLOW = "\x1b[33m";
        const RED = "\x1b[31m";
        const RESET = "\x1b[0m";
        const BOLD = "\x1b[1m";

        logger.debug(`\n${CYAN}🔍 [Insight Analyzer]${RESET}`);
        logger.debug(`${BOLD}File:${RESET} ${frame.file}`);
        if (frame.function) {
            logger.debug(`${BOLD}Function:${RESET} ${frame.function}`);
        }
        logger.debug(`${BOLD}Line:${RESET} ${YELLOW}${frame.line}${RESET}`);
        logger.debug(`${BOLD}Type:${RESET} ${RED}${frame.type}${RESET}`);
        logger.debug(`${BOLD}Message:${RESET} ${frame.message}\n`);
    }

    async generateReport(frames: StackFrame[]): Promise<void> {
        await fs.mkdir(this.reportsDir, { recursive: true });

        let markdown = "# 🔍 ODAVL Insight Stack Analysis Report\n\n";
        markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
        markdown += `**Total Frames:** ${frames.length}\n\n`;
        markdown += "---\n\n";

        for (const frame of frames) {
            markdown += this.formatFrame(frame);
        }

        const reportPath = path.join(this.reportsDir, "stack-report.md");
        await fs.writeFile(reportPath, markdown, "utf-8");
    }

    private formatFrame(frame: StackFrame): string {
        let md = `## 📍 ${frame.file}:${frame.line}\n\n`;
        if (frame.function) {
            md += `**Function:** \`${frame.function}\`\n\n`;
        }
        md += `**Type:** ${frame.type}\n\n`;
        md += `**Message:** ${frame.message}\n\n`;

        if (frame.context && frame.context.length > 0) {
            md += "**Context:**\n\n```typescript\n";
            md += frame.context.join("\n");
            md += "\n```\n\n";
        }

        md += `*Timestamp: ${frame.timestamp}*\n\n---\n\n`;
        return md;
    }
}
