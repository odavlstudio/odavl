import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { http } from '@/lib/utils/fetch';

export const metadata = {
  title: 'System Monitoring - ODAVL Studio',
  description: 'Real-time system health and performance monitoring',
};

// Disable static generation - requires session context
export const dynamic = 'force-dynamic';

async function getHealthStatus() {
  try {
    const res = await http.get(`${process.env.NEXT_PUBLIC_APP_URL}/api/health`, {
      cache: 'no-store',
    });
    return res.data;
  } catch (error) {
    return { status: 'unhealthy', error: 'Failed to fetch health status' };
  }
}

async function getMetrics() {
  try {
    const res = await http.get(`${process.env.NEXT_PUBLIC_APP_URL}/api/analytics/metrics?range=24h`, {
      cache: 'no-store',
    });
    return res.data;
  } catch (error) {
    return { metrics: [] };
  }
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    healthy: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100',
      text: 'Healthy',
    },
    degraded: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      text: 'Degraded',
    },
    unhealthy: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-100',
      text: 'Unhealthy',
    },
  };

  const { icon: Icon, color, bg, text } = config[status as keyof typeof config] || config.unhealthy;

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${bg}`}>
      <Icon className={`w-5 h-5 ${color}`} />
      <span className={`font-medium ${color}`}>{text}</span>
    </div>
  );
}

async function HealthDashboard() {
  const health = await getHealthStatus();
  const metricsData = await getMetrics();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-gray-600 mt-2">Real-time health and performance metrics</p>
        </div>
        <StatusBadge status={health.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={health.checks?.database?.status === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {health.checks?.database?.status || 'unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Response Time:</span>
                <span>{health.checks?.database?.responseTime?.toFixed(2) || 'N/A'}ms</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Used:</span>
                <span>{((health.checks?.memory?.used || 0) / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span>{((health.checks?.memory?.total || 0) / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Percentage:</span>
                <span className={health.checks?.memory?.percentage > 90 ? 'text-red-600' : 'text-green-600'}>
                  {health.checks?.memory?.percentage?.toFixed(1) || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.floor((health.checks?.uptime || 0) / 3600)}h {Math.floor(((health.checks?.uptime || 0) % 3600) / 60)}m
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Since: {new Date(Date.now() - (health.checks?.uptime || 0) * 1000).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics (Last 24h)</CardTitle>
        </CardHeader>
        <CardContent>
          {metricsData.metrics.length === 0 ? (
            <p className="text-gray-600">No metrics available</p>
          ) : (
            <div className="space-y-4">
              {metricsData.metrics.map((metric: { name: string; _count: number; _avg: { value: number }; _min: { value: number }; _max: { value: number } }) => (
                <div key={metric.name} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{metric.name}</span>
                    <span className="text-gray-600">{metric._count} samples</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Avg:</span>
                      <span className="ml-2 font-medium">{metric._avg.value?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Min:</span>
                      <span className="ml-2 font-medium">{metric._min.value?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Max:</span>
                      <span className="ml-2 font-medium">{metric._max.value?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function MonitoringPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading monitoring data...</div>}>
      <HealthDashboard />
    </Suspense>
  );
}
