
import React, { useState } from 'react';
import type { EvidenceRun } from '../types/ODAVLTypes';

export const EvidenceTable: React.FC<{ runs: EvidenceRun[]; raw?: EvidenceRun[] }>
    = ({ runs, raw }) => {
        const [showRaw, setShowRaw] = useState(false);
        if (!runs || runs.length === 0) return <div className="p-4 text-center text-gray-500">No evidence found / invalid data</div>;
        return (
            <div className="rounded-xl bg-white/60 shadow-lg p-4 backdrop-blur border border-slate-200">
                <table className="min-w-full text-xs rounded-xl overflow-hidden">
                    <thead>
                        <tr className="bg-[#0f3460] text-white">
                            <th className="px-3 py-2">Date</th>
                            <th className="px-3 py-2">Δ ESLint</th>
                            <th className="px-3 py-2">Δ Types</th>
                            <th className="px-3 py-2">Decision</th>
                            <th className="px-3 py-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {runs.map((r) => {
                            let eslintColor = '🔴';
                            if (r.deltas.eslint === 0) eslintColor = '🟢';
                            else if (r.deltas.eslint < 0) eslintColor = '🟡';
                            let typesColor = '🔴';
                            if (r.deltas.types === 0) typesColor = '🟢';
                            else if (r.deltas.types < 0) typesColor = '🟡';
                            return (
                                <tr key={r.ts} className="transition-colors hover:bg-[#00d4ff]/10">
                                    <td className="px-3 py-2 text-sm font-medium text-gray-900">{new Date(r.ts).toLocaleString()}</td>
                                    <td className="px-3 py-2" style={{ color: '#0f3460' }}>{r.deltas.eslint} {eslintColor}</td>
                                    <td className="px-3 py-2" style={{ color: '#0f3460' }}>{r.deltas.types} {typesColor}</td>
                                    <td className="px-3 py-2 text-xs text-gray-700">{r.decision}</td>
                                    <td className="px-3 py-2">{r.success ? '✅' : '❌'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <button type="button" onClick={() => setShowRaw(v => !v)} className="mt-2 px-3 py-1 text-xs border rounded bg-[#00d4ff]/10 text-[#0f3460] transition-colors hover:bg-[#00d4ff]/30">Advanced → View Raw JSON</button>
                {showRaw && <pre className="text-xs bg-slate-100 p-2 mt-2 rounded max-h-64 overflow-auto">{JSON.stringify(raw || runs, null, 2)}</pre>}
            </div>
        );
    };
