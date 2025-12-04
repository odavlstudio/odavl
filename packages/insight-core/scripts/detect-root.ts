import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { ChangeHistoryReader } from "../src/lib/root/ChangeHistoryReader";
import { CorrelationEngine } from "../src/lib/root/CorrelationEngine";
import { RootCauseDetector } from "../src/lib/root/RootCauseDetector";

void (async () => {
    try {
        const errorsPath = path.resolve(".odavl/insight/logs/errors.json");
        const errorsData = await readFile(errorsPath, "utf-8");
        const errors = JSON.parse(errorsData).slice(0, 5);

        const historyReader = new ChangeHistoryReader();
        const changes = await historyReader.getRecentChanges(10);

        const corrEngine = new CorrelationEngine();
        const allCorrelations = [];

        for (const err of errors) {
            const correlations = corrEngine.calculateCorrelations(err.file || "", changes);
            allCorrelations.push(...correlations);
        }

        const detector = new RootCauseDetector();
        const rootCauses = await detector.detectAll(allCorrelations);

        console.log("\n\x1b[36m🧠 Root Cause Detection Results:\x1b[0m");
        for (const rc of rootCauses) {
            console.log(`\n  \x1b[33m${rc.error}\x1b[0m`);
            console.log(`  Cause: ${rc.rootCause}`);
            console.log(`  Confidence: ${(rc.confidence * 100).toFixed(0)}%`);
            console.log(`  Suggestion: ${rc.suggestion}`);
        }

        const reportDir = path.resolve(".odavl/insight/reports");
        await mkdir(reportDir, { recursive: true });

        const markdown = [
            "# Root Cause Report",
            "",
            ...rootCauses.map((rc): string =>
                `## ${rc.error}\n- **Cause**: ${rc.rootCause}\n- **Confidence**: ${(rc.confidence * 100).toFixed(0)}%\n- **Suggestion**: ${rc.suggestion}`
            ),
        ].join("\n");

        await writeFile(path.join(reportDir, "root-report.md"), markdown);
        console.log(`\n\x1b[32m✓ Report saved to .odavl/insight/reports/root-report.md\x1b[0m\n`);
    } catch (error) {
        console.error("\x1b[31mError detecting root causes:\x1b[0m", error);
        process.exit(1);
    }
})();
