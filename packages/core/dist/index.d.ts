export { AccessibilitySuite, ApprovalCondition, AutopilotConfiguration, BaselineMode, BaselinePolicy, BaselineUpdatePolicy, BrainConfiguration, ConfidenceThresholds, ConflictResolution, Criticality, DecisionPolicy, DependencyRules, DetectorCapability, E2ESuite, Environment, FalsePositiveRule, FileTaxonomy, FileTaxonomyOverrides, GuardianConfiguration, GuardianSuites, GuardianThresholds, InsightConfiguration, LearningMode, LighthouseThresholds, ManifestValidationError, MemoryConfiguration, ODAVLManifest, Overrides, PerformanceSuite, ProductOverrides, ProjectMetadata, RecipeSelection, RecipeSelectionStrategy, RiskBudget, RiskProfile, SecuritySuite, Severity, TestsConfiguration, TrustConfiguration, VisualSuite, WCAGLevel, WebVitalsThresholds, clearManifestCache, getManifestPath, getSchemaPath, getWorkspaceRoot, loadManifest, loadManifestSync, manifest } from './manifest/index.js';

/**
 * Enhanced Error Messages Utility
 * Provides clear, actionable error messages with solutions
 */
interface ErrorContext {
    code: string;
    message: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    location?: {
        file: string;
        line?: number;
        column?: number;
    };
    suggestion?: string;
    learnMore?: string;
    quickFix?: string;
}
declare class EnhancedError extends Error {
    readonly context: ErrorContext;
    constructor(context: ErrorContext);
    /**
     * Format error with colors and helpful information
     */
    format(): string;
}
/**
 * Common error messages with helpful suggestions
 */
declare const ErrorMessages: {
    AUTOPILOT_NO_RECIPES: (recipesDir: string) => ErrorContext;
    AUTOPILOT_RISK_BUDGET_EXCEEDED: (filesModified: number, maxFiles: number) => ErrorContext;
    AUTOPILOT_PROTECTED_PATH: (path: string) => ErrorContext;
    AUTOPILOT_VERIFICATION_FAILED: (beforeIssues: number, afterIssues: number) => ErrorContext;
    AUTOPILOT_ML_MODEL_NOT_FOUND: () => ErrorContext;
    INSIGHT_DETECTOR_FAILED: (detector: string, error: string) => ErrorContext;
    INSIGHT_NO_ISSUES_FOUND: () => ErrorContext;
    INSIGHT_CRITICAL_VULNERABILITY: (vulnerability: string, location: string) => ErrorContext;
    GUARDIAN_SITE_UNREACHABLE: (url: string) => ErrorContext;
    GUARDIAN_WCAG_VIOLATION: (violation: string, level: string) => ErrorContext;
    GUARDIAN_PERFORMANCE_BUDGET_EXCEEDED: (metric: string, actual: number, budget: number) => ErrorContext;
    GUARDIAN_CSP_MISSING: () => ErrorContext;
    CONFIGURATION_NOT_FOUND: (configPath: string) => ErrorContext;
    DEPENDENCIES_NOT_INSTALLED: () => ErrorContext;
    BUILD_REQUIRED: (package_: string) => ErrorContext;
    PERMISSION_DENIED: (path: string) => ErrorContext;
    NETWORK_ERROR: (url: string, error: string) => ErrorContext;
};
/**
 * Format and display an enhanced error
 */
declare function displayError(context: ErrorContext): void;
/**
 * Create a success message with similar formatting
 */
declare function displaySuccess(message: string, details?: string): void;
/**
 * Create a warning message
 */
declare function displayWarning(message: string, suggestion?: string): void;
/**
 * Create an info message
 */
declare function displayInfo(message: string, details?: string): void;

/**
 * Progress Indicators Utility
 * Beautiful progress bars and spinners for CLI
 */
interface ProgressOptions {
    total: number;
    width?: number;
    complete?: string;
    incomplete?: string;
    renderThrottle?: number;
    callback?: (progress: Progress) => void;
}
declare class Progress {
    private current;
    private readonly total;
    private readonly width;
    private readonly completeChar;
    private readonly incompleteChar;
    private readonly renderThrottle;
    private lastRender;
    private callback?;
    constructor(options: ProgressOptions);
    /**
     * Update progress
     */
    tick(amount?: number): void;
    /**
     * Set absolute progress
     */
    update(current: number): void;
    /**
     * Check if progress is complete
     */
    isComplete(): boolean;
    /**
     * Get percentage (0-100)
     */
    getPercentage(): number;
    /**
     * Render progress bar
     */
    private render;
    /**
     * Complete immediately
     */
    complete(): void;
}
/**
 * Spinner for indeterminate progress
 */
declare class Spinner {
    private readonly frames;
    private readonly interval;
    private currentFrame;
    private timer?;
    private readonly message;
    constructor(message?: string, frames?: string[]);
    /**
     * Start spinning
     */
    start(): void;
    /**
     * Update message
     */
    update(message: string): void;
    /**
     * Stop with success
     */
    succeed(message?: string): void;
    /**
     * Stop with failure
     */
    fail(message?: string): void;
    /**
     * Stop with warning
     */
    warn(message?: string): void;
    /**
     * Stop with info
     */
    info(message?: string): void;
    /**
     * Stop spinning
     */
    private stop;
    /**
     * Render current frame
     */
    private render;
}
/**
 * Multi-progress for tracking multiple tasks
 */
declare class MultiProgress {
    private readonly bars;
    private readonly spinners;
    /**
     * Add progress bar
     */
    addBar(id: string, options: ProgressOptions): Progress;
    /**
     * Add spinner
     */
    addSpinner(id: string, message: string): Spinner;
    /**
     * Get bar by ID
     */
    getBar(id: string): Progress | undefined;
    /**
     * Get spinner by ID
     */
    getSpinner(id: string): Spinner | undefined;
    /**
     * Complete all
     */
    completeAll(): void;
}
/**
 * Convenient progress helpers
 */
declare const ProgressHelpers: {
    /**
     * Show progress for file operations
     */
    showFileProgress(files: string[], operation: (file: string) => Promise<void>): Promise<void>;
    /**
     * Show spinner for async operation
     */
    withSpinner<T>(message: string, operation: () => Promise<T>): Promise<T>;
    /**
     * Show progress for array of tasks
     */
    showTaskProgress<T>(tasks: Array<{
        name: string;
        fn: () => Promise<T>;
    }>): Promise<T[]>;
    /**
     * Show estimated time remaining
     */
    showETAProgress(total: number, operation: (index: number) => Promise<void>): Promise<void>;
};

/**
 * Enhanced CLI Help Messages
 * Beautiful, informative help screens
 */
interface CommandInfo {
    name: string;
    description: string;
    usage?: string;
    examples?: Array<{
        command: string;
        description: string;
    }>;
    options?: Array<{
        flag: string;
        description: string;
        default?: string;
    }>;
    aliases?: string[];
    category?: string;
}
declare class CLIHelp {
    private readonly productName;
    private readonly version;
    private readonly description;
    private readonly commands;
    constructor(productName: string, version: string, description: string);
    /**
     * Add command
     */
    addCommand(info: CommandInfo): void;
    /**
     * Display main help screen
     */
    displayMain(): void;
    /**
     * Display command-specific help
     */
    displayCommand(commandName: string): void;
    /**
     * Get CLI name from product name
     */
    private getCliName;
}
/**
 * Pre-configured help screens for each product
 */
declare const ODAVLHelp: {
    /**
     * Insight Help
     */
    Insight: () => CLIHelp;
    /**
     * Autopilot Help
     */
    Autopilot: () => CLIHelp;
    /**
     * Guardian Help
     */
    Guardian: () => CLIHelp;
};

/**
 * ODAVL Studio Feature Flags
 * Controls availability of incomplete/experimental features
 */
declare const FEATURES: {
    /** CVE Scanner - Not yet implemented (stub only) */
    readonly CVE_SCANNER: false;
    /** Brain ML Coordination - All functions are stubs */
    readonly BRAIN_ML_ENABLED: false;
    /** OMS Risk Scoring - Package missing */
    readonly OMS_RISK_SCORING: false;
    /** Python Detection - Experimental (mypy/bandit/radon) */
    readonly PYTHON_DETECTION: false;
    /** Next.js Detector - Not implemented */
    readonly NEXTJS_DETECTOR: false;
};
type FeatureFlag = keyof typeof FEATURES;

/**
 * ODAVL Studio Core Utilities
 */

/**
 * Shared constants
 */
declare const ODAVL_VERSION = "1.0.0";
declare const ODAVL_API_URL: string;
/**
 * Utility functions
 */
declare function formatDate(date: Date): string;
declare function generateId(): string;

export { CLIHelp, type CommandInfo, EnhancedError, type ErrorContext, ErrorMessages, FEATURES, type FeatureFlag, MultiProgress, ODAVLHelp, ODAVL_API_URL, ODAVL_VERSION, Progress, ProgressHelpers, type ProgressOptions, Spinner, displayError, displayInfo, displaySuccess, displayWarning, formatDate, generateId };
