import { z } from "zod";

/**
 * ODAVL Insight CI Configuration Schema
 *
 * Defines CI behavior for all platforms (GitHub Actions, GitLab CI, Jenkins, POSIX).
 * Enforces CI_PHILOSOPHY.md constraints at the type level.
 */

const SeverityLevelSchema = z.object({
  description: z.string().min(1),
});

const FailOnSchema = z.object({
  critical: z.boolean().default(true),
  high: z.boolean().default(false),
  medium: z.boolean().default(false),
  low: z.boolean().default(false),
});

const DetectorFilterSchema = z
  .object({
    include: z.array(z.string()).optional(),
    exclude: z.array(z.string()).optional(),
  })
  .optional();

const PrModeSchema = z.object({
  enabled: z.boolean().default(true),
  failOn: FailOnSchema,
  maxNewIssues: z.number().positive().nullable().optional(),
  detectors: DetectorFilterSchema,
  allowOverrides: z.boolean().default(true),
});

const MainModeSchema = z.object({
  enabled: z.boolean().default(true),
  blockOnQuality: z.literal(false).default(false),
  detectors: DetectorFilterSchema,
});

const NightlyModeSchema = z.object({
  enabled: z.boolean().default(false),
  trackTrends: z.boolean().default(true),
  alertsOn: z.object({
    critical: z.boolean().default(true),
    high: z.boolean().default(false),
  }),
});

const ModesSchema = z.object({
  pr: PrModeSchema,
  main: MainModeSchema,
  nightly: NightlyModeSchema,
});

const SeverityPolicySchema = z.object({
  critical: SeverityLevelSchema,
  high: SeverityLevelSchema,
  medium: SeverityLevelSchema,
  low: SeverityLevelSchema,
});

const AntiPatternsSchema = z.object({
  failOnLegacy: z.literal(false).default(false),
  failOnMediumOrLow: z.literal(false).default(false),
  autoUploadWithoutConsent: z.literal(false).default(false),
});

export const InsightCiConfigSchema = z
  .object({
    $schema: z.string().optional(),
    version: z.literal("1"),
    modes: ModesSchema,
    severityPolicy: SeverityPolicySchema,
    antiPatterns: AntiPatternsSchema,
  })
  .strict()
  .refine(
    (data) => {
      if (data.modes.main.blockOnQuality !== false) {
        return false;
      }
      return true;
    },
    {
      message:
        "CRITICAL: main.blockOnQuality MUST be false. Main branch builds represent merged, approved code and must never fail on quality issues. See CI_PHILOSOPHY.md.",
      path: ["modes", "main", "blockOnQuality"],
    }
  )
  .refine(
    (data) => {
      if (!data.modes.pr.enabled) {
        const allDisabled =
          !data.modes.pr.failOn.critical &&
          !data.modes.pr.failOn.high &&
          !data.modes.pr.failOn.medium &&
          !data.modes.pr.failOn.low;
        return allDisabled;
      }
      return true;
    },
    {
      message:
        "If modes.pr.enabled is false, all failOn.* flags must be false.",
      path: ["modes", "pr"],
    }
  )
  .refine(
    (data) => {
      if (data.antiPatterns.failOnMediumOrLow === false) {
        return !data.modes.pr.failOn.medium && !data.modes.pr.failOn.low;
      }
      return true;
    },
    {
      message:
        "antiPatterns.failOnMediumOrLow is false, but PR mode is configured to fail on Medium or Low severity. This violates CI_PHILOSOPHY.md: precision over recall.",
      path: ["modes", "pr", "failOn"],
    }
  );

export type InsightCiConfig = z.infer<typeof InsightCiConfigSchema>;

/**
 * Default configuration matching current documented behavior.
 *
 * - PR: Fail only on Critical, delta-first analysis
 * - Main: Never blocks on quality issues
 * - Nightly: Trend tracking only
 */
export const DEFAULT_CI_CONFIG: InsightCiConfig = {
  version: "1",
  modes: {
    pr: {
      enabled: true,
      failOn: {
        critical: true,
        high: false,
        medium: false,
        low: false,
      },
      maxNewIssues: null,
      allowOverrides: true,
    },
    main: {
      enabled: true,
      blockOnQuality: false,
    },
    nightly: {
      enabled: false,
      trackTrends: true,
      alertsOn: {
        critical: true,
        high: false,
      },
    },
  },
  severityPolicy: {
    critical: {
      description:
        "Security vulnerabilities, hardcoded secrets, circular dependencies that break builds",
    },
    high: {
      description:
        "Code quality issues that degrade maintainability but do not block development",
    },
    medium: {
      description:
        "Minor code smells and style violations worth addressing eventually",
    },
    low: {
      description: "Informational findings with minimal impact",
    },
  },
  antiPatterns: {
    failOnLegacy: false,
    failOnMediumOrLow: false,
    autoUploadWithoutConsent: false,
  },
};
