import React, { useEffect, useState } from 'react';
import { loadEvidence } from '../utils/dataLoader';
import { HistoryEntry } from '../types/ODAVLTypes';

const REFRESH_INTERVAL = 15000;

export default function EvidencePanel() {
    const [runs, setRuns] = useState<HistoryEntry[]>([]);
    const [raw, setRaw] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const fetchData = async () => {
            try {
                const data = await loadEvidence();
                if (mounted) setRuns(data.slice(0, 5));
                setError(null);
            } catch (e) {
                setError('No evidence found / invalid data');
                setRuns([]);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, REFRESH_INTERVAL);
        return () => { mounted = false; clearInterval(interval); };
    }, []);

    if (error) return <div className="odavl-fallback text-center text-gray-500">{error}</div>;
    if (raw) return <pre>{JSON.stringify(runs, null, 2)}</pre>;

    return (
        <div className="rounded-xl bg-white/60 shadow-lg p-4 backdrop-blur border border-slate-200">
            <button onClick={() => setRaw(r => !r)} className="mb-2 px-3 py-1 text-xs border rounded bg-[#00d4ff]/10 text-[#0f3460] transition-colors hover:bg-[#00d4ff]/30">Advanced → View Raw JSON</button>
            <div className="odavl-summary">
                {/* Summary cards: success rate, eslint/type delta */}
                {/* ...minimal UI for brevity... */}
            </div>
            <table className="odavl-evidence-table min-w-full text-xs rounded-xl overflow-hidden">
                <thead>
                    <tr className="bg-[#0f3460] text-white">
                        <th className="px-3 py-2">Timestamp</th>
                        <th className="px-3 py-2">Δ</th>
                        <th className="px-3 py-2">Trust</th>
                    </tr>
                </thead>
                <tbody>
                    {runs.map(run => {
                        let deltaColor = '#00d4ff';
                        if (run.deltas.eslint > 0 || run.deltas.types > 0) deltaColor = '#e63946';
                        else if (run.deltas.eslint < 0 || run.deltas.types < 0) deltaColor = '#43aa8b';
                        return (
                            <tr key={run.ts} className="transition-colors hover:bg-[#00d4ff]/10">
                                <td className="px-3 py-2 text-sm font-medium text-gray-900">{new Date(run.ts).toLocaleString()}</td>
                                <td className="px-3 py-2" style={{ color: deltaColor }}>
                                    ESLint: {run.deltas.eslint}, Types: {run.deltas.types}
                                </td>
                                <td className="px-3 py-2" style={{ color: run.success ? '#43aa8b' : '#e63946' }}>{run.success ? 'Success' : 'Fail'}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
