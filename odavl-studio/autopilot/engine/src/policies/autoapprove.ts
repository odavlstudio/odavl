/**
 * ODAVL Auto-Approval Engine
 * Evaluates commands against policy rules for automatic vs manual approval
 * @fileoverview Auto-approval logic with safety guarantees
 */

import * as fsp from "node:fs/promises";
import * as path from "node:path";
import yaml from "js-yaml";

/**
 * Policy rule definition for command approval
 */
export interface PolicyRule {
  pattern: string;
  reason: string;
  safetyLevel: "critical" | "high" | "medium" | "low";
}

/**
 * Auto-approval policy configuration
 */
export interface AutoApprovalPolicy {
  version: string;
  safetyLevel: string;
  allow: PolicyRule[];
  deny: PolicyRule[];
  default: {
    action: "allow" | "deny";
    reason: string;
    safetyLevel: string;
    requireApproval: boolean;
  };
  logging: {
    includeReason: boolean;
    logLevel: string;
    auditTrail: boolean;
  };
}

/**
 * Result of auto-approval evaluation
 */
export interface ApprovalResult {
  approved: boolean;
  safetyReason: "allow" | "deny" | "unknown";
  rule?: PolicyRule;
  defaultApplied: boolean;
  requiresManualApproval: boolean;
}

/**
 * Loads the auto-approval policy from .odavl/autoapprove.yml
 * 
 * @returns Auto-approval policy configuration or default policy if file doesn't exist
 */
async function loadAutoApprovalPolicy(): Promise<AutoApprovalPolicy> {
  const ROOT = process.cwd();
  // Look for the policy file starting from current directory and going up
  let policyPath = path.join(ROOT, ".odavl", "autoapprove.yml");

  // If not found in current directory, try parent directories (for monorepo)
  try {
    await fsp.access(policyPath);
  } catch {
    const parentRoot = path.join(ROOT, "..", "..");
    policyPath = path.join(parentRoot, ".odavl", "autoapprove.yml");
  }



  try {
    await fsp.access(policyPath);
  } catch {
    // Return default restrictive policy
    return {
      version: "1.0",
      safetyLevel: "enterprise",
      allow: [],
      deny: [],
      default: {
        action: "deny",
        reason: "No auto-approval policy configured",
        safetyLevel: "unknown",
        requireApproval: true
      },
      logging: {
        includeReason: true,
        logLevel: "info",
        auditTrail: true
      }
    };
  }

  try {
    const policyContent = await fsp.readFile(policyPath, "utf8");
    return yaml.load(policyContent) as AutoApprovalPolicy;
  } catch (error) {
    console.error(`Failed to load auto-approval policy: ${error}`);
    // Return restrictive default on parsing error
    return {
      version: "1.0",
      safetyLevel: "enterprise",
      allow: [],
      deny: [],
      default: {
        action: "deny",
        reason: "Policy file parsing failed",
        safetyLevel: "unknown",
        requireApproval: true
      },
      logging: {
        includeReason: true,
        logLevel: "info",
        auditTrail: true
      }
    };
  }
}

/**
 * Evaluates a command against auto-approval policy rules
 * 
 * @param command - The command string to evaluate
 * @returns ApprovalResult with approval decision and reasoning
 * 
 * @example
 * ```typescript
 * import { evaluateCommandApproval } from './autoapprove.js';
 * 
 * // Safe command - should be approved
 * const result1 = evaluateCommandApproval("pnpm list");
 * console.log(result1.approved); // true
 * console.log(result1.safetyReason); // "allow"
 * 
 * // Dangerous command - should be denied
 * const result2 = evaluateCommandApproval("rm -rf /");
 * console.log(result2.approved); // false
 * console.log(result2.safetyReason); // "deny"
 * 
 * // Unknown command - uses default policy
 * const result3 = evaluateCommandApproval("unknown-command");
 * console.log(result3.approved); // false (default deny)
 * console.log(result3.safetyReason); // "unknown"
 * console.log(result3.defaultApplied); // true
 * ```
 */
export async function evaluateCommandApproval(command: string): Promise<ApprovalResult> {
  const policy = await loadAutoApprovalPolicy();
  const trimmedCommand = command.trim();

  // First check deny rules (higher priority)
  for (const rule of policy.deny) {
    const regex = new RegExp(rule.pattern, "i");
    if (regex.test(trimmedCommand)) {
      return {
        approved: false,
        safetyReason: "deny",
        rule,
        defaultApplied: false,
        requiresManualApproval: true
      };
    }
  }

  // Then check allow rules
  for (const rule of policy.allow) {
    const regex = new RegExp(rule.pattern, "i");
    if (regex.test(trimmedCommand)) {
      return {
        approved: true,
        safetyReason: "allow",
        rule,
        defaultApplied: false,
        requiresManualApproval: false
      };
    }
  }

  // Apply default policy
  const defaultRule: PolicyRule = {
    pattern: ".*",
    reason: policy.default.reason,
    safetyLevel: policy.default.safetyLevel as "critical" | "high" | "medium" | "low"
  };

  return {
    approved: policy.default.action === "allow",
    safetyReason: "unknown",
    rule: defaultRule,
    defaultApplied: true,
    requiresManualApproval: policy.default.requireApproval
  };
}

/**
 * Logs auto-approval decision with enhanced traceability
 * 
 * @param command - The evaluated command
 * @param result - The approval result
 * @param phase - The ODAVL phase requesting approval
 */
export async function logApprovalDecision(command: string, result: ApprovalResult, phase: string = "DECIDE") {
  const policy = await loadAutoApprovalPolicy();
  const isJsonMode = process.argv.includes("--json");

  if (!policy.logging.includeReason) {
    return; // Logging disabled
  }

  const logData = {
    command: command.trim(),
    approved: result.approved,
    safetyReason: result.safetyReason,
    reason: result.rule?.reason || "No matching rule found",
    defaultApplied: result.defaultApplied,
    requiresManualApproval: result.requiresManualApproval,
    timestamp: new Date().toISOString()
  };

  if (isJsonMode) {
    console.log(JSON.stringify({
      type: "doctor",
      status: result.approved ? "success" : "error",
      data: {
        phase,
        msg: `Command auto-approval: ${result.approved ? "APPROVED" : "DENIED"}`,
        approval: logData
      }
    }));
  } else {
    const status = result.approved ? "✅" : "❌";
    const reason = result.rule?.reason || "Default policy applied";
    console.log(`[${phase}] ${status} Auto-approval: ${result.approved ? "APPROVED" : "DENIED"} - ${reason} (safetyReason: ${result.safetyReason})`);

    if (policy.logging.logLevel === "debug") {
      console.log(`[${phase}] Command: "${command}"`);
      console.log(`[${phase}] Pattern matched: ${result.rule?.pattern || "none"}`);
      console.log(`[${phase}] Default applied: ${result.defaultApplied}`);
    }
  }

  // Write audit trail if enabled

  if (policy.logging.auditTrail) {
    await writeAuditTrail(logData);
  }
}/**
 * Writes audit trail for auto-approval decisions
 * 
 * @param logData - The approval decision data to audit
 */
async function writeAuditTrail(logData: Record<string, unknown>) {
  const ROOT = process.cwd();
  const auditDir = path.join(ROOT, ".odavl", "audit");
  const auditFile = path.join(auditDir, "autoapproval.jsonl");

  // Ensure audit directory exists
  try {
    await fsp.access(auditDir);
  } catch {
    await fsp.mkdir(auditDir, { recursive: true });
  }

  // Append to audit log (JSONL format)
  const auditEntry = JSON.stringify({
    ...logData,
    sessionId: process.env.ODAVL_SESSION_ID || "unknown",
    pid: process.pid
  }) + "\n";

  try {
    await fsp.appendFile(auditFile, auditEntry);
  } catch (error) {
    console.error(`Failed to write audit trail: ${error}`);
  }
}

/**
 * Validates the auto-approval policy configuration for security compliance
 * 
 * @returns Validation result with any security issues found
 */
export async function validatePolicy(): Promise<{ valid: boolean; issues: string[] }> {
  const issues: string[] = [];

  try {
    const policy = await loadAutoApprovalPolicy();

    // Check for overly permissive allow rules
    for (const rule of policy.allow) {
      if (rule.pattern === ".*" || rule.pattern === ".+") {
        issues.push(`Overly permissive allow rule: "${rule.pattern}"`);
      }

      // Check for dangerous patterns in allow rules
      const dangerousPatterns = ["rm", "delete", "remove", "kill", "format"];
      for (const dangerous of dangerousPatterns) {
        if (rule.pattern.toLowerCase().includes(dangerous.toLowerCase())) {
          issues.push(`Potentially dangerous pattern in allow rule: "${rule.pattern}"`);
        }
      }
    }

    // Ensure critical deny rules exist
    const requiredDenyPatterns = ["rm", "Remove-Item", "del", "format"];

    for (const required of requiredDenyPatterns) {
      const hasDenyRule = policy.deny.some((rule: PolicyRule) => {
        // More flexible pattern matching - check if the dangerous command is mentioned
        const pattern = rule.pattern.toLowerCase();
        const command = required.toLowerCase();
        return pattern.includes(command) || pattern.includes(`\\b${command}\\b`);
      });
      if (!hasDenyRule) {
        issues.push(`Missing critical deny rule for: ${required}`);
      }
    }

    // Check default policy safety
    if (policy.default.action === "allow" && !policy.default.requireApproval) {
      issues.push("Default policy allows all commands without approval - security risk");
    }

  } catch (error) {
    issues.push(`Policy validation failed: ${error}`);
  }

  return {
    valid: issues.length === 0,
    issues
  };
}