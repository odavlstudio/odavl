import { HistoryEntry, RecipeTrust } from '../types/ODAVLTypes';
import fs from 'fs';

export async function loadEvidence(): Promise<HistoryEntry[]> {
    try {
        const raw = fs.readFileSync('.odavl/history.json', 'utf8');
        const data: HistoryEntry[] = JSON.parse(raw);
        return data.sort((a, b) => Number(b.ts) - Number(a.ts));
    } catch {
        return [];
    }
}
