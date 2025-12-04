'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    CheckCircle2,
    XCircle,
    Clock,
    Activity,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Eye,
    PlayCircle,
    StopCircle
} from 'lucide-react';

interface TestRun {
    id: string;
    type: string;
    status: 'pending' | 'running' | 'passed' | 'failed';
    duration?: number;
    passedCount: number;
    failedCount: number;
    errorCount: number;
    warningCount: number;
    createdAt: string;
    completedAt?: string;
}

interface Monitor {
    id: string;
    name: string;
    url: string;
    status: 'up' | 'down' | 'unknown';
    uptime: number;
    lastResponseTime: number;
    lastCheckedAt: string;
}

interface DashboardStats {
    totalTests: number;
    passRate: number;
    avgDuration: number;
    activeMonitors: number;
    avgUptime: number;
}

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6'];

export default function DashboardPage() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [testRuns, setTestRuns] = useState<TestRun[]>([]);
    const [monitors, setMonitors] = useState<Monitor[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        totalTests: 0,
        passRate: 0,
        avgDuration: 0,
        activeMonitors: 0,
        avgUptime: 0
    });
    const [loading, setLoading] = useState(true);

    // Throttle state updates to avoid excessive re-renders
    const [updateDebounceTimer, setUpdateDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    const throttledUpdate = useCallback((updateFn: () => void) => {
        if (updateDebounceTimer) {
            clearTimeout(updateDebounceTimer);
        }
        const timer = setTimeout(() => {
            updateFn();
        }, 500); // Update at most every 500ms
        setUpdateDebounceTimer(timer);
    }, [updateDebounceTimer]);

    // Initialize Socket.IO connection
    useEffect(() => {
        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
            transports: ['websocket'],
            reconnection: true
        });

        newSocket.on('connect', () => {
            console.log('[Dashboard] Connected to socket server');
        });

        newSocket.on('test:update', (testRun: TestRun) => {
            console.log('[Dashboard] Test update:', testRun);
            throttledUpdate(() => {
                setTestRuns(prev => {
                    const index = prev.findIndex(t => t.id === testRun.id);
                    if (index >= 0) {
                        const updated = [...prev];
                        updated[index] = testRun;
                        return updated;
                    }
                    return [testRun, ...prev].slice(0, 50); // Keep last 50
                });
            });
        });

        newSocket.on('monitor:update', (monitor: Monitor) => {
            console.log('[Dashboard] Monitor update:', monitor);
            throttledUpdate(() => {
                setMonitors(prev => {
                    const index = prev.findIndex(m => m.id === monitor.id);
                    if (index >= 0) {
                        const updated = [...prev];
                        updated[index] = monitor;
                        return updated;
                    }
                    return [...prev, monitor];
                });
            });
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    // Fetch initial data
    useEffect(() => {
        Promise.all([
            fetch('/api/test-runs?limit=50').then(r => r.json()),
            fetch('/api/monitors').then(r => r.json())
        ])
            .then(([testRunsData, monitorsData]) => {
                setTestRuns(testRunsData);
                setMonitors(monitorsData);
                calculateStats(testRunsData, monitorsData);
                setLoading(false);
            })
            .catch(error => {
                console.error('[Dashboard] Failed to fetch data:', error);
                setLoading(false);
            });
    }, []);

    // Recalculate stats when data changes
    useEffect(() => {
        if (testRuns.length > 0 || monitors.length > 0) {
            calculateStats(testRuns, monitors);
        }
    }, [testRuns, monitors]);

    const calculateStats = (runs: TestRun[], mons: Monitor[]) => {
        const completedRuns = runs.filter(r => r.status === 'passed' || r.status === 'failed');
        const passedRuns = runs.filter(r => r.status === 'passed');
        const durations = completedRuns
            .filter(r => r.duration)
            .map(r => r.duration!);

        const activeMonitors = mons.filter(m => m.status === 'up').length;
        const totalUptime = mons.reduce((sum, m) => sum + m.uptime, 0);

        setStats({
            totalTests: runs.length,
            passRate: completedRuns.length > 0 ? (passedRuns.length / completedRuns.length) * 100 : 0,
            avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
            activeMonitors,
            avgUptime: mons.length > 0 ? totalUptime / mons.length : 0
        });
    };

    // Prepare chart data
    const testResultsData = testRuns
        .filter(t => t.status === 'passed' || t.status === 'failed')
        .slice(0, 10)
        .reverse()
        .map(t => ({
            name: new Date(t.createdAt).toLocaleTimeString(),
            passed: t.passedCount,
            failed: t.failedCount,
            errors: t.errorCount,
            warnings: t.warningCount
        }));

    const testTypeDistribution = Object.entries(
        testRuns.reduce((acc, t) => {
            acc[t.type] = (acc[t.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));

    const monitorUptimeData = monitors
        .slice(0, 10)
        .map(m => ({
            name: m.name,
            uptime: m.uptime,
            responseTime: m.lastResponseTime
        }));

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'passed':
            case 'up':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'failed':
            case 'down':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'running':
                return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
            default:
                return <Activity className="h-5 w-5 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            passed: 'default',
            failed: 'destructive',
            running: 'secondary',
            pending: 'outline',
            up: 'default',
            down: 'destructive'
        };

        return (
            <Badge variant={variants[status] || 'outline'}>
                {status}
            </Badge>
        );
    };

    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <ErrorBoundary>
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Guardian Dashboard</h1>
                        <p className="text-gray-500 mt-1">Real-time testing and monitoring overview</p>
                    </div>
                    <div className="flex gap-2">
                        <ThemeToggle />
                        <Button variant="outline">
                            <Eye className="mr-2 h-4 w-4" />
                            View Reports
                        </Button>
                        <Button>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Run Tests
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                            <Activity className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalTests}</div>
                            <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                            {stats.passRate >= 90 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</div>
                            <p className="text-xs text-gray-500 mt-1">
                                {stats.passRate >= 90 ? 'Excellent' : 'Needs attention'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                            <Clock className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(stats.avgDuration / 1000).toFixed(1)}s
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Per test run</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Active Monitors</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.activeMonitors} / {monitors.length}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {stats.avgUptime.toFixed(1)}% avg uptime
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Tabs defaultValue="tests" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="tests">Test Runs</TabsTrigger>
                        <TabsTrigger value="monitors">Monitors</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>

                    {/* Test Runs Tab */}
                    <TabsContent value="tests" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Test Results Over Time</CardTitle>
                                <CardDescription>Last 10 test runs</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={testResultsData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="passed" fill="#22c55e" name="Passed" />
                                        <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                                        <Bar dataKey="errors" fill="#f59e0b" name="Errors" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Test Runs</CardTitle>
                                <CardDescription>Real-time test execution status</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {testRuns.length === 0 ? (
                                    <EmptyState
                                        title="No test runs yet"
                                        description="Start your first test run to see results here"
                                        actionLabel="Run Tests"
                                        onAction={() => window.location.href = '/api/test-runs'}
                                    />
                                ) : (
                                    <div className="space-y-2">
                                        {testRuns.slice(0, 10).map(test => (
                                            <div
                                                key={test.id}
                                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {getStatusIcon(test.status)}
                                                    <div>
                                                        <div className="font-medium">{test.type.toUpperCase()}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {new Date(test.createdAt).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {test.duration && (
                                                        <span className="text-sm text-gray-500">
                                                            {(test.duration / 1000).toFixed(1)}s
                                                        </span>
                                                    )}
                                                    {getStatusBadge(test.status)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Monitors Tab */}
                    <TabsContent value="monitors" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Monitor Uptime</CardTitle>
                                <CardDescription>Last 10 monitors</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={monitorUptimeData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" domain={[0, 100]} />
                                        <YAxis dataKey="name" type="category" width={150} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="uptime" fill="#22c55e" name="Uptime %" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Active Monitors</CardTitle>
                                <CardDescription>Current monitoring status</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {monitors.map(monitor => (
                                        <div
                                            key={monitor.id}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                {getStatusIcon(monitor.status)}
                                                <div>
                                                    <div className="font-medium">{monitor.name}</div>
                                                    <div className="text-sm text-gray-500">{monitor.url}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <div className="text-sm font-medium">
                                                        {monitor.uptime.toFixed(1)}%
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {monitor.lastResponseTime}ms
                                                    </div>
                                                </div>
                                                {getStatusBadge(monitor.status)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Analytics Tab */}
                    <TabsContent value="analytics" className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Test Type Distribution</CardTitle>
                                    <CardDescription>Test runs by type</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={testTypeDistribution}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry) => `${entry.name}: ${entry.value}`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {testTypeDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Response Time Trend</CardTitle>
                                    <CardDescription>Monitor response times</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={monitorUptimeData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="responseTime"
                                                stroke="#3b82f6"
                                                name="Response Time (ms)"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </ErrorBoundary>
    );
}
