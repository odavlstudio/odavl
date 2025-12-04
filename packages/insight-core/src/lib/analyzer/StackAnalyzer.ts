import { promises as fs } from "node:fs";
import path from "node:path";
import type { StackFrame, StackAnalysis } from "./StackModel";
import type { ParsedError } from "../../error-parser";

export class StackAnalyzer {
    private readonly stackDir: string;

    constructor(baseDir = ".odavl/insight/stack") {
        this.stackDir = path.join(process.cwd(), baseDir);
    }

    async analyze(errors: ParsedError[]): Promise<StackAnalysis> {
        const frames: StackFrame[] = [];

        for (const error of errors) {
            const frame = await this.parseErrorToFrame(error);
            frames.push(frame);
        }

        const analysis: StackAnalysis = {
            frames,
            totalFrames: frames.length,
            analyzedAt: new Date().toISOString(),
        };

        await this.saveFrames(analysis);
        return analysis;
    }

    private async parseErrorToFrame(error: ParsedError): Promise<StackFrame> {
        const context = await this.extractContext(error.file, error.line);

        return {
            file: error.file,
            line: error.line,
            type: error.type,
            message: error.message,
            context,
            timestamp: error.timestamp,
        };
    }

    private async extractContext(file: string, line: number): Promise<string[]> {
        try {
            const filePath = path.join(process.cwd(), file);
            const content = await fs.readFile(filePath, "utf-8");
            const lines = content.split("\n");
            const start = Math.max(0, line - 3);
            const end = Math.min(lines.length, line + 2);
            return lines.slice(start, end);
        } catch {
            return [];
        }
    }

    private async saveFrames(analysis: StackAnalysis): Promise<void> {
        await fs.mkdir(this.stackDir, { recursive: true });
        const framesPath = path.join(this.stackDir, "frames.json");
        await fs.writeFile(framesPath, JSON.stringify(analysis, null, 2), "utf-8");
    }
}
