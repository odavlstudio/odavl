'use client';

import { useState } from 'react';
import { useProjects } from '@/lib/api-hooks';

interface GuardianResult {
  success: boolean;
  url: string;
  timestamp: string;
  scores: {
    accessibility: number;
    performance: number;
    security: number;
    seo: number;
    overall: number;
  };
  issues: {
    category: 'accessibility' | 'performance' | 'security' | 'seo';
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    impact: string;
    suggestion: string;
  }[];
}

export default function GuardianPage() {
  const { data: projects, loading: projectsLoading } = useProjects('ACTIVE');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [testUrl, setTestUrl] = useState<string>('');
  const [testTypes, setTestTypes] = useState<string[]>(['accessibility', 'performance', 'security', 'seo']);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<GuardianResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableTests = [
    { id: 'accessibility', name: 'Accessibility', description: 'WCAG 2.1 compliance, screen reader support' },
    { id: 'performance', name: 'Performance', description: 'Core Web Vitals, load times, optimization' },
    { id: 'security', name: 'Security', description: 'HTTPS, headers, CSP, OWASP checks' },
    { id: 'seo', name: 'SEO', description: 'Meta tags, structured data, crawlability' },
  ];

  const toggleTest = (testId: string) => {
    setTestTypes(prev =>
      prev.includes(testId)
        ? prev.filter(t => t !== testId)
        : [...prev, testId]
    );
  };

  const runTests = async () => {
    if (!testUrl) {
      setError('Please enter a URL to test');
      return;
    }

    if (testTypes.length === 0) {
      setError('Please select at least one test type');
      return;
    }

    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: testUrl,
          tests: testTypes,
          projectId: selectedProject || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tests failed');
    } finally {
      setRunning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'accessibility':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'performance':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'security':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'seo':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Guardian Testing</h1>
        <p className="text-gray-600">Test websites for accessibility, performance, security, and SEO</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>

            {/* URL Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Project Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project (optional)
              </label>
              {projectsLoading ? (
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {projects?.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Test Types */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Test Types ({testTypes.length} selected)
              </label>
              <div className="space-y-2">
                {availableTests.map((test) => (
                  <label
                    key={test.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={testTypes.includes(test.id)}
                      onChange={() => toggleTest(test.id)}
                      className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(test.id)}
                        <span className="font-medium text-gray-900">{test.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{test.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={runTests}
              disabled={running || !testUrl || testTypes.length === 0}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {running ? 'Running Tests...' : 'Run Tests'}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {result ? (
            <>
              {/* Score Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className={`p-4 rounded-lg shadow-sm border ${getScoreColor(result.scores.overall)}`}>
                  <div className="text-xs font-medium mb-1">Overall</div>
                  <div className="text-3xl font-bold">{result.scores.overall}</div>
                </div>
                {testTypes.includes('accessibility') && (
                  <div className={`p-4 rounded-lg shadow-sm border ${getScoreColor(result.scores.accessibility)}`}>
                    <div className="text-xs font-medium mb-1">Accessibility</div>
                    <div className="text-2xl font-bold">{result.scores.accessibility}</div>
                  </div>
                )}
                {testTypes.includes('performance') && (
                  <div className={`p-4 rounded-lg shadow-sm border ${getScoreColor(result.scores.performance)}`}>
                    <div className="text-xs font-medium mb-1">Performance</div>
                    <div className="text-2xl font-bold">{result.scores.performance}</div>
                  </div>
                )}
                {testTypes.includes('security') && (
                  <div className={`p-4 rounded-lg shadow-sm border ${getScoreColor(result.scores.security)}`}>
                    <div className="text-xs font-medium mb-1">Security</div>
                    <div className="text-2xl font-bold">{result.scores.security}</div>
                  </div>
                )}
                {testTypes.includes('seo') && (
                  <div className={`p-4 rounded-lg shadow-sm border ${getScoreColor(result.scores.seo)}`}>
                    <div className="text-xs font-medium mb-1">SEO</div>
                    <div className="text-2xl font-bold">{result.scores.seo}</div>
                  </div>
                )}
              </div>

              {/* Test Metadata */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-6">
                <div className="flex items-center justify-between text-sm text-blue-800">
                  <div>
                    <span className="font-medium">URL:</span> {result.url}
                  </div>
                  <div>
                    <span className="font-medium">Tested:</span> {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Issues List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">Issues Found ({result.issues.length})</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {result.issues.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 mb-1">Perfect score!</p>
                      <p className="text-sm text-gray-500">No issues detected in selected categories.</p>
                    </div>
                  ) : (
                    result.issues.map((issue, index) => (
                      <div key={index} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 text-gray-500">
                            {getCategoryIcon(issue.category)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded mr-2 ${
                                  issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                  issue.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                  issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {issue.severity.toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-500 capitalize">{issue.category}</span>
                              </div>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-2">{issue.message}</p>
                            <p className="text-xs text-gray-600 mb-2">
                              <span className="font-medium">Impact: </span>
                              {issue.impact}
                            </p>
                            {issue.suggestion && (
                              <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-800 mt-2">
                                <span className="font-medium">Recommendation: </span>
                                {issue.suggestion}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to test</h3>
              <p className="text-gray-500">Enter a URL and select test types to begin comprehensive testing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
