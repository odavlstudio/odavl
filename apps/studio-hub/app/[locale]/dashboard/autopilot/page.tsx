'use client';

import { useState } from 'react';
import { Play, Clock, CheckCircle, XCircle, FileEdit, TrendingUp, Calendar, Filter } from 'lucide-react';

type RunStatus = 'running' | 'success' | 'failed';

interface AutopilotRun {
  id: string;
  project: string;
  startedAt: string;
  duration: string;
  status: RunStatus;
  filesChanged: number;
  locChanged: number;
  trustScore: number;
  phase: string;
}

export default function AutopilotPage() {
  const [selectedStatus, setSelectedStatus] = useState<RunStatus | 'all'>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const runs: AutopilotRun[] = [
    {
      id: 'run-001',
      project: 'E-Commerce API',
      startedAt: '2 hours ago',
      duration: '3m 45s',
      status: 'success',
      filesChanged: 5,
      locChanged: 127,
      trustScore: 0.92,
      phase: 'Learn'
    },
    {
      id: 'run-002',
      project: 'User Service',
      startedAt: '4 hours ago',
      duration: '2m 18s',
      status: 'success',
      filesChanged: 3,
      locChanged: 48,
      trustScore: 0.88,
      phase: 'Learn'
    },
    {
      id: 'run-003',
      project: 'Frontend App',
      startedAt: '6 hours ago',
      duration: '5m 12s',
      status: 'running',
      filesChanged: 0,
      locChanged: 0,
      trustScore: 0,
      phase: 'Act'
    },
    {
      id: 'run-004',
      project: 'Payment Service',
      startedAt: '1 day ago',
      duration: '4m 32s',
      status: 'failed',
      filesChanged: 2,
      locChanged: 34,
      trustScore: 0.65,
      phase: 'Verify'
    },
    {
      id: 'run-005',
      project: 'Analytics Engine',
      startedAt: '2 days ago',
      duration: '6m 05s',
      status: 'success',
      filesChanged: 8,
      locChanged: 215,
      trustScore: 0.95,
      phase: 'Learn'
    },
  ];

  const projects = ['all', 'E-Commerce API', 'User Service', 'Frontend App', 'Payment Service', 'Analytics Engine'];

  const statusStats = {
    success: runs.filter(r => r.status === 'success').length,
    running: runs.filter(r => r.status === 'running').length,
    failed: runs.filter(r => r.status === 'failed').length,
  };

  const totalFilesChanged = runs.filter(r => r.status === 'success').reduce((sum, r) => sum + r.filesChanged, 0);
  const totalLocChanged = runs.filter(r => r.status === 'success').reduce((sum, r) => sum + r.locChanged, 0);
  const averageTrustScore = runs.filter(r => r.status === 'success').reduce((sum, r) => sum + r.trustScore, 0) / statusStats.success;

  const getStatusIcon = (status: RunStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'running':
        return <Play className="h-5 w-5 text-blue-600 animate-pulse" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: RunStatus) => {
    const colors: Record<RunStatus, string> = {
      success: 'bg-green-100 text-green-800',
      running: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredRuns = runs.filter(run => {
    const matchesStatus = selectedStatus === 'all' || run.status === selectedStatus;
    const matchesProject = selectedProject === 'all' || run.project === selectedProject;
    return matchesStatus && matchesProject;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Autopilot Runs</h1>
          <p className="text-gray-600 mt-1">Self-healing code infrastructure with O-D-A-V-L cycle</p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg">
          <Play className="h-5 w-5" />
          Start New Run
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Runs</span>
            <Play className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{runs.length}</p>
          <p className="text-sm text-green-600 mt-1">
            {statusStats.success} successful
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Files Changed</span>
            <FileEdit className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalFilesChanged}</p>
          <p className="text-sm text-gray-500 mt-1">
            {totalLocChanged} lines of code
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Trust Score</span>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <p className={`text-3xl font-bold ${getTrustScoreColor(averageTrustScore)}`}>
            {(averageTrustScore * 100).toFixed(0)}%
          </p>
          <p className="text-sm text-gray-500 mt-1">Last 5 runs</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Active Now</span>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{statusStats.running}</p>
          <p className="text-sm text-gray-500 mt-1">In progress</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Project Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {projects.map(project => (
                <option key={project} value={project}>
                  {project === 'all' ? 'All Projects' : project}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as RunStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="running">Running</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <button className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700">Last 7 days</span>
            </button>
          </div>
        </div>
      </div>

      {/* Runs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Run ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Changes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trust Score
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRuns.map((run) => (
                <tr key={run.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(run.status)}
                      <span className="text-sm font-mono text-gray-900">{run.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{run.project}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{run.startedAt}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{run.duration}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <span className="text-gray-900 font-medium">{run.filesChanged} files</span>
                      <span className="text-gray-500 ml-2">({run.locChanged} LOC)</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {run.trustScore > 0 ? (
                      <span className={`text-sm font-semibold ${getTrustScoreColor(run.trustScore)}`}>
                        {(run.trustScore * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium mr-4">
                      View
                    </button>
                    {run.status === 'success' && (
                      <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                        Undo
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* O-D-A-V-L Cycle Explanation */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">O-D-A-V-L Cycle Phases</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl mx-auto mb-2">
              O
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Observe</h4>
            <p className="text-xs text-gray-600">Detect issues & metrics</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl mx-auto mb-2">
              D
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Decide</h4>
            <p className="text-xs text-gray-600">Select best recipe</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl mx-auto mb-2">
              A
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Act</h4>
            <p className="text-xs text-gray-600">Apply changes safely</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl mx-auto mb-2">
              V
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Verify</h4>
            <p className="text-xs text-gray-600">Test & validate</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white text-xl mx-auto mb-2">
              L
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Learn</h4>
            <p className="text-xs text-gray-600">Update trust scores</p>
          </div>
        </div>
      </div>
    </div>
  );
}
