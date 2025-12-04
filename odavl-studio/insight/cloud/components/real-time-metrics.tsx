/**
 * Real-Time Metrics Component
 * Live updates for code quality metrics
 * 
 * Week 11-12: Dashboard V2
 * UNIFIED_ACTION_PLAN Phase 2 Month 3
 */

'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export interface MetricsSnapshot {
    timestamp: Date;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    codeQualityScore: number;
    securityScore: number;
    performanceScore: number;
}

export interface RealTimeMetricsProps {
    projectId?: string;
    refreshInterval?: number; // milliseconds
    maxDataPoints?: number;
}

export function RealTimeMetrics({
    projectId,
    refreshInterval = 5000,
    maxDataPoints = 20,
}: RealTimeMetricsProps) {
    const [metrics, setMetrics] = useState<MetricsSnapshot[]>([]);
    const [isLive, setIsLive] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    useEffect(() => {
        if (!isLive) return;

        const fetchMetrics = async () => {
            try {
                const response = await fetch(
                    `/api/metrics/realtime${projectId ? `?projectId=${projectId}` : ''}`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch metrics');
                }

                const data = await response.json();

                setMetrics(prev => {
                    const updated = [
                        ...prev,
                        {
                            ...data,
                            timestamp: new Date(data.timestamp),
                        },
                    ];

                    // Keep only last N data points
                    if (updated.length > maxDataPoints) {
                        return updated.slice(-maxDataPoints);
                    }

                    return updated;
                });

                setLastUpdate(new Date());
            } catch (error) {
                console.error('Failed to fetch real-time metrics:', error);
            }
        };

        // Initial fetch
        fetchMetrics();

        // Set up polling
        const interval = setInterval(fetchMetrics, refreshInterval);

        return () => clearInterval(interval);
    }, [isLive, projectId, refreshInterval, maxDataPoints]);

    const chartData = metrics.map((m, index) => ({
        time: index,
        timeLabel: m.timestamp.toLocaleTimeString(),
        errors: m.errorCount,
        warnings: m.warningCount,
        info: m.infoCount,
        quality: m.codeQualityScore,
        security: m.securityScore,
        performance: m.performanceScore,
    }));

    const currentMetrics = metrics[metrics.length - 1];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Real-Time Metrics</h2>
                    <p className="text-sm text-muted-foreground">
                        Live updates every {refreshInterval / 1000}s
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div
                            className={`h-2 w-2 rounded-full ${
                                isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                            }`}
                        />
                        <span className="text-sm">
                            {isLive ? 'Live' : 'Paused'}
                        </span>
                    </div>

                    <button
                        onClick={() => setIsLive(!isLive)}
                        className="px-4 py-2 rounded-lg border hover:bg-accent"
                    >
                        {isLive ? 'Pause' : 'Resume'}
                    </button>

                    <span className="text-xs text-muted-foreground">
                        Updated: {lastUpdate.toLocaleTimeString()}
                    </span>
                </div>
            </div>

            {/* Current Metrics Cards */}
            {currentMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard
                        title="Code Quality"
                        value={currentMetrics.codeQualityScore}
                        unit="%"
                        trend="up"
                        color="blue"
                    />
                    <MetricCard
                        title="Security Score"
                        value={currentMetrics.securityScore}
                        unit="%"
                        trend="stable"
                        color="green"
                    />
                    <MetricCard
                        title="Performance"
                        value={currentMetrics.performanceScore}
                        unit="%"
                        trend="down"
                        color="orange"
                    />
                </div>
            )}

            {/* Issues Chart */}
            <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Issues Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="timeLabel"
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="errors"
                            stackId="1"
                            stroke="#ef4444"
                            fill="#ef4444"
                            fillOpacity={0.6}
                            name="Errors"
                        />
                        <Area
                            type="monotone"
                            dataKey="warnings"
                            stackId="1"
                            stroke="#f59e0b"
                            fill="#f59e0b"
                            fillOpacity={0.6}
                            name="Warnings"
                        />
                        <Area
                            type="monotone"
                            dataKey="info"
                            stackId="1"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.6}
                            name="Info"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Quality Scores Chart */}
            <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Quality Scores Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="timeLabel"
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="quality"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="Code Quality"
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="security"
                            stroke="#10b981"
                            strokeWidth={2}
                            name="Security"
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="performance"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            name="Performance"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Empty State */}
            {metrics.length === 0 && (
                <div className="border rounded-lg p-12 text-center">
                    <div className="text-muted-foreground">
                        <p className="text-lg font-medium mb-2">Waiting for data...</p>
                        <p className="text-sm">
                            Metrics will appear here once analysis begins
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

interface MetricCardProps {
    title: string;
    value: number;
    unit?: string;
    trend?: 'up' | 'down' | 'stable';
    color?: 'blue' | 'green' | 'orange' | 'red';
}

function MetricCard({ title, value, unit = '', trend = 'stable', color = 'blue' }: MetricCardProps) {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-50 border-blue-200',
        green: 'text-green-600 bg-green-50 border-green-200',
        orange: 'text-orange-600 bg-orange-50 border-orange-200',
        red: 'text-red-600 bg-red-50 border-red-200',
    };

    const trendIcons = {
        up: '↑',
        down: '↓',
        stable: '→',
    };

    return (
        <div className={`border rounded-lg p-6 ${colorClasses[color]}`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">{title}</h3>
                <span className="text-xl">{trendIcons[trend]}</span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{value}</span>
                {unit && <span className="text-lg">{unit}</span>}
            </div>
        </div>
    );
}
