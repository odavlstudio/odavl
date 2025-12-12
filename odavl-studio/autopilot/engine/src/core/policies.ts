import * as fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import yaml from "yaml";

// Phase P1: Manifest integration
import { manifest } from '@odavl/core/manifest';

export type GovernanceConfig = {
    maxFiles: number;
    maxLocPerFile: number;
    protectedGlobs: string[];
};

export async function getGovernanceConfig(): Promise<GovernanceConfig> {
    const root = process.cwd();
    const gates = path.join(root, ".odavl", "gates.yml");
    
    // Phase P1: Read from manifest first
    // TODO P2: Use manifest as single source of truth, remove gates.yml fallback
    const cfg: GovernanceConfig = {
        maxFiles: manifest.autopilot?.riskBudget?.maxFiles ?? 10,
        maxLocPerFile: manifest.autopilot?.riskBudget?.maxLoc ?? 40,
        protectedGlobs: manifest.autopilot?.protectedPaths ?? ["security/**", "**/*.spec.*", "public-api/**"],
    };
    
    // Fallback: gates.yml (legacy support during Phase P1)
    try {
        await fsp.access(gates);
        const content = await fsp.readFile(gates, "utf8");
        const y = yaml.parse(content) ?? {};
        // Only override if manifest didn't provide values
        if (!manifest.autopilot?.riskBudget?.maxFiles) {
            cfg.maxFiles = y?.riskBudget?.maxFiles ?? cfg.maxFiles;
        }
        if (!manifest.autopilot?.riskBudget?.maxLoc) {
            cfg.maxLocPerFile = y?.riskBudget?.maxLocPerFile ?? cfg.maxLocPerFile;
        }
        if (!manifest.autopilot?.protectedPaths && Array.isArray(y?.protectedGlobs)) {
            cfg.protectedGlobs = y.protectedGlobs;
        }
    } catch {
        /* fall back to manifest defaults */
    }
    return cfg;
}

export function sha256(data: string): string {
    return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * Creates cryptographic attestation of successful improvement
 * @param recipeId - Recipe that was executed
 * @param beforeMetrics - Metrics before execution
 * @param afterMetrics - Metrics after execution
 * @returns Attestation object with SHA-256 hash
 */
export async function createAttestation(
    recipeId: string,
    beforeMetrics: { eslint: number; typescript: number; totalIssues: number },
    afterMetrics: { eslint: number; typescript: number; totalIssues: number }
): Promise<{
    hash: string;
    recipeId: string;
    timestamp: string;
    improvement: { eslint: number; typescript: number; total: number };
}> {
    const root = process.cwd();
    const attestationDir = path.join(root, ".odavl", "attestation");

    try {
        await fsp.access(attestationDir);
    } catch {
        await fsp.mkdir(attestationDir, { recursive: true });
    }

    const improvement = {
        eslint: beforeMetrics.eslint - afterMetrics.eslint,
        typescript: beforeMetrics.typescript - afterMetrics.typescript,
        total: beforeMetrics.totalIssues - afterMetrics.totalIssues
    };

    const attestation = {
        hash: sha256(JSON.stringify({ recipeId, beforeMetrics, afterMetrics, timestamp: new Date().toISOString() })),
        recipeId,
        timestamp: new Date().toISOString(),
        improvement
    };

    const filename = `${recipeId}-${Date.now()}.json`;
    await fsp.writeFile(
        path.join(attestationDir, filename),
        JSON.stringify(attestation, null, 2)
    );

    return attestation;
}
