'use client';

/**
 * Guardian Test Results Dashboard Component
 * Week 11 Day 3 - Integrate Guardian with Insight Cloud
 */

import { useState, useEffect } from 'react';
import { ExportButton } from '@/components/ExportButton';
import { Shield, Zap, Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface GuardianTestResult {
  id: string;
  url: string;
  timestamp: string;
  tests: {
    accessibility?: {
      score: number;
      violations: number;
      passes: number;
    };
    performance?: {
      scores: {
        performance: number;
        accessibility: number;
        bestPractices: number;
        seo: number;
      };
    };
    security?: {
      score: number;
      vulnerabilities: number;
    };
  };
  overallScore: number;
  passed: boolean;
  duration: number;
}

export default function GuardianDashboard() {
  const [results, setResults] = useState<GuardianTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load test results from API
    const loadResults = async () => {
      try {
        const response = await fetch('/api/guardian?limit=50');
        if (!response.ok) {
          throw new Error('Failed to load test results');
        }
        
        const data = await response.json();
        
        // Transform API data to component format
        const transformedResults: GuardianTestResult[] = data.tests.map((test: any) => ({
          id: test.id,
          url: test.url,
          timestamp: test.timestamp,
          tests: {
            accessibility: test.accessibilityScore ? {
              score: test.accessibilityScore,
              violations: test.accessibilityViolations || 0,
              passes: test.accessibilityPasses || 0,
            } : undefined,
            performance: test.performanceScore ? {
              scores: {
                performance: test.performanceScore,
                accessibility: test.performanceAccessibility || 0,
                bestPractices: test.performanceBestPractices || 0,
                seo: test.performanceSEO || 0,
              },
            } : undefined,
            security: test.securityScore ? {
              score: test.securityScore,
              vulnerabilities: test.securityVulnerabilities || 0,
            } : undefined,
          },
          overallScore: test.overallScore,
          passed: test.passed,
          duration: test.duration,
        }));
        
        setResults(transformedResults);
      } catch (err) {
        console.error('Failed to load Guardian results:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, []);

  const summary = {
    totalTests: results.length,
    passed: results.filter(r => r.passed).length,
    avgOverallScore: results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.overallScore, 0) / results.length)
      : 0,
    avgAccessibility: results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + (r.tests.accessibility?.score || 0), 0) / results.length)
      : 0,
    avgPerformance: results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + (r.tests.performance?.scores.performance || 0), 0) / results.length)
      : 0,
    avgSecurity: results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + (r.tests.security?.score || 0), 0) / results.length)
      : 0,
  };

  const exportData = results.map(r => ({
    url: r.url,
    timestamp: r.timestamp,
    accessibility: r.tests.accessibility?.score || 0,
    performance: r.tests.performance?.scores.performance || 0,
    security: r.tests.security?.score || 0,
    overall: r.overallScore,
    passed: r.passed ? 'Yes' : 'No',
    duration: `${(r.duration / 1000).toFixed(1)}s`,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-600 dark:text-gray-400">
          Loading Guardian results...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Failed to Load Results</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">🔰 Guardian Test Results</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Pre-deploy quality testing and monitoring
          </p>
        </div>
        
        {results.length > 0 && (
          <ExportButton data={exportData} filename="guardian-results" />
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">Total Tests</span>
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold">{summary.totalTests}</div>
          <div className="text-sm text-gray-500 mt-1">
            {summary.passed}/{summary.totalTests} passed
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">Accessibility</span>
            <Eye className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold">{summary.avgAccessibility}/100</div>
          <div className="text-sm text-gray-500 mt-1">Average score</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">Performance</span>
            <Zap className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold">{summary.avgPerformance}/100</div>
          <div className="text-sm text-gray-500 mt-1">Average score</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">Security</span>
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold">{summary.avgSecurity}/100</div>
          <div className="text-sm text-gray-500 mt-1">Average score</div>
        </div>
      </div>

      {/* Test Results Table */}
      {results.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No test results yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Run Guardian tests to see results here
          </p>
          <code className="block bg-gray-100 dark:bg-gray-900 px-4 py-2 rounded-lg text-sm">
            guardian test https://your-site.com --json &gt; results.json
          </code>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ♿ A11y
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ⚡ Perf
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  🔒 Sec
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overall
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {results.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                      {result.url}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      (result.tests.accessibility?.score || 0) >= 80
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : (result.tests.accessibility?.score || 0) >= 60
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {result.tests.accessibility?.score || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      (result.tests.performance?.scores.performance || 0) >= 80
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : (result.tests.performance?.scores.performance || 0) >= 60
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {result.tests.performance?.scores.performance || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      (result.tests.security?.score || 0) >= 80
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : (result.tests.security?.score || 0) >= 60
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {result.tests.security?.score || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold">{result.overallScore}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {result.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">
                    {(result.duration / 1000).toFixed(1)}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
