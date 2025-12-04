'use client';

import { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle, Filter, Search, FileCode, Calendar } from 'lucide-react';

type Severity = 'critical' | 'high' | 'medium' | 'low';
type DetectorType = 'typescript' | 'eslint' | 'security' | 'performance' | 'complexity' | 'import';

interface Issue {
  id: string;
  title: string;
  message: string;
  detector: DetectorType;
  severity: Severity;
  file: string;
  line: number;
  project: string;
  hasFix: boolean;
  timestamp: string;
}

export default function InsightPage() {
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [selectedDetector, setSelectedDetector] = useState<DetectorType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const issues: Issue[] = [
    {
      id: '1',
      title: 'Hardcoded API key detected',
      message: 'API key found in source code. This is a security risk.',
      detector: 'security',
      severity: 'critical',
      file: 'src/auth/config.ts',
      line: 15,
      project: 'E-Commerce API',
      hasFix: true,
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      title: 'Unused variable',
      message: 'Variable "tempData" is declared but never used.',
      detector: 'typescript',
      severity: 'low',
      file: 'src/utils/helpers.ts',
      line: 42,
      project: 'Frontend App',
      hasFix: true,
      timestamp: '3 hours ago'
    },
    {
      id: '3',
      title: 'High complexity function',
      message: 'Function has cyclomatic complexity of 25 (threshold: 10).',
      detector: 'complexity',
      severity: 'high',
      file: 'src/services/order-processor.ts',
      line: 88,
      project: 'E-Commerce API',
      hasFix: false,
      timestamp: '5 hours ago'
    },
    {
      id: '4',
      title: 'Missing error handling',
      message: 'Promise rejection not handled.',
      detector: 'typescript',
      severity: 'medium',
      file: 'src/api/payment.ts',
      line: 156,
      project: 'Payment Service',
      hasFix: true,
      timestamp: '1 day ago'
    },
    {
      id: '5',
      title: 'Slow database query',
      message: 'Query takes 2.5s on average. Consider adding indexes.',
      detector: 'performance',
      severity: 'high',
      file: 'src/models/user.ts',
      line: 234,
      project: 'User Service',
      hasFix: false,
      timestamp: '1 day ago'
    },
    {
      id: '6',
      title: 'Circular dependency',
      message: 'Circular import detected between modules.',
      detector: 'import',
      severity: 'medium',
      file: 'src/services/auth.ts',
      line: 12,
      project: 'User Service',
      hasFix: false,
      timestamp: '2 days ago'
    },
  ];

  const detectorStats = {
    typescript: issues.filter(i => i.detector === 'typescript').length,
    eslint: issues.filter(i => i.detector === 'eslint').length,
    security: issues.filter(i => i.detector === 'security').length,
    performance: issues.filter(i => i.detector === 'performance').length,
    complexity: issues.filter(i => i.detector === 'complexity').length,
    import: issues.filter(i => i.detector === 'import').length,
  };

  const severityStats = {
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
  };

  const getSeverityIcon = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: Severity) => {
    const colors: Record<Severity, string> = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[severity];
  };

  const getDetectorColor = (detector: DetectorType) => {
    const colors: Record<DetectorType, string> = {
      typescript: 'bg-blue-100 text-blue-800',
      eslint: 'bg-purple-100 text-purple-800',
      security: 'bg-red-100 text-red-800',
      performance: 'bg-green-100 text-green-800',
      complexity: 'bg-yellow-100 text-yellow-800',
      import: 'bg-indigo-100 text-indigo-800',
    };
    return colors[detector];
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSeverity = selectedSeverity === 'all' || issue.severity === selectedSeverity;
    const matchesDetector = selectedDetector === 'all' || issue.detector === selectedDetector;
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.file.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSeverity && matchesDetector && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Insight Reports</h1>
        <p className="text-gray-600 mt-1">ML-powered error detection and code quality analysis</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Issues</span>
            <AlertCircle className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{issues.length}</p>
          <p className="text-sm text-gray-500 mt-1">
            {severityStats.critical + severityStats.high} critical/high
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Auto-Fixable</span>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {issues.filter(i => i.hasFix).length}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {Math.round((issues.filter(i => i.hasFix).length / issues.length) * 100)}% of total
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Active Detectors</span>
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">12</p>
          <p className="text-sm text-gray-500 mt-1">All systems operational</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Trend</span>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-green-600">-15%</p>
          <p className="text-sm text-gray-500 mt-1">vs last week</p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Search</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Severity Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Severity</h3>
            <div className="space-y-2">
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((severity) => (
                <button
                  key={severity}
                  onClick={() => setSelectedSeverity(severity)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedSeverity === severity
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="capitalize">{severity}</span>
                  <span className="text-xs text-gray-500">
                    {severity === 'all' ? issues.length : severityStats[severity as Severity] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Detector Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Detectors</h3>
            <div className="space-y-2">
              {(['all', 'typescript', 'eslint', 'security', 'performance', 'complexity', 'import'] as const).map((detector) => (
                <button
                  key={detector}
                  onClick={() => setSelectedDetector(detector)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedDetector === detector
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="capitalize">{detector}</span>
                  <span className="text-xs text-gray-500">
                    {detector === 'all' ? issues.length : detectorStats[detector as DetectorType] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Issues ({filteredIssues.length})
              </h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Export Report
              </button>
            </div>

            <div className="space-y-4">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-4 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer ${getSeverityColor(issue.severity)}`}
                >
                  <div className="flex items-start gap-4">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">{issue.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDetectorColor(issue.detector)}`}>
                          {issue.detector}
                        </span>
                        {issue.hasFix && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Auto-fix available
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{issue.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <FileCode className="h-3 w-3" />
                          <span>{issue.file}:{issue.line}</span>
                        </div>
                        <span>•</span>
                        <span>{issue.project}</span>
                        <span>•</span>
                        <span>{issue.timestamp}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {issue.hasFix && (
                        <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                          Apply Fix
                        </button>
                      )}
                      <button className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
