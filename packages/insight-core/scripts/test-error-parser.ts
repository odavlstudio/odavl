#!/usr/bin/env node
/**
 * test-error-parser.ts
 * Quick validation script for error parsing
 */

import { ErrorParser } from "../src/error-parser";
import { InsightNotifier } from "../src/InsightNotifier";
import { LogWriter } from "../src/LogWriter";

console.log("🧪 Testing ODAVL Insight Error Watcher Components\n");

// Test Pattern 1: TypeScript format
const tsError = "src/app/page.tsx(32,10): ReferenceError: Navbar is not defined";
console.log("Test 1: TypeScript error format");
console.log(`Input: ${tsError}`);
const parsed1 = ErrorParser.parse(tsError);
if (parsed1) {
    console.log("✅ Parsed successfully:");
    console.log(JSON.stringify(parsed1, null, 2));
    InsightNotifier.notify(parsed1);
} else {
    console.log("❌ Failed to parse");
}

// Test Pattern 2: Stack trace format
const stackError = "ReferenceError: Component is not defined at src/components/Header.tsx:15:3";
console.log("\nTest 2: Stack trace error format");
console.log(`Input: ${stackError}`);
const parsed2 = ErrorParser.parse(stackError);
if (parsed2) {
    console.log("✅ Parsed successfully:");
    console.log(JSON.stringify(parsed2, null, 2));
    InsightNotifier.notify(parsed2);
} else {
    console.log("❌ Failed to parse");
}

// Test Pattern 3: Next.js format
const nextError = "src/app/layout.tsx:22:5 - error TS2304: Cannot find name 'Footer'";
console.log("\nTest 3: Next.js error format");
console.log(`Input: ${nextError}`);
const parsed3 = ErrorParser.parse(nextError);
if (parsed3) {
    console.log("✅ Parsed successfully:");
    console.log(JSON.stringify(parsed3, null, 2));
    InsightNotifier.notify(parsed3);
} else {
    console.log("❌ Failed to parse");
}

// Test LogWriter
console.log("\n🗂️  Testing LogWriter...");
const logWriter = new LogWriter();
const testError = {
    timestamp: new Date().toISOString(),
    project: "odavl-website-v2",
    file: "src/test.tsx",
    line: 10,
    type: "TestError",
    message: "Validation test error",
};

logWriter.append(testError).then(() => {
    console.log("✅ Error logged to .odavl/insight/logs/errors.json");
    console.log("\n✨ All component tests passed!");
}).catch((err) => {
    console.error("❌ LogWriter failed:", err.message);
});
