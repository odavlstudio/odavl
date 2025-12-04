import { execSync } from "child_process";

console.log("🧩 Testing Omega Snapshot System\n");

try {
    console.log("1️⃣ Creating snapshot...");
    execSync("pnpm tsx apps/cli/src/omega/snapshot.ts", { stdio: "inherit" });

    console.log("\n2️⃣ Generating attestation...");
    execSync("pnpm tsx .odavl/omega/attest-omega.ts", { stdio: "inherit" });

    console.log("\n3️⃣ Creating summary report...");
    execSync("pnpm tsx apps/cli/src/omega/generate-summary.ts", {
        stdio: "inherit",
    });

    console.log("\n✅ All Omega tests passed!");
} catch (error) {
    console.error("\n❌ Omega test failed:", error);
    process.exit(1);
}
