import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface FileChange {
    file: string;
    timestamp: string;
    commit: string;
}

export class ChangeHistoryReader {
    async getRecentChanges(limit = 10): Promise<FileChange[]> {
        try {
            const { stdout } = await execAsync(
                `git log -n ${limit} --name-only --pretty=format:"%H|%aI"`
            );

            return this.parseGitLog(stdout);
        } catch {
            return [];
        }
    }

    private parseGitLog(output: string): FileChange[] {
        const changes: FileChange[] = [];
        const lines = output.split("\n").filter((l) => l.trim());

        let currentCommit = "";
        let currentTimestamp = "";

        for (const line of lines) {
            if (line.includes("|")) {
                const [commit, timestamp] = line.split("|");
                currentCommit = commit;
                currentTimestamp = timestamp;
            } else if (line.trim() && currentCommit) {
                changes.push({
                    file: line.trim(),
                    timestamp: currentTimestamp,
                    commit: currentCommit,
                });
            }
        }

        return changes;
    }
}
