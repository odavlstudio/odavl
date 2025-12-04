/**
 * Report generation utilities for smoke-collective.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

/**
 * Build markdown report sections
 */
export class ReportBuilder {
    private lines: string[] = [];

    addHeader(title: string, timestamp: number) {
        this.lines.push(`# ${title}`);
        this.lines.push(`\nRun: ${new Date(timestamp).toISOString()}\n`);
    }

    addSection(title: string, level = 2) {
        this.lines.push(`${'#'.repeat(level)} ${title}\n`);
    }

    addCodeBlock(content: string, language = "json") {
        this.lines.push(`\`\`\`${language}`);
        this.lines.push(content);
        this.lines.push("```\n");
    }

    addJsonBlock(data: unknown) {
        this.addCodeBlock(JSON.stringify(data, null, 2));
    }

    addText(text: string) {
        this.lines.push(text);
    }

    addError(message: string) {
        this.lines.push(`❌ ${message}\n`);
    }

    addSuccess(message: string) {
        this.lines.push(`✅ ${message}\n`);
    }

    addBullet(text: string) {
        this.lines.push(`- ${text}`);
    }

    getReport(): string {
        return this.lines.join("\n");
    }

    save(timestamp: number) {
        const dir = join(process.cwd(), "reports", "collective");
        mkdirSync(dir, { recursive: true });
        const path = join(dir, `run-${timestamp}.md`);
        writeFileSync(path, this.getReport());
        return path;
    }
}
