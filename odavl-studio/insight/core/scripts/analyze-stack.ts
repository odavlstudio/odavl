#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { StackAnalyzer } from "../src/lib/analyzer/StackAnalyzer";
import { StackReporter } from "../src/lib/analyzer/StackReporter";
import type { ParsedError } from "../src/error-parser";

void (async () => {
    console.log("🔍 ODAVL Insight Stack Analyzer\n");

    const logPath = path.join(process.cwd(), ".odavl/insight/logs/errors.json");

    try {
        const content = await fs.readFile(logPath, "utf-8");
        const errors: ParsedError[] = JSON.parse(content);

        const latest = errors.slice(-3);
        console.log(`📊 Analyzing ${latest.length} recent errors...\n`);

        const analyzer = new StackAnalyzer();
        const analysis = await analyzer.analyze(latest);

        const reporter = new StackReporter();
        for (const frame of analysis.frames) {
            reporter.printSummary(frame);
        }

        await reporter.generateReport(analysis.frames);

        console.log(`✅ Analysis complete!`);
        console.log(`📁 Frames saved: .odavl/insight/stack/frames.json`);
        console.log(`📄 Report saved: .odavl/insight/reports/stack-report.md\n`);
    } catch (error) {
        console.error("❌ Error:", (error as Error).message);
        process.exit(1);
    }
})();

