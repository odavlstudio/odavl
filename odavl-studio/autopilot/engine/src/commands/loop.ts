import { runOdavlLoop } from "../core/odavl-loop";
import { writeLedger } from "../core/ledger";
import { watch } from "node:fs";

async function runSingleLoop(planPath?: string): Promise<boolean> {
    try {
        const ctx = await runOdavlLoop(planPath);

        await writeLedger(ctx.runId, {
            startedAt: ctx.startedAt,
            planPath: ctx.planPath ?? null,
            notes: ctx.notes,
        });

        const verifyResult = ctx.notes.verify as { gatesPassed?: boolean } | undefined;
        return verifyResult?.gatesPassed ?? false;
    } catch (error) {
        console.error("[ODAVL Loop] Error:", error);
        return false;
    }
}

async function watchMode(planPath?: string) {
    console.log("\n🔁 ODAVL Watch Mode - Monitoring workspace for changes...\n");
    console.log("Press Ctrl+C to stop\n");

    // Initial run
    await runSingleLoop(planPath);

    // Watch for file changes
    const watchDir = process.cwd();
    const watcher = watch(watchDir, { recursive: true }, async (_eventType, filename) => {
        if (!filename) return;

        // Ignore common non-source files
        const ignored = [
            'node_modules',
            '.git',
            'dist',
            '.odavl',
            'reports',
            '.next',
            'out'
        ];

        if (ignored.some(dir => filename.includes(dir))) {
            return;
        }

        // Only run on TypeScript/JavaScript files
        if (!/\.(ts|tsx|js|jsx)$/.test(filename)) {
            return;
        }

        console.log(`\n📝 File changed: ${filename}`);
        console.log("⏳ Running ODAVL loop...\n");

        await runSingleLoop(planPath);
    });

    // Keep process alive
    process.on('SIGINT', () => {
        console.log("\n\n👋 Stopping watch mode...");
        watcher.close();
        process.exit(0);
    });
}

async function main() {
    const args = process.argv.slice(2);
    const watchFlag = args.includes("--watch") || args.includes("-w");
    const planFlag = args.find((arg) => arg.startsWith("--plan="));
    const planPath = planFlag ? planFlag.split("=")[1] : undefined;

    if (watchFlag) {
        await watchMode(planPath);
    } else {
        const success = await runSingleLoop(planPath);
        process.exit(success ? 0 : 1);
    }
}

void main().catch((e) => {
    console.error(e);
    process.exit(1);
});
