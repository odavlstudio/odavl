"use client";

import { useState, useEffect } from "react";

interface PhaseEntry {
    phaseName: string;
    status: string;
    duration: number;
    lastRun: string;
    trustImpact?: number;
    riskUsed?: number;
}

interface MetaStats {
    lastCycleId: string;
    phasesCompleted: number;
    totalDuration: number;
    avgTrust: number;
    riskUsed: number;
    outcome: string;
    lastRun: string;
}

export default function MetaDashboard() {
    const [stats, setStats] = useState<MetaStats | null>(null);
    const [phases, setPhases] = useState<PhaseEntry[]>([]);

    useEffect(() => {
        const mockPhases: PhaseEntry[] = [
            { phaseName: "observe", status: "done", duration: 120, lastRun: new Date().toISOString() },
            { phaseName: "decide", status: "done", duration: 85, lastRun: new Date().toISOString() },
            { phaseName: "act", status: "done", duration: 200, lastRun: new Date().toISOString() },
            { phaseName: "verify", status: "done", duration: 150, lastRun: new Date().toISOString() },
            { phaseName: "learn", status: "done", duration: 95, lastRun: new Date().toISOString() },
        ];

        const mockStats: MetaStats = {
            lastCycleId: `cycle-${Math.random().toString(36).slice(2, 9)}`,
            phasesCompleted: 5,
            totalDuration: mockPhases.reduce((sum, p) => sum + p.duration, 0),
            avgTrust: 0.92,
            riskUsed: 12.5,
            outcome: "STABLE✅",
            lastRun: new Date().toISOString(),
        };

        setStats(mockStats);
        setPhases(mockPhases);
    }, []);

    if (!stats) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-8">
            <h1 className="text-4xl font-bold text-white mb-8">🧠 Meta Orchestrator</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6">
                    <h2 className="text-xl font-semibold text-blue-400 mb-4">Last Cycle Summary</h2>
                    <div className="space-y-2 text-gray-300">
                        <p>
                            <span className="text-gray-400">Cycle ID:</span> {stats.lastCycleId}
                        </p>
                        <p>
                            <span className="text-gray-400">Phases:</span> {stats.phasesCompleted}/5
                        </p>
                        <p>
                            <span className="text-gray-400">Duration:</span> {stats.totalDuration}ms
                        </p>
                        <p>
                            <span className="text-gray-400">Outcome:</span>{" "}
                            <span className="font-bold text-green-400">{stats.outcome}</span>
                        </p>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6">
                    <h2 className="text-xl font-semibold text-purple-400 mb-4">Risk & Trust</h2>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm text-gray-400 mb-1">
                                <span>Risk Used</span>
                                <span>{stats.riskUsed.toFixed(1)}/100</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                    className="bg-yellow-500 h-2 rounded-full"
                                    style={{ width: `${stats.riskUsed}%` }}
                                ></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm text-gray-400 mb-1">
                                <span>Avg Trust</span>
                                <span>{(stats.avgTrust * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${stats.avgTrust * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-cyan-400 mb-4">Phase Execution</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {phases.map((phase) => (
                        <div
                            key={phase.phaseName}
                            className="bg-slate-900/50 rounded-lg p-4 border border-slate-600"
                        >
                            <div className="text-sm font-medium text-gray-300 mb-2 capitalize">
                                {phase.phaseName}
                            </div>
                            <div className="text-xs text-gray-500">{phase.duration}ms</div>
                            <div className="mt-2">
                                {phase.status === "done" ? (
                                    <span className="text-green-400 text-xs">✅ Done</span>
                                ) : (
                                    <span className="text-yellow-400 text-xs">⏳ Pending</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-6 bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-green-400 mb-4">Compliance Status</h2>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-300 text-sm">All phases operational</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-300 text-sm">Trust levels healthy</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-300 text-sm">Risk within limits</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
