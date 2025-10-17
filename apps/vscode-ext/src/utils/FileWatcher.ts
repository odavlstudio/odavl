import * as fs from 'fs';

export class FileWatcher {
    private readonly watchedFiles: Set<string> = new Set();
    private readonly debounceTimers: Map<string, NodeJS.Timeout> = new Map();
    private readonly watchers: Map<string, fs.FSWatcher> = new Map();

    watch(filePath: string, callback: () => void, debounceMs = 500): void {
        if (this.watchedFiles.has(filePath)) {
            this.unwatch(filePath);
        }

        // If file does not exist yet, do not throw; skip watching until created
        if (!fs.existsSync(filePath)) {
            return;
        }

        try {
            const watcher = fs.watch(filePath, () => {
                const existingTimer = this.debounceTimers.get(filePath);
                if (existingTimer) {
                    clearTimeout(existingTimer);
                }

                const timer = setTimeout(() => {
                    try { callback(); } finally {
                        this.debounceTimers.delete(filePath);
                    }
                }, debounceMs);

                this.debounceTimers.set(filePath, timer);
            });

            this.watchers.set(filePath, watcher);
            this.watchedFiles.add(filePath);
        } catch (error) {
            console.error(`Failed to watch file ${filePath}:`, error);
        }
    }

    unwatch(filePath: string): void {
        if (this.watchedFiles.has(filePath)) {
            const watcher = this.watchers.get(filePath);
            try { watcher?.close(); } catch { /* ignore close errors */ }
            this.watchers.delete(filePath);
            this.watchedFiles.delete(filePath);
        }

        const timer = this.debounceTimers.get(filePath);
        if (timer) {
            clearTimeout(timer);
            this.debounceTimers.delete(filePath);
        }
    }

    dispose(): void {
        for (const filePath of this.watchedFiles) {
            this.unwatch(filePath);
        }
    }
}
