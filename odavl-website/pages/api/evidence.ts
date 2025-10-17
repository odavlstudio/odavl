import fs from 'node:fs';
import path from 'node:path';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { EvidenceRun } from '../../src/types/ODAVLTypes';

function loadEvidenceHistory(n = 5): { runs: EvidenceRun[]; raw: unknown } {
    try {
        const historyPath = path.resolve(process.cwd(), '.odavl/history.json');
        const raw = fs.readFileSync(historyPath, 'utf-8');
        const all = JSON.parse(raw);
        if (!Array.isArray(all)) return { runs: [], raw: null };
        const valid = all.filter((r: unknown) => {
            if (!r || typeof r !== 'object') return false;
            const rec = r as Record<string, unknown>;
            return typeof rec.ts === 'string' && rec.before && rec.after && rec.deltas && rec.decision;
        });
        const sorted = valid.toSorted((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
        return { runs: sorted.slice(0, n) as EvidenceRun[], raw: all };
    } catch (err) {
        console.error('[ODAVL] Evidence loader error:', err);
        return { runs: [], raw: null };
    }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const { runs, raw } = loadEvidenceHistory(5);
    res.status(200).json({ runs, raw });
}
