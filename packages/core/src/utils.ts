/**
 * Common utilities for ODAVL Studio
 */

export function formatTimestamp(date: Date = new Date()): string {
    return date.toISOString();
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function hashString(str: string): string {
    // Simple hash for demo purposes
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}
