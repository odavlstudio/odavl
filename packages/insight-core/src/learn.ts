import fs from "node:fs/promises";
import path from "node:path";
import { getRepoRoot } from "./utils/getRepoRoot";

const learnLogPath = path.join(getRepoRoot(), ".odavl/insight/learn/insight-learn-log.md");

export async function logLearning({ date, type, rootCause, fixHint }: { date: string; type: string; rootCause: string; fixHint: string }) {
    const line = `[${date}] System learned: recurring ${type} error — Root cause: ${rootCause} — Solution: ${fixHint}.\n`;
    await fs.mkdir(path.dirname(learnLogPath), { recursive: true });
    await fs.appendFile(learnLogPath, line, "utf8");
}
