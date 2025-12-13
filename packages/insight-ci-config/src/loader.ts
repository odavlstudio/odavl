import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import {
  InsightCiConfigSchema,
  type InsightCiConfig,
  DEFAULT_CI_CONFIG,
} from "./schema.js";

/**
 * Config loading errors with precise context.
 */
export class CiConfigError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "FILE_NOT_FOUND"
      | "INVALID_JSON"
      | "SCHEMA_VALIDATION"
      | "UNKNOWN",
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "CiConfigError";
  }
}

/**
 * Load CI config from workspace root.
 *
 * @param workspaceRoot - Absolute path to workspace root
 * @returns Parsed config or null if file does not exist
 * @throws CiConfigError if JSON invalid or schema validation fails
 */
export async function loadCiConfig(
  workspaceRoot: string
): Promise<InsightCiConfig | null> {
  const configPath = join(workspaceRoot, "insight-ci.config.json");

  let rawContent: string;
  try {
    rawContent = await readFile(configPath, "utf-8");
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "ENOENT"
    ) {
      return null;
    }
    throw new CiConfigError(
      `Failed to read config file: ${configPath}`,
      "UNKNOWN",
      err
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch (err: unknown) {
    const syntaxErr = err as SyntaxError;
    throw new CiConfigError(
      `Invalid JSON in ${configPath}: ${syntaxErr.message}`,
      "INVALID_JSON",
      syntaxErr
    );
  }

  try {
    return InsightCiConfigSchema.parse(parsed);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const issues = err.errors
        .map((issue) => {
          const path = issue.path.join(".");
          return `  - ${path}: ${issue.message}`;
        })
        .join("\n");

      throw new CiConfigError(
        `Schema validation failed for ${configPath}:\n${issues}`,
        "SCHEMA_VALIDATION",
        err.errors
      );
    }
    throw new CiConfigError(
      `Unknown validation error for ${configPath}`,
      "UNKNOWN",
      err
    );
  }
}

/**
 * Load CI config or return defaults if not present.
 *
 * Defaults match current documented behavior:
 * - PR: Fail only on Critical issues
 * - Main: Never blocks on quality
 * - Nightly: Disabled by default
 *
 * @param workspaceRoot - Absolute path to workspace root
 * @returns Parsed config or DEFAULT_CI_CONFIG
 * @throws CiConfigError if config exists but is invalid
 */
export async function loadCiConfigOrDefault(
  workspaceRoot: string
): Promise<InsightCiConfig> {
  const config = await loadCiConfig(workspaceRoot);
  return config ?? DEFAULT_CI_CONFIG;
}

/**
 * Validate config without throwing.
 *
 * @param workspaceRoot - Absolute path to workspace root
 * @returns Validation result with success flag and error details
 */
export async function validateCiConfig(workspaceRoot: string): Promise<
  | { success: true; config: InsightCiConfig }
  | { success: false; error: CiConfigError }
> {
  try {
    const config = await loadCiConfig(workspaceRoot);
    if (!config) {
      return {
        success: true,
        config: DEFAULT_CI_CONFIG,
      };
    }
    return { success: true, config };
  } catch (err: unknown) {
    if (err instanceof CiConfigError) {
      return { success: false, error: err };
    }
    return {
      success: false,
      error: new CiConfigError(
        "Unknown validation error",
        "UNKNOWN",
        err
      ),
    };
  }
}
