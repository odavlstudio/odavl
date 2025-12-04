#!/usr/bin/env tsx
import { LiveNotifier } from "../src/lib/notifier/LiveNotifier";
import { NotifierCLI } from "../src/lib/notifier/NotifierCLI";
import { existsSync } from "node:fs";

const suggestionsFile = ".odavl/insight/fixes/suggestions.json";

if (!existsSync(suggestionsFile)) {
    console.error(
        "❌ suggestions.json not found. Run 'pnpm insight:fix' first."
    );
    process.exit(1);
}

const notifier = new LiveNotifier();
const cli = new NotifierCLI();

await notifier.initialize();

console.log("🔴 Insight Live Notifier running...");
console.log(`   Watching: ${suggestionsFile}`);
console.log("   Press Ctrl+C to stop.\n");

notifier.watch((notification) => {
    cli.printNotification(notification);
});

process.on("SIGINT", () => {
    console.log("\n✓ Stopped");
    process.exit(0);
});

