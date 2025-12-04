#!/usr/bin/env tsx
/* global console */

/**
 * ODAVL Policy Validator
 * Validates auto-approval policy configuration for security compliance
 */

import process from "process";
import { validatePolicy } from "./src/policies/autoapprove.js";

console.log("🛡️ ODAVL Auto-Approval Policy Validator");
console.log("=====");

const validation = validatePolicy();

if (validation.valid) {
  console.log("✅ Policy validation: PASSED");
  console.log("📋 All security checks passed successfully");
  process.exit(0);
} else {
  console.log("❌ Policy validation: FAILED");
  console.log("📋 Security issues found:");
  
  for (const issue of validation.issues) {
    console.log(`  - ${issue}`);
  }
  
  console.log("");
  console.log("🔧 Please fix the policy issues before proceeding");
  process.exit(1);
}