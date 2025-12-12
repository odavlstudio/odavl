/**
 * ODAVL Phase P4 - Universal File-Type System
 * 
 * This module defines the 20 core file categories that ODAVL uses
 * to understand, classify, and make decisions about files in any codebase.
 * 
 * File types determine:
 * - Risk level (low → critical)
 * - Product ownership (which ODAVL products use this type)
 * - Automation boundaries (what can/cannot be modified)
 * - Detection strategies (which analyzers run)
 */

/**
 * 20 Universal File Categories
 * 
 * These categories cover 100% of files ODAVL will encounter:
 * - Source code (application logic)
 * - Configuration (settings, rules)
 * - Infrastructure (deployment, containers)
 * - Testing (tests, mocks, fixtures)
 * - Data (logs, datasets, models)
 * - Security (env vars, secrets)
 * - Build artifacts (compiled outputs)
 * - Reports (analysis, coverage)
 */
export type FileType =
  | "sourceCode"           // Application source files (.ts, .tsx, .js, .py, .java, etc.)
  | "config"               // Configuration files (.eslintrc, tsconfig.json, next.config.js)
  | "infrastructure"       // Deployment files (Dockerfile, docker-compose.yml, k8s/*.yaml)
  | "tests"                // Test files (**/*.test.ts, **/*.spec.ts, **/tests/**)
  | "mocks"                // Mock data and fixtures (**/__mocks__/**, **/__fixtures__/**)
  | "logs"                 // Log files (*.log, *.log.*, error.txt)
  | "diagnostics"          // ODAVL diagnostics (.odavl/logs/**, .odavl/audit/**)
  | "datasets"             // Training/test datasets (.odavl/datasets/**, data/**)
  | "mlModels"             // ML model files (ml-models/**, *.h5, *.pb, *.onnx)
  | "migrations"           // Database migrations (prisma/migrations/**, migrations/**)
  | "env"                  // Environment files (.env, .env.local, .env.production)
  | "scripts"              // Automation scripts (scripts/**, tools/**, *.sh, *.ps1)
  | "schema"               // Schema definitions (*.schema.json, schema.prisma, *.graphql)
  | "assets"               // Static assets (public/**, assets/**, images, fonts)
  | "uiSnapshots"          // Visual regression snapshots (tests/visual-regression/**)
  | "integrations"         // Third-party integrations (integrations/**, webhooks/**)
  | "buildArtifacts"       // Build outputs (dist/**, .next/**, build/**, out/**)
  | "coverage"             // Test coverage reports (coverage/**, .nyc_output/**)
  | "reports"              // Analysis reports (reports/**, .odavl/reports/**)
  | "secretCandidates";    // Potential secrets (*secret*, *key*, *token*, *password*)

/**
 * File Type Metadata
 * 
 * Each file type has:
 * - risk: How dangerous is it to modify? (low → critical)
 * - usedBy: Which ODAVL products need this type?
 * - description: Human-readable explanation
 */
export interface FileTypeMetadata {
  /**
   * Risk Level:
   * - low: Safe to modify (logs, assets, coverage)
   * - medium: Requires caution (config, tests, scripts)
   * - high: Significant impact (source code, schema, migrations)
   * - critical: Never auto-modify (env, secrets, infrastructure)
   */
  risk: "low" | "medium" | "high" | "critical";

  /**
   * Product Ownership:
   * Which ODAVL products use this file type?
   * 
   * - insight: Detection, analysis, issue reporting
   * - autopilot: Auto-fixing, refactoring, healing
   * - guardian: Pre-deploy testing, quality gates
   * - brain: Decision-making, orchestration
   */
  usedBy: ("insight" | "autopilot" | "guardian" | "brain")[];

  /**
   * Description: What this file type represents
   */
  description: string;
}

/**
 * Default File Type Metadata Registry
 * 
 * Maps each of the 20 file types to its risk level, ownership, and description.
 * These are the fail-safe defaults if manifest doesn't override.
 */
export const DEFAULT_FILE_TYPE_METADATA: Record<FileType, FileTypeMetadata> = {
  sourceCode: {
    risk: "high",
    usedBy: ["insight", "autopilot", "brain"],
    description: "Application source code (TypeScript, JavaScript, Python, Java, etc.)",
  },
  config: {
    risk: "medium",
    usedBy: ["insight", "autopilot", "guardian"],
    description: "Configuration files (ESLint, TypeScript, Next.js, Vite, etc.)",
  },
  infrastructure: {
    risk: "critical",
    usedBy: ["insight", "guardian", "brain"],
    description: "Deployment infrastructure (Dockerfile, docker-compose, Kubernetes manifests)",
  },
  tests: {
    risk: "medium",
    usedBy: ["insight", "guardian"],
    description: "Test files (unit tests, integration tests, E2E tests)",
  },
  mocks: {
    risk: "low",
    usedBy: ["insight", "guardian"],
    description: "Mock data and test fixtures",
  },
  logs: {
    risk: "low",
    usedBy: ["insight", "brain"],
    description: "Application log files",
  },
  diagnostics: {
    risk: "low",
    usedBy: ["brain"],
    description: "ODAVL diagnostic logs and audit trails",
  },
  datasets: {
    risk: "medium",
    usedBy: ["insight", "brain"],
    description: "Training and test datasets for ML models",
  },
  mlModels: {
    risk: "high",
    usedBy: ["insight", "brain"],
    description: "Machine learning model files (TensorFlow, PyTorch, ONNX)",
  },
  migrations: {
    risk: "critical",
    usedBy: ["insight", "guardian", "brain"],
    description: "Database migration files (Prisma, Knex, Sequelize)",
  },
  env: {
    risk: "critical",
    usedBy: ["insight", "brain"],
    description: "Environment variable files (.env, .env.local, .env.production)",
  },
  scripts: {
    risk: "medium",
    usedBy: ["insight", "autopilot", "brain"],
    description: "Automation scripts (PowerShell, Bash, Python, Node.js)",
  },
  schema: {
    risk: "high",
    usedBy: ["insight", "guardian", "brain"],
    description: "Schema definitions (JSON Schema, Prisma, GraphQL, OpenAPI)",
  },
  assets: {
    risk: "low",
    usedBy: ["guardian"],
    description: "Static assets (images, fonts, public files)",
  },
  uiSnapshots: {
    risk: "low",
    usedBy: ["guardian"],
    description: "Visual regression test snapshots",
  },
  integrations: {
    risk: "medium",
    usedBy: ["insight", "guardian", "brain"],
    description: "Third-party integration code (webhooks, API clients)",
  },
  buildArtifacts: {
    risk: "low",
    usedBy: [],
    description: "Build outputs (should be gitignored, not analyzed)",
  },
  coverage: {
    risk: "low",
    usedBy: ["insight", "guardian"],
    description: "Test coverage reports",
  },
  reports: {
    risk: "low",
    usedBy: ["brain"],
    description: "Analysis reports (ODAVL Insight, Guardian, Autopilot)",
  },
  secretCandidates: {
    risk: "critical",
    usedBy: ["insight", "brain"],
    description: "Files that might contain secrets (names like *secret*, *key*, *token*)",
  },
};

/**
 * Risk Level Priority
 * Used for sorting/filtering by risk
 */
export const RISK_PRIORITY: Record<FileTypeMetadata["risk"], number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

/**
 * File Type Categories (Grouped)
 * Useful for bulk operations
 */
export const FILE_TYPE_GROUPS = {
  /** Files that can be safely auto-modified */
  autoModifiable: ["sourceCode", "config", "scripts", "tests"] as FileType[],

  /** Files that should never be auto-modified */
  protected: ["env", "infrastructure", "migrations", "secretCandidates"] as FileType[],

  /** Files used for analysis only */
  analysisOnly: ["logs", "diagnostics", "coverage", "reports", "buildArtifacts"] as FileType[],

  /** Files with security implications */
  securitySensitive: ["env", "secretCandidates", "infrastructure", "integrations"] as FileType[],

  /** Files that affect deployment */
  deploymentRelated: ["infrastructure", "migrations", "schema", "config"] as FileType[],
};
