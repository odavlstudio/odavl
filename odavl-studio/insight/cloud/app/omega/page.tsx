"use client";

import { useState, useEffect } from "react";

interface SystemStatus {
    status: "OPTIMAL" | "HEALTHY" | "DEGRADED" | "CRITICAL";
    healthScore: number;
    trust: number;
    risk: number;
    confidence: number;
    lastHeartbeat: string;
}

interface Subsystem {
    name: string;
    status: "active" | "degraded" | "offline";
    icon: string;
}

export default function OmegaDashboard() {
    const [systemStatus, setSystemStatus] = useState<SystemStatus>({
        status: "OPTIMAL",
        healthScore: 0.97,
        trust: 0.95,
        risk: 0.12,
        confidence: 0.82,
        lastHeartbeat: new Date().toISOString(),
    });

    const [subsystems] = useState<Subsystem[]>([
        { name: "Insight Core", status: "active", icon: "🧠" },
        { name: "Cloud", status: "active", icon: "☁️" },
        { name: "Website", status: "active", icon: "🌐" },
        { name: "Governance", status: "active", icon: "⚖️" },
        { name: "Neural", status: "active", icon: "🤖" },
        { name: "Grid", status: "active", icon: "🌍" },
    ]);

    useEffect(() => {
        // Mock heartbeat updates (would connect to real InsightBridge in production)
        const interval = setInterval(() => {
            setSystemStatus((prev) => ({
                ...prev,
                lastHeartbeat: new Date().toISOString(),
            }));
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: SystemStatus["status"]) => {
        switch (status) {
            case "OPTIMAL":
                return "text-green-600";
            case "HEALTHY":
                return "text-blue-600";
            case "DEGRADED":
                return "text-yellow-600";
            case "CRITICAL":
                return "text-red-600";
            default:
                return "text-gray-600";
        }
    };

    const getStatusIcon = (status: SystemStatus["status"]) => {
        switch (status) {
            case "OPTIMAL":
                return "✅";
            case "HEALTHY":
                return "🟢";
            case "DEGRADED":
                return "⚠️";
            case "CRITICAL":
                return "❌";
            default:
                return "⚪";
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">🌀 ODAVL Ω Dashboard</h1>
                <p className="text-gray-600">Final Convergence — Self-Operating Intelligence System</p>
            </div>

            {/* Global System Status */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-lg p-8 mb-6">
                <h2 className="text-2xl font-semibold mb-4">Global System Status</h2>
                <div className="flex items-center gap-4">
                    <div className="text-6xl">{getStatusIcon(systemStatus.status)}</div>
                    <div>
                        <div className={`text-3xl font-bold ${getStatusColor(systemStatus.status)}`}>
                            {systemStatus.status}
                        </div>
                        <div className="text-gray-600 text-sm">
                            Health Score: {systemStatus.healthScore.toFixed(2)}
                        </div>
                        <div className="text-gray-500 text-xs">
                            Last heartbeat: {new Date(systemStatus.lastHeartbeat).toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Subsystems Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {subsystems.map((subsystem) => (
                    <div key={subsystem.name} className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center gap-3">
                            <div className="text-3xl">{subsystem.icon}</div>
                            <div className="flex-1">
                                <div className="font-semibold">{subsystem.name}</div>
                                <div className="text-sm text-green-600">
                                    {subsystem.status === "active" ? "✅ Active" : "⚠️ " + subsystem.status}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Trust × Risk × Confidence */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Trust Level</h3>
                    <div className="text-4xl font-bold text-blue-600">
                        {(systemStatus.trust * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-500 mt-2">Average trust score</div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Risk Budget</h3>
                    <div className="text-4xl font-bold text-yellow-600">
                        {(systemStatus.risk * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-500 mt-2">Used of 100%</div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Neural Confidence</h3>
                    <div className="text-4xl font-bold text-purple-600">
                        {(systemStatus.confidence * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-500 mt-2">Predictive accuracy</div>
                </div>
            </div>

            {/* Live Log Stream */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Live Event Stream</h3>
                <div className="bg-gray-50 rounded p-4 font-mono text-sm space-y-2">
                    <div className="text-green-600">
                        💓 {new Date().toLocaleTimeString()} - Omega heartbeat: OPTIMAL
                    </div>
                    <div className="text-blue-600">
                        🔔 {new Date(Date.now() - 60000).toLocaleTimeString()} - Meta cycle completed
                    </div>
                    <div className="text-gray-600">
                        🌍 {new Date(Date.now() - 120000).toLocaleTimeString()} - Grid sync: 6 nodes
                    </div>
                    <div className="text-gray-600">
                        ⚖️ {new Date(Date.now() - 180000).toLocaleTimeString()} - Governance attestation
                        recorded
                    </div>
                </div>
            </div>
        </div>
    );
}
