'use client';

import { useTranslations } from 'next-intl';
import { FolderOpen, AlertCircle, CheckCircle, Shield, TrendingUp, TrendingDown } from 'lucide-react';

export default function DashboardPage() {
  const t = useTranslations('dashboard');

  const stats = [
    {
      label: 'Active Projects',
      value: '12',
      change: '+2 this week',
      trend: 'up',
      icon: FolderOpen,
      color: 'blue'
    },
    {
      label: 'Issues Detected',
      value: '348',
      change: '-23% from last week',
      trend: 'down',
      icon: AlertCircle,
      color: 'red'
    },
    {
      label: 'Auto-Fixed',
      value: '187',
      change: '+15% from last week',
      trend: 'up',
      icon: CheckCircle,
      color: 'green'
    },
    {
      label: 'Tests Passed',
      value: '94%',
      change: '+2% from last week',
      trend: 'up',
      icon: Shield,
      color: 'purple'
    }
  ];

  const recentActivity = [
    {
      id: '1',
      type: 'insight',
      title: 'Critical security issue detected',
      description: 'Hardcoded API key found in auth.ts',
      timestamp: '2 hours ago',
      project: 'E-Commerce API',
      severity: 'critical'
    },
    {
      id: '2',
      type: 'autopilot',
      title: 'Auto-fix applied successfully',
      description: 'Fixed 12 ESLint violations in user-service',
      timestamp: '4 hours ago',
      project: 'User Service',
      severity: 'low'
    },
    {
      id: '3',
      type: 'guardian',
      title: 'Pre-deploy tests passed',
      description: 'All 47 tests passed for staging deployment',
      timestamp: '6 hours ago',
      project: 'Frontend App',
      severity: 'low'
    },
    {
      id: '4',
      type: 'insight',
      title: 'Performance issue detected',
      description: 'Slow database query in dashboard.tsx',
      timestamp: '1 day ago',
      project: 'Dashboard',
      severity: 'medium'
    },
  ];

  const projects = [
    { name: 'E-Commerce API', language: 'TypeScript', status: 'critical', issues: 23, lastScan: '2h ago' },
    { name: 'User Service', language: 'Python', status: 'healthy', issues: 2, lastScan: '4h ago' },
    { name: 'Frontend App', language: 'TypeScript', status: 'healthy', issues: 0, lastScan: '6h ago' },
    { name: 'Analytics Engine', language: 'Java', status: 'warning', issues: 8, lastScan: '1d ago' },
    { name: 'Payment Service', language: 'TypeScript', status: 'healthy', issues: 1, lastScan: '2d ago' },
    { name: 'Admin Dashboard', language: 'TypeScript', status: 'warning', issues: 5, lastScan: '3d ago' },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-500',
      red: 'bg-red-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
    };
    return colors[color] || 'bg-gray-500';
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      healthy: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('welcome')} 👋
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg ${getColorClasses(stat.color)} bg-opacity-10 flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
              </div>
              {stat.trend === 'up' ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </h3>
            <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
            <p className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed - 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl`}>
                    {activity.type === 'insight' && '🔍'}
                    {activity.type === 'autopilot' && '🤖'}
                    {activity.type === 'guardian' && '🛡️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">{activity.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(activity.severity)}`}>
                        {activity.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{activity.project}</span>
                      <span>•</span>
                      <span>{activity.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions - 1 column */}
        <div className="space-y-6">
          {/* Quick Stats Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Highlights</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tests Run</span>
                <span className="text-2xl font-bold text-gray-900">47</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Issues Fixed</span>
                <span className="text-2xl font-bold text-green-600">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="text-2xl font-bold text-blue-600">99.9%</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Ready to Start?</h3>
            <p className="text-blue-100 text-sm mb-4">
              Create a new project and start analyzing your code in minutes.
            </p>
            <button className="w-full bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Projects</h2>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{project.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>{project.language}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {project.issues} {project.issues === 1 ? 'issue' : 'issues'}
                </span>
                <span className="text-gray-500">{project.lastScan}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
