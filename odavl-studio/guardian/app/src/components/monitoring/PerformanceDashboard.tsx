/**
 * Performance Monitoring Dashboard
 * 
 * Week 13: Beta Testing - Real-time Performance Metrics
 * 
 * Displays system health, error rates, API latency, and user analytics.
 */

'use client';

import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Users, Zap, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface PerformanceMetrics {
    uptime: number;
    errorRate: number;
    avgResponseTime: number;
    activeUsers: number;
    requestsPerMinute: number;
    memoryUsage: number;
    cpuUsage: number;
}

interface ErrorLog {
    id: string;
    timestamp: Date;
    message: string;
    stack?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    count: number;
}

export default function PerformanceDashboard() {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        uptime: 99.95,
        errorRate: 0.12,
        avgResponseTime: 145,
        activeUsers: 47,
        requestsPerMinute: 328,
        memoryUsage: 62,
        cpuUsage: 38,
    });

    const [errors, setErrors] = useState<ErrorLog[]>([
        {
            id: '1',
            timestamp: new Date(),
            message: 'TypeError: Cannot read property "map" of undefined',
            severity: 'high',
            count: 3,
        },
        {
            id: '2',
            timestamp: new Date(Date.now() - 300000),
            message: 'API timeout: /api/test-runs exceeded 30s',
            severity: 'medium',
            count: 1,
        },
    ]);

    useEffect(() => {
        // Simulate real-time updates
        const interval = setInterval(() => {
            setMetrics(prev => ({
                ...prev,
                activeUsers: prev.activeUsers + Math.floor(Math.random() * 5 - 2),
                requestsPerMinute: prev.requestsPerMinute + Math.floor(Math.random() * 20 - 10),
                avgResponseTime: Math.max(50, prev.avgResponseTime + Math.floor(Math.random() * 10 - 5)),
                errorRate: Math.max(0, prev.errorRate + (Math.random() * 0.1 - 0.05)),
            }));
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
        if (value >= thresholds.good) return 'text-green-600 dark:text-green-400';
        if (value >= thresholds.warning) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Performance Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Real-time system health and performance metrics
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Uptime */}
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <Activity className="w-8 h-8 text-green-600 dark:text-green-400" />
                        <span className={`text-2xl font-bold ${getStatusColor(metrics.uptime, { good: 99.5, warning: 99 })}`}>
                            {metrics.uptime.toFixed(2)}%
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Last 30 days</p>
                </div>

                {/* Error Rate */}
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                        <span className={`text-2xl font-bold ${getStatusColor(100 - metrics.errorRate, { good: 99.5, warning: 99 })}`}>
                            {metrics.errorRate.toFixed(2)}%
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Error Rate</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Last 24 hours</p>
                </div>

                {/* Active Users */}
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {metrics.activeUsers}
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</h3>
                    <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3 text-green-600" />
                        <p className="text-xs text-green-600 dark:text-green-400">+12% from yesterday</p>
                    </div>
                </div>

                {/* Response Time */}
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        <span className={`text-2xl font-bold ${getStatusColor(500 - metrics.avgResponseTime, { good: 300, warning: 200 })}`}>
                            {metrics.avgResponseTime}ms
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">p(95) latency</p>
                </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Resources */}
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        System Resources
                    </h3>

                    <div className="space-y-4">
                        {/* CPU Usage */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">CPU Usage</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{metrics.cpuUsage}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                                    style={{ width: `${metrics.cpuUsage}%` }}
                                />
                            </div>
                        </div>

                        {/* Memory Usage */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Memory Usage</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{metrics.memoryUsage}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                                    style={{ width: `${metrics.memoryUsage}%` }}
                                />
                            </div>
                        </div>

                        {/* Requests Per Minute */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Requests/min</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{metrics.requestsPerMinute}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-600 transition-all duration-500"
                                    style={{ width: `${(metrics.requestsPerMinute / 500) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Errors */}
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Recent Errors
                        </h3>
                        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            View All
                        </button>
                    </div>

                    <div className="space-y-3">
                        {errors.map((error) => {
                            const severityColors = {
                                low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
                                medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
                                high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
                                critical: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
                            };

                            return (
                                <div
                                    key={error.id}
                                    className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${severityColors[error.severity]}`}>
                                                    {error.severity.toUpperCase()}
                                                </span>
                                                {error.count > 1 && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        ×{error.count}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-900 dark:text-white truncate">
                                                {error.message}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                <Clock className="w-3 h-3" />
                                                {formatTimestamp(error.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* API Endpoints Performance */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Top API Endpoints
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-800">
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Endpoint</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Requests</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Avg Time</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Error Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { endpoint: '/api/test-runs', requests: 1234, avgTime: 145, errorRate: 0.1 },
                                { endpoint: '/api/monitors', requests: 892, avgTime: 89, errorRate: 0.05 },
                                { endpoint: '/api/health', requests: 2456, avgTime: 12, errorRate: 0 },
                                { endpoint: '/api/analytics', requests: 567, avgTime: 234, errorRate: 0.3 },
                            ].map((row, index) => (
                                <tr key={index} className="border-b border-gray-100 dark:border-gray-800/50">
                                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{row.endpoint}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">{row.requests.toLocaleString()}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">{row.avgTime}ms</td>
                                    <td className="py-3 px-4 text-sm text-right">
                                        <span className={row.errorRate > 0.2 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                                            {row.errorRate.toFixed(2)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function formatTimestamp(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}
