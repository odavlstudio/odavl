import { Command } from "commander";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  loadCiConfig,
  loadCiConfigOrDefault,
  CiConfigError,
  type InsightCiConfig,
} from "@odavl-studio/insight-ci-config";

interface CiEnvironment {
  platform:
    | "github"
    | "gitlab"
    | "jenkins"
    | "generic"
    | "local";
  mode: "pr" | "main" | "nightly" | "unknown";
  branch?: string;
  isPullRequest: boolean;
  isScheduled: boolean;
}

/**
 * Detect CI platform and mode from environment variables.
 */
function detectCiEnvironment(): CiEnvironment {
  // GitHub Actions
  if (process.env.GITHUB_ACTIONS) {
    const eventName = process.env.GITHUB_EVENT_NAME;
    const ref = process.env.GITHUB_REF || "";
    const isPr = eventName === "pull_request";
    const isScheduled = eventName === "schedule";

    let mode: CiEnvironment["mode"] = "unknown";
    if (isPr) mode = "pr";
    else if (ref.includes("/main") || ref.includes("/master"))
      mode = "main";
    else if (isScheduled) mode = "nightly";

    return {
      platform: "github",
      mode,
      branch: process.env.GITHUB_REF_NAME,
      isPullRequest: isPr,
      isScheduled,
    };
  }

  // GitLab CI
  if (process.env.GITLAB_CI) {
    const pipelineSource = process.env.CI_PIPELINE_SOURCE;
    const branch = process.env.CI_COMMIT_BRANCH;
    const mrId = process.env.CI_MERGE_REQUEST_IID;
    const isPr = pipelineSource === "merge_request_event" || !!mrId;
    const isScheduled = pipelineSource === "schedule";

    let mode: CiEnvironment["mode"] = "unknown";
    if (isPr) mode = "pr";
    else if (branch === "main" || branch === "master") mode = "main";
    else if (isScheduled) mode = "nightly";

    return {
      platform: "gitlab",
      mode,
      branch,
      isPullRequest: isPr,
      isScheduled,
    };
  }

  // Jenkins
  if (process.env.JENKINS_URL || process.env.JENKINS_HOME) {
    const branch = process.env.BRANCH_NAME;
    const changeId = process.env.CHANGE_ID;
    const isPr = !!changeId;
    const isScheduled = false;

    let mode: CiEnvironment["mode"] = "unknown";
    if (isPr) mode = "pr";
    else if (branch === "main" || branch === "master") mode = "main";

    return {
      platform: "jenkins",
      mode,
      branch,
      isPullRequest: isPr,
      isScheduled,
    };
  }

  // Generic CI
  if (process.env.CI === "true") {
    return {
      platform: "generic",
      mode: "unknown",
      isPullRequest: false,
      isScheduled: false,
    };
  }

  // Local execution
  return {
    platform: "local",
    mode: "unknown",
    isPullRequest: false,
    isScheduled: false,
  };
}

/**
 * Find workspace root by looking for package.json or .git directory.
 */
function findWorkspaceRoot(): string {
  let current = process.cwd();
  const root = resolve("/");

  while (current !== root) {
    if (
      existsSync(resolve(current, "package.json")) ||
      existsSync(resolve(current, ".git"))
    ) {
      return current;
    }
    current = resolve(current, "..");
  }

  return process.cwd();
}

/**
 * Command: odavl insight ci verify
 */
async function ciVerify(): Promise<void> {
  const workspaceRoot = findWorkspaceRoot();
  console.log(`Workspace: ${workspaceRoot}\n`);

  try {
    const config = await loadCiConfig(workspaceRoot);

    if (!config) {
      console.log("✓ No insight-ci.config.json found");
      console.log(
        "\nInsight CI will use built-in defaults matching documented behavior:"
      );
      console.log("  - PR mode: Fail only on Critical issues");
      console.log("  - Main branch: Never blocks on quality");
      console.log("  - Nightly: Disabled by default");
      console.log(
        "\nTo make CI behavior explicit, create insight-ci.config.json"
      );
      console.log(
        "See: docs/ci/CI_CONFIG_REFERENCE.md or insight-ci.config.example.json"
      );
      process.exit(0);
    }

    console.log("✓ Configuration valid: insight-ci.config.json\n");

    console.log("Mode Configuration:");
    console.log(
      `  PR: ${config.modes.pr.enabled ? "Enabled" : "Disabled"}`
    );
    if (config.modes.pr.enabled) {
      console.log("    Fail on:");
      console.log(
        `      Critical: ${config.modes.pr.failOn.critical}`
      );
      console.log(`      High: ${config.modes.pr.failOn.high}`);
      console.log(`      Medium: ${config.modes.pr.failOn.medium}`);
      console.log(`      Low: ${config.modes.pr.failOn.low}`);
    }

    console.log(
      `  Main: ${config.modes.main.enabled ? "Enabled" : "Disabled"}`
    );
    console.log(
      `    Block on quality: ${config.modes.main.blockOnQuality} ✓`
    );

    console.log(
      `  Nightly: ${config.modes.nightly.enabled ? "Enabled" : "Disabled"}`
    );

    console.log("\nAnti-Pattern Guards:");
    console.log(
      `  Fail on legacy: ${config.antiPatterns.failOnLegacy} ✓`
    );
    console.log(
      `  Fail on Medium/Low: ${config.antiPatterns.failOnMediumOrLow} ✓`
    );
    console.log(
      `  Auto-upload without consent: ${config.antiPatterns.autoUploadWithoutConsent} ✓`
    );

    console.log(
      "\n✓ Configuration respects CI_PHILOSOPHY.md constraints"
    );
    process.exit(0);
  } catch (err: unknown) {
    if (err instanceof CiConfigError) {
      console.error(`✗ Configuration error (${err.code}):\n`);
      console.error(err.message);
      process.exit(1);
    }
    console.error("✗ Unexpected error:", err);
    process.exit(3);
  }
}

/**
 * Command: odavl insight ci doctor
 */
async function ciDoctor(options: { json?: boolean }): Promise<void> {
  const workspaceRoot = findWorkspaceRoot();
  const env = detectCiEnvironment();

  try {
    const config = await loadCiConfigOrDefault(workspaceRoot);

    // Analyze configuration consistency
    const issues: string[] = [];

    // Check: Main branch blocking
    if (config.modes.main.blockOnQuality) {
      issues.push(
        "CRITICAL: main.blockOnQuality is true. This violates CI_PHILOSOPHY.md."
      );
    }

    // Check: PR mode configured to fail on Medium/Low
    if (
      config.modes.pr.enabled &&
      (config.modes.pr.failOn.medium || config.modes.pr.failOn.low)
    ) {
      issues.push(
        "WARNING: PR mode fails on Medium or Low severity. This increases false positives."
      );
    }

    // Check: Anti-pattern violations
    if (config.antiPatterns.failOnLegacy) {
      issues.push(
        "ERROR: antiPatterns.failOnLegacy is true. This violates delta-first philosophy."
      );
    }

    if (options.json) {
      const diagnosis = {
        workspace: workspaceRoot,
        environment: env,
        config: {
          source: existsSync(
            resolve(workspaceRoot, "insight-ci.config.json")
          )
            ? "file"
            : "default",
          modes: config.modes,
          antiPatterns: config.antiPatterns,
        },
        issues,
        healthy: issues.length === 0,
      };
      console.log(JSON.stringify(diagnosis, null, 2));
    } else {
      console.log("=== ODAVL Insight CI Doctor ===\n");
      console.log(`Workspace: ${workspaceRoot}`);
      console.log(
        `Config source: ${existsSync(resolve(workspaceRoot, "insight-ci.config.json")) ? "insight-ci.config.json" : "built-in defaults"}\n`
      );

      console.log("CI Environment:");
      console.log(`  Platform: ${env.platform}`);
      console.log(`  Mode: ${env.mode}`);
      if (env.branch) console.log(`  Branch: ${env.branch}`);
      console.log(`  Pull request: ${env.isPullRequest}`);
      console.log(`  Scheduled: ${env.isScheduled}\n`);

      console.log("Active Configuration:");
      if (
        env.mode === "pr" &&
        config.modes.pr.enabled
      ) {
        console.log("  Mode: PR (delta analysis)");
        console.log("  Fail on:");
        console.log(
          `    Critical: ${config.modes.pr.failOn.critical}`
        );
        console.log(`    High: ${config.modes.pr.failOn.high}`);
        console.log(`    Medium: ${config.modes.pr.failOn.medium}`);
        console.log(`    Low: ${config.modes.pr.failOn.low}`);
      } else if (
        env.mode === "main" &&
        config.modes.main.enabled
      ) {
        console.log("  Mode: Main (baseline generation)");
        console.log(
          `  Block on quality: ${config.modes.main.blockOnQuality}`
        );
      } else if (
        env.mode === "nightly" &&
        config.modes.nightly.enabled
      ) {
        console.log("  Mode: Nightly (trend tracking)");
        console.log(
          `  Track trends: ${config.modes.nightly.trackTrends}`
        );
      } else {
        console.log(`  Mode: ${env.mode} (not explicitly configured)`);
      }

      if (issues.length > 0) {
        console.log("\n⚠ Configuration Issues:");
        issues.forEach((issue) => console.log(`  - ${issue}`));
        console.log(
          "\nSee: docs/ci/CI_CONFIG_REFERENCE.md for guidance"
        );
        process.exit(2);
      }

      console.log(
        "\n✓ Configuration is consistent with Insight CI philosophy"
      );
    }

    process.exit(issues.length > 0 ? 2 : 0);
  } catch (err: unknown) {
    if (err instanceof CiConfigError) {
      if (options.json) {
        console.log(
          JSON.stringify(
            {
              error: {
                code: err.code,
                message: err.message,
              },
            },
            null,
            2
          )
        );
      } else {
        console.error(`✗ Configuration error (${err.code}):\n`);
        console.error(err.message);
      }
      process.exit(1);
    }

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            error: {
              code: "UNKNOWN",
              message: String(err),
            },
          },
          null,
          2
        )
      );
    } else {
      console.error("✗ Unexpected error:", err);
    }
    process.exit(3);
  }
}

/**
 * Register CI commands with Commander.
 */
export function registerCiCommands(program: Command): void {
  const ci = program
    .command("ci")
    .description("CI configuration management and diagnostics");

  ci.command("verify")
    .description(
      "Verify insight-ci.config.json schema and CI_PHILOSOPHY.md compliance"
    )
    .action(ciVerify);

  ci.command("doctor")
    .description(
      "Diagnose CI environment and configuration consistency"
    )
    .option("--json", "Output diagnosis as JSON")
    .action(ciDoctor);
}
