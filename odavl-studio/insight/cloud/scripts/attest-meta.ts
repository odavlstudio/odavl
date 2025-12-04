import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { metaOrchestrator } from "../src/lib/MetaOrchestrator";
import { PhaseRegistry } from "../src/lib/PhaseRegistry";
import { logger } from '../src/utils/logger';

// Helper function to get outcome icon
function getOutcomeIcon(outcomeValue: string): string {
    if (outcomeValue.includes("STABLE")) return "✅";
    if (outcomeValue.includes("DEGRADED")) return "⚠️";
    return "❌";
}

async function generateAttestation(): Promise<void> {
    logger.debug("🧠 ODAVL Meta Orchestrator Attestation");
    logger.debug("==========================================\n");

    const cycleId = randomUUID();
    const cycleStart = Date.now();

    await PhaseRegistry.load();

    logger.debug(`Cycle ID: ${cycleId}`);
    logger.debug("Starting 5-phase adaptive cycle...\n");

    await metaOrchestrator.runCycle();

    const cycleDuration = Date.now() - cycleStart;
    const phaseSummary = PhaseRegistry.getSummary();

    const completedPhases = phaseSummary.filter((p) => p.status === "done").length;
    const totalRisk = phaseSummary.reduce((sum: number, p: any) => sum + (p.riskUsed || 0), 0);
    const avgTrust =
        phaseSummary.reduce((sum: number, p: any) => sum + (p.trustImpact || 1), 0) / phaseSummary.length;

    let outcome: string;
    if (completedPhases === 5 && avgTrust >= 0.8) {
        outcome = "STABLE✅";
    } else if (completedPhases >= 4) {
        outcome = "DEGRADED⚠️";
    } else {
        outcome = "FAILED❌";
    }

    logger.debug(`\nCycle completed: ${completedPhases}/5 phases`);
    logger.debug(`Total duration: ${cycleDuration}ms`);
    logger.debug(`Risk used: ${totalRisk.toFixed(2)}`);
    logger.debug(`Avg trust: ${avgTrust.toFixed(2)}`);
    logger.debug(`Outcome: ${outcome}\n`);

    const attestationDir = join(process.cwd(), ".odavl", "attestations", "meta");
    await mkdir(attestationDir, { recursive: true });

    const timestamp = Date.now();
    const attestationPath = join(attestationDir, `run-${timestamp}.md`);

    const markdown = `# ODAVL Meta Orchestrator Cycle Attestation

**Cycle ID**: \`${cycleId}\`
**Timestamp**: ${new Date().toISOString()}
**Duration**: ${cycleDuration}ms
**Phases Completed**: ${completedPhases}/5
**Outcome**: ${outcome}

## Phase Summary

${phaseSummary.map((p) => `- **${p.phaseName}**: ${p.status} (${p.duration}ms)`).join("\n")}

## Metrics

- **Total Risk Used**: ${totalRisk.toFixed(2)}
- **Average Trust Impact**: ${avgTrust.toFixed(2)}
- **Last Run**: ${new Date().toISOString()}

## Status

${completedPhases === 5 ? "✅" : "❌"} All phases executed
${avgTrust >= 0.8 ? "✅" : "⚠️"} Trust levels healthy
${totalRisk < 100 ? "✅" : "⚠️"} Risk budget within limits
${getOutcomeIcon(outcome)} System ${outcome}
`;

    await writeFile(attestationPath, markdown, "utf8");
    logger.debug(`✅ Attestation generated: ${attestationPath}`);
}

// Note: Top-level await not supported in CJS mode by tsx, using promise chain instead
// eslint-disable-next-line unicorn/prefer-top-level-await
generateAttestation().catch((err: unknown) => {
    logger.error("❌ Attestation failed:", err);
    process.exit(1);
});
