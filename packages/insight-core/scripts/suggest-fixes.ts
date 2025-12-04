import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { FixAdvisor } from "../src/lib/fix/FixAdvisor";

void (async () => {
    try {
        const causesPath = path.resolve(".odavl/insight/root/causes.json");

        const advisor = new FixAdvisor();
        const suggestions = await advisor.generateSuggestions(causesPath);

        console.log("\n\x1b[36m🧩 Insight Fix Advisor\x1b[0m");

        for (const sug of suggestions) {
            console.log(`\n  \x1b[33m${sug.error}\x1b[0m`);
            console.log(`  Suggestion: ${sug.suggestion}`);
            console.log(`  \x1b[32m✅ Confidence: ${(sug.confidence * 100).toFixed(0)}%\x1b[0m`);
        }

        const reportDir = path.resolve(".odavl/insight/reports");
        await mkdir(reportDir, { recursive: true });

        const markdown = [
            "# Fix Suggestions Report",
            "",
            ...suggestions.map((s): string =>
                `## ${s.error}\n- **Suggestion**: ${s.suggestion}\n- **Confidence**: ${(s.confidence * 100).toFixed(0)}%`
            ),
        ].join("\n");

        await writeFile(path.join(reportDir, "fix-report.md"), markdown);
        console.log(`\n\x1b[32m✓ Report saved to .odavl/insight/reports/fix-report.md\x1b[0m\n`);
    } catch (error) {
        console.error("\x1b[31mError generating fix suggestions:\x1b[0m", error);
        process.exit(1);
    }
})();
