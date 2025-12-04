#!/usr/bin/env node
import { checkLockdown } from "./lockdown.js";

console.log("\n🔐 ODAVL Security Lockdown Status Check\n");
const config = checkLockdown();
console.log("\nConfiguration:", JSON.stringify(config, null, 2));
