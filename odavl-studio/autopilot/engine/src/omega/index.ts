// CLI entry point for Omega snapshot system
if (import.meta.url === `file://${process.argv[1]}`) {
    const command = process.argv[2];

    if (command === "snapshot") {
        import("./snapshot.js");
    } else if (command === "summary") {
        import("./generate-summary.js");
    } else if (command === "all") {
        console.log("🧩 Running complete Omega sequence...\n");
        await import("./snapshot.js");
        await import("./generate-summary.js");
        console.log("\n✅ Omega sequence complete!");
    } else {
        console.log(`
ODAVL Omega CLI

Usage:
  tsx apps/cli/src/omega/index.ts <command>

Commands:
  snapshot  - Create system snapshot with SHA-256 hashes
  summary   - Create markdown summary report
  all       - Run complete sequence (snapshot → summary)
    `);
    }
}
