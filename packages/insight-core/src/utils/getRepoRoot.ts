import * as path from "node:path";
import * as fs from "node:fs";

/**
 * Recursively search upwards from a starting directory to find the repo root.
 * Looks for one of: pnpm-workspace.yaml, .git, .odavl
 * Returns the absolute path to the repo root, or process.cwd() if not found.
 */
export function getRepoRoot(startDir: string = process.cwd()): string {
    let dir = path.resolve(startDir);
    while (true) {
        if (
            fs.existsSync(path.join(dir, "pnpm-workspace.yaml")) ||
            fs.existsSync(path.join(dir, ".git")) ||
            fs.existsSync(path.join(dir, ".odavl"))
        ) {
            return dir;
        }
        const parent = path.dirname(dir);
        if (parent === dir) break; // reached root
        dir = parent;
    }
    return process.cwd();
}
