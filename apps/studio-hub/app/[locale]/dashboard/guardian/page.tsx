'use client';

import { useState } from 'react';
import { Play, Eye, Zap, Shield, Search, CheckCircle, AlertTriangle, XCircle, TrendingUp, Globe } from 'lucide-react';

type TestStatus = 'passed' | 'warning' | 'failed';

interface TestResult {
  id: string;
  url: string;
  timestamp: string;
  status: TestStatus;
  overallScore: number;
  accessibility: {
    score: number;
    issues: number;
  };
  performance: {
    score: number;
    lcp: number;
    fid: number;
    cls: number;
  };
  security: {
    score: number;
    issues: number;
  };
}

export default function GuardianPage() {
  const [testUrl, setTestUrl] = useState('');

  const tests: TestResult[] = [
    {
      id: 'test-001',
      url: 'https://app.example.com',
      timestamp: '2 hours ago',
      status: 'passed',
      overallScore: 94,
      accessibility: { score: 96, issues: 2 },
      performance: { score: 92, lcp: 1.2, fid: 45, cls: 0.05 },
      security: { score: 95, issues: 1 }
    },
    {
      id: 'test-002',
      url: 'https://staging.example.com',
      timestamp: '4 hours ago',
      status: 'warning',
      overallScore: 78,
      accessibility: { score: 85, issues: 8 },
      performance: { score: 72, lcp: 2.8, fid: 120, cls: 0.15 },
      security: { score: 88, issues: 3 }
    },
    {
      id: 'test-003',
      url: 'https://dev.example.com',
      timestamp: '1 day ago',
      status: 'failed',
      overallScore: 52,
      accessibility: { score: 64, issues: 15 },
      performance: { score: 48, lcp: 4.5, fid: 280, cls: 0.35 },
      security: { score: 58, issues: 12 }
    },
  ];

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: TestStatus) => {
    const colors: Record<TestStatus, string> = {
      passed: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const averageScore = Math.round(tests.reduce((sum, t) => sum + t.overallScore, 0) / tests.length);
  const totalTests = tests.length;
  const passedTests = tests.filter(t => t.status === 'passed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Guardian Testing</h1>
        <p className="text-gray-600 mt-1">Pre-deploy testing for accessibility, performance, and security</p>
      </div>

      {/* Run New Test Card */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Run New Test</h2>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="url"
              placeholder="https://example.com"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-3 rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all shadow-lg">
            <Play className="h-5 w-5" />
            Run Test
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          Tests include: Accessibility (WCAG 2.1), Performance (Core Web Vitals), Security (OWASP), and SEO
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Tests</span>
            <Shield className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalTests}</p>
          <p className="text-sm text-green-600 mt-1">{passedTests} passed</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Average Score</span>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <p className={`text-3xl font-bold ${getScoreColor(averageScore)}`}>
            {averageScore}
          </p>
          <p className="text-sm text-gray-500 mt-1">Out of 100</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Pass Rate</span>
            <CheckCircle className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            {Math.round((passedTests / totalTests) * 100)}%
          </p>
          <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Issues Found</span>
            <AlertTriangle className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-orange-600">
            {tests.reduce((sum, t) => sum + t.accessibility.issues + t.security.issues, 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Across all tests</p>
        </div>
      </div>

      {/* Test Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Accessibility Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Accessibility</h3>
              <p className="text-sm text-gray-600">WCAG 2.1 AA</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Score</span>
              <span className="text-2xl font-bold text-blue-600">
                {Math.round(tests.reduce((sum, t) => sum + t.accessibility.score, 0) / tests.length)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Issues</span>
              <span className="text-lg font-semibold text-gray-900">
                {tests.reduce((sum, t) => sum + t.accessibility.issues, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
              <p className="text-sm text-gray-600">Core Web Vitals</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Score</span>
              <span className="text-2xl font-bold text-green-600">
                {Math.round(tests.reduce((sum, t) => sum + t.performance.score, 0) / tests.length)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">LCP</span>
              <span className="font-semibold text-gray-900">
                {(tests.reduce((sum, t) => sum + t.performance.lcp, 0) / tests.length).toFixed(1)}s
              </span>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Security</h3>
              <p className="text-sm text-gray-600">OWASP Top 10</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Score</span>
              <span className="text-2xl font-bold text-red-600">
                {Math.round(tests.reduce((sum, t) => sum + t.security.score, 0) / tests.length)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Vulnerabilities</span>
              <span className="text-lg font-semibold text-gray-900">
                {tests.reduce((sum, t) => sum + t.security.issues, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Tests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overall Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accessibility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Security
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tested
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tests.map((test) => (
                <tr key={test.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(test.status)}
                      <span className="text-sm text-gray-900 truncate max-w-xs">{test.url}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                      {test.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className={`w-12 h-12 rounded-lg ${getScoreBgColor(test.overallScore)} flex items-center justify-center`}>
                        <span className={`text-lg font-bold ${getScoreColor(test.overallScore)}`}>
                          {test.overallScore}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <span className={`font-semibold ${getScoreColor(test.accessibility.score)}`}>
                        {test.accessibility.score}
                      </span>
                      <span className="text-gray-500 ml-1">({test.accessibility.issues} issues)</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <span className={`font-semibold ${getScoreColor(test.performance.score)}`}>
                        {test.performance.score}
                      </span>
                      <span className="text-gray-500 ml-1">LCP: {test.performance.lcp}s</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <span className={`font-semibold ${getScoreColor(test.security.score)}`}>
                        {test.security.score}
                      </span>
                      <span className="text-gray-500 ml-1">({test.security.issues} issues)</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{test.timestamp}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      View Details
                    </button>
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
