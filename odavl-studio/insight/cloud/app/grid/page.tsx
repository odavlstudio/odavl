"use client";

import { useState, useEffect } from "react";

interface GridStats {
    nodeId: string;
    trustScore: number;
    totalPeers: number;
    lastSync: string;
    lastFederatedUpdate: string;
}

export default function GridDashboard() {
    const [stats, setStats] = useState<GridStats | null>(null);

    useEffect(() => {
        // Mock data - would fetch from API
        setStats({
            nodeId: "node-" + Math.random().toString(36).substring(7),
            trustScore: 1,
            totalPeers: 0,
            lastSync: new Date().toISOString(),
            lastFederatedUpdate: "Never",
        });
    }, []);

    if (!stats) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-lg">Loading Grid Dashboard...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">ODAVL Global Intelligence Grid</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="rounded-lg border bg-card p-6">
                    <h2 className="text-xl font-semibold mb-4">Node Identity</h2>
                    <div className="space-y-2">
                        <div>
                            <span className="font-medium">Node ID:</span>
                            <div className="font-mono text-sm text-muted-foreground break-all">{stats.nodeId}</div>
                        </div>
                        <div>
                            <span className="font-medium">Trust Score:</span>
                            <div className="text-2xl font-bold text-green-600">{stats.trustScore.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border bg-card p-6">
                    <h2 className="text-xl font-semibold mb-4">Network Status</h2>
                    <div className="space-y-2">
                        <div>
                            <span className="font-medium">Connected Peers:</span>
                            <div className="text-2xl font-bold">{stats.totalPeers}</div>
                        </div>
                        <div>
                            <span className="font-medium">Last Sync:</span>
                            <div className="text-sm text-muted-foreground">
                                {new Date(stats.lastSync).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">Federated Learning</h2>
                <div className="space-y-2">
                    <div>
                        <span className="font-medium">Last Update:</span>
                        <div className="text-sm text-muted-foreground">{stats.lastFederatedUpdate}</div>
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                        No federated updates available yet. Run attestation to generate initial data.
                    </div>
                </div>
            </div>
        </div>
    );
}
