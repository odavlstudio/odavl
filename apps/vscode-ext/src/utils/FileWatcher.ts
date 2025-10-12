import * as fs from 'fs';

export class FileWatcher {
  private watchedFiles: Set<string> = new Set();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  watch(filePath: string, callback: () => void, debounceMs = 500): void {
    if (this.watchedFiles.has(filePath)) {
      this.unwatch(filePath);
    }

    try {
      fs.watchFile(filePath, () => {
        const existingTimer = this.debounceTimers.get(filePath);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
          callback();
          this.debounceTimers.delete(filePath);
        }, debounceMs);

        this.debounceTimers.set(filePath, timer);
      });

      this.watchedFiles.add(filePath);
    } catch (error) {
      console.error(`Failed to watch file ${filePath}:`, error);
    }
  }

  unwatch(filePath: string): void {
    if (this.watchedFiles.has(filePath)) {
      fs.unwatchFile(filePath);
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