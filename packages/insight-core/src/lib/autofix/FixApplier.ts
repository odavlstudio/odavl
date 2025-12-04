import { readFile, writeFile } from 'node:fs/promises';

export interface FixResult {
    success: boolean;
    diff?: string;
    error?: string;
}

export class FixApplier {
    async applyFix(filePath: string, fixType: string, fixData: Record<string, unknown>): Promise<FixResult> {
        try {
            const content = await readFile(filePath, 'utf-8');
            const modified = this.transform(content, fixType, fixData);

            if (modified !== content) {
                await writeFile(filePath, modified, 'utf-8');
                return { success: true, diff: this.diff(content, modified) };
            }
            return { success: false, error: 'No changes applied' };
        } catch (err) {
            return { success: false, error: (err as Error).message };
        }
    }

    private transform(content: string, type: string, data: Record<string, unknown>): string {
        if (type === 'add-import') return this.addImport(content, data.importStatement as string);
        if (type === 'replace-variable') return content.replaceAll(new RegExp(`\\b${data.oldName as string}\\b`, 'g'), data.newName as string);
        if (type === 'update-dependency') return content.replace(new RegExp(`"${data.packageName as string}":\\s*"[^"]+"`), `"${data.packageName as string}": "${data.version as string}"`);
        return content;
    }

    private addImport(content: string, stmt: string): string {
        if (content.includes(stmt)) return content;
        const lines = content.split('\n');
        let idx = -1;
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].startsWith('import ')) { idx = i; break; }
        }
        if (idx >= 0) lines.splice(idx + 1, 0, stmt);
        else lines.unshift(stmt);
        return lines.join('\n');
    }

    private diff(_original: string, modified: string): string {
        return `--- Original\n+++ Modified\n${modified.substring(0, 200)}...`;
    }
}
