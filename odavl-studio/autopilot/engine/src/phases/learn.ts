// ODAVL CLI learn phase — Trust score learning system
import * as fs from "node:fs";
import * as path from "node:path";
import { logPhase } from "./logPhase.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RecipeTrust {
    id: string;
    runs: number;
    success: number;
    trust: number;
    consecutiveFailures?: number;
    blacklisted?: boolean;
}

interface RunHistory {
    timestamp: string;
    recipeId: string;
    success: boolean;
    improvement?: {
        eslint: number;
        typescript: number;
        total: number;
    };
    attestationHash?: string;
}

interface TrustHistoryEntry {
    timestamp: string;
    recipeId: string;
    trust: number;
    runs: number;
    success: number;
    consecutiveFailures: number;
}

interface LearnResult {
    trustUpdated: boolean;
    oldTrust: number;
    newTrust: number;
    totalRuns: number;
    blacklisted: boolean;
    message: string;
}

// ---------------------------------------------------------------------------
// File paths
// ---------------------------------------------------------------------------
const TRUST_FILE = path.join(process.cwd(), ".odavl", "recipes-trust.json");
const HISTORY_FILE = path.join(process.cwd(), ".odavl", "history.json");
const TRUST_HISTORY_FILE = path.join(process.cwd(), ".odavl", "trust-history.json");

// ---------------------------------------------------------------------------
// Trust score helpers
// ---------------------------------------------------------------------------

/**
 * Load trust scores from recipes-trust.json
 */
function loadTrustScores(): RecipeTrust[] {
    if (!fs.existsSync(TRUST_FILE)) {
        return [];
    }
    const data = fs.readFileSync(TRUST_FILE, "utf-8");
    return JSON.parse(data) as RecipeTrust[];
}

/**
 * Save trust scores atomically
 */
function saveTrustScores(scores: RecipeTrust[]): void {
    const dir = path.dirname(TRUST_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TRUST_FILE, JSON.stringify(scores, null, 2), "utf-8");
}

/**
 * Find or create recipe trust entry
 */
function findOrCreateTrust(scores: RecipeTrust[], recipeId: string): RecipeTrust {
    let entry = scores.find((s) => s.id === recipeId);
    if (!entry) {
        entry = {
            id: recipeId,
            runs: 0,
            success: 0,
            trust: 0.5, // Initial trust for new recipes
            consecutiveFailures: 0,
            blacklisted: false,
        };
        scores.push(entry);
    }
    return entry;
}

/**
 * Calculate new trust score: trust = success / runs
 * Clamp between 0.1 and 1.0
 */
function calculateTrust(success: number, runs: number): number {
    if (runs === 0) return 0.5;
    const trust = success / runs;
    const minTrust = 0.1;
    const maxTrust = 1;
    return Math.max(minTrust, Math.min(maxTrust, trust));
}

/**
 * Check if recipe should be blacklisted (3 consecutive failures)
 */
function checkBlacklist(entry: RecipeTrust): boolean {
    return (entry.consecutiveFailures ?? 0) >= 3;
}

// ---------------------------------------------------------------------------
// History tracking
// ---------------------------------------------------------------------------

/**
 * Load run history
 */
function loadHistory(): RunHistory[] {
    if (!fs.existsSync(HISTORY_FILE)) {
        return [];
    }
    const data = fs.readFileSync(HISTORY_FILE, "utf-8");
    return JSON.parse(data) as RunHistory[];
}

/**
 * Append to run history
 */
function appendHistory(record: RunHistory): void {
    const history = loadHistory();
    history.push(record);
    const dir = path.dirname(HISTORY_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
}

/**
 * Load trust history (for trend visualization)
 */
function loadTrustHistory(): TrustHistoryEntry[] {
    if (!fs.existsSync(TRUST_HISTORY_FILE)) {
        return [];
    }
    const data = fs.readFileSync(TRUST_HISTORY_FILE, "utf-8");
    return JSON.parse(data) as TrustHistoryEntry[];
}

/**
 * Append to trust history (for trend visualization)
 */
function appendTrustHistory(entry: RecipeTrust): void {
    const history = loadTrustHistory();
    const record: TrustHistoryEntry = {
        timestamp: new Date().toISOString(),
        recipeId: entry.id,
        trust: entry.trust,
        runs: entry.runs,
        success: entry.success,
        consecutiveFailures: entry.consecutiveFailures ?? 0,
    };
    history.push(record);
    const dir = path.dirname(TRUST_HISTORY_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TRUST_HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// LEARN phase
// ---------------------------------------------------------------------------

/**
 * LEARN phase — Update trust scores based on verification results
 * 
 * @param recipeId - Recipe that was executed
 * @param success - Whether quality gates passed
 * @param improvement - Optional improvement metrics (eslint, typescript, total)
 * @param attestationHash - Optional SHA-256 hash from attestation
 * @returns Trust update results
 */
export async function learn(
    recipeId: string,
    success: boolean,
    improvement?: { eslint: number; typescript: number; total: number },
    attestationHash?: string
): Promise<LearnResult> {
    logPhase("LEARN", `Updating trust for recipe: ${recipeId}`);

    // Load current trust scores
    const scores = loadTrustScores();
    const entry = findOrCreateTrust(scores, recipeId);

    // Store old trust for reporting
    const oldTrust = entry.trust;

    // Update run counts
    entry.runs += 1;
    if (success) {
        entry.success += 1;
        entry.consecutiveFailures = 0; // Reset on success
    } else {
        entry.consecutiveFailures = (entry.consecutiveFailures ?? 0) + 1;
    }

    // Calculate new trust score
    const newTrust = calculateTrust(entry.success, entry.runs);
    entry.trust = newTrust;

    // Check blacklist status
    const isBlacklisted = checkBlacklist(entry);
    if (isBlacklisted) {
        entry.blacklisted = true;
        logPhase("LEARN", `⚠️  Recipe ${recipeId} BLACKLISTED after ${entry.consecutiveFailures} consecutive failures`);
    }

    // Save updated trust scores
    saveTrustScores(scores);

    // Append to trust history (for trend visualization)
    appendTrustHistory(entry);

    // Append to history
    const historyRecord: RunHistory = {
        timestamp: new Date().toISOString(),
        recipeId,
        success,
        improvement,
        attestationHash,
    };
    appendHistory(historyRecord);

    // Build result message
    let arrow: string;
    if (newTrust > oldTrust) {
        arrow = "↑";
    } else if (newTrust < oldTrust) {
        arrow = "↓";
    } else {
        arrow = "→";
    }
    const message = success
        ? `✓ Trust ${arrow} ${oldTrust.toFixed(2)} → ${newTrust.toFixed(2)} (${entry.success}/${entry.runs} success)`
        : `✗ Trust ${arrow} ${oldTrust.toFixed(2)} → ${newTrust.toFixed(2)} (${entry.consecutiveFailures} consecutive failures)`;

    logPhase("LEARN", message);

    return {
        trustUpdated: true,
        oldTrust,
        newTrust,
        totalRuns: entry.runs,
        blacklisted: isBlacklisted,
        message,
    };
}

/**
 * Initialize trust scores for all known recipes
 * Call this once to set up initial trust data
 */
export function initializeTrustScores(): void {
    const knownRecipes = [
        "import-cleaner",
        "eslint-auto-fix",
        "typescript-fixer",
        "security-hardening",
        "performance-optimizer",
    ];

    const scores = loadTrustScores();
    let added = 0;

    for (const recipeId of knownRecipes) {
        const exists = scores.find((s) => s.id === recipeId);
        if (!exists) {
            scores.push({
                id: recipeId,
                runs: 0,
                success: 0,
                trust: 0.5,
                consecutiveFailures: 0,
                blacklisted: false,
            });
            added++;
        }
    }

    if (added > 0) {
        saveTrustScores(scores);
        logPhase("LEARN", `Initialized ${added} recipe trust scores`);
    } else {
        logPhase("LEARN", "All recipe trust scores already initialized");
    }
}

