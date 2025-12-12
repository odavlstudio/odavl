'use client';

import { useState } from 'react';
import { apiClient, AnalysisResult } from '@/lib/api-client';
import { useProjects } from '@/lib/api-hooks';

export default function InsightsPage() {
  const { data: projects, loading: projectsLoading } = useProjects('ACTIVE');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedDetectors, setSelectedDetectors] = useState<string[]>(['typescript', 'eslint', 'security']);
  const [analysisPath, setAnalysisPath] = useState<string>('.');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableDetectors = [
    { id: 'typescript', name: 'TypeScript', description: 'Type errors and strict mode violations' },
    { id: 'eslint', name: 'ESLint', description: 'Code quality and style issues' },
    { id: 'security', name: 'Security', description: 'Security vulnerabilities and hardcoded secrets' },
    { id: 'performance', name: 'Performance', description: 'Performance bottlenecks and inefficiencies' },
    { id: 'complexity', name: 'Complexity', description: 'High complexity functions and classes' },
    { id: 'import', name: 'Import', description: 'Unused imports and missing dependencies' },
    { id: 'circular', name: 'Circular', description: 'Circular dependencies' },
  ];

  const toggleDetector = (detectorId: string) => {
    setSelectedDetectors(prev =>
      prev.includes(detectorId)
        ? prev.filter(d => d !== detectorId)
        : [...prev, detectorId]
    );
  };

  const runAnalysis = async () => {
    if (selectedDetectors.length === 0) {
      setError('Please select at least one detector');
      return;
    }

    setRunning(true);
    setError(null);
    setResults(null);

    try {
      const result = await apiClient.runAnalysis({
        detectors: selectedDetectors,
        path: analysisPath,
        projectId: selectedProject || undefined,
      });
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setRunning(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Insight Analysis</h1>
        <p className="text-gray-600">Detect errors, security vulnerabilities, and code quality issues</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>

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
                  <option value="">All projects</option>
                  {projects?.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Path Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Path
              </label>
              <input
                type="text"
                value={analysisPath}
                onChange={(e) => setAnalysisPath(e.target.value)}
                placeholder="."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Relative to workspace root</p>
            </div>

            {/* Detector Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Detectors ({selectedDetectors.length} selected)
              </label>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableDetectors.map((detector) => (
                  <label
                    key={detector.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDetectors.includes(detector.id)}
                      onChange={() => toggleDetector(detector.id)}
                      className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{detector.name}</div>
                      <div className="text-xs text-gray-500">{detector.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={runAnalysis}
              disabled={running || selectedDetectors.length === 0}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {running ? 'Running Analysis...' : 'Run Analysis'}
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

          {results ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Total Issues</div>
                  <div className="text-2xl font-bold">{results.summary.total}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-red-200">
                  <div className="text-sm text-red-600 mb-1">Critical</div>
                  <div className="text-2xl font-bold text-red-600">{results.summary.critical}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-200">
                  <div className="text-sm text-orange-600 mb-1">High</div>
                  <div className="text-2xl font-bold text-orange-600">{results.summary.high}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-yellow-200">
                  <div className="text-sm text-yellow-600 mb-1">Medium</div>
                  <div className="text-2xl font-bold text-yellow-600">{results.summary.medium}</div>
                </div>
              </div>

              {/* Metadata */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-6 flex items-center justify-between">
                <div className="text-sm text-blue-800">
                  <span className="font-medium">Analysis completed</span> • 
                  Scanned {results.detectors.join(', ')} • 
                  Duration: {(results.duration / 1000).toFixed(2)}s
                </div>
              </div>

              {/* Issues List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">Issues Found ({results.issues.length})</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {results.issues.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 mb-1">No issues found!</p>
                      <p className="text-sm text-gray-500">Your code looks great.</p>
                    </div>
                  ) : (
                    results.issues.map((issue, index) => (
                      <div key={index} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start gap-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(issue.severity)}`}>
                            {issue.severity.toUpperCase()}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <p className="text-sm font-medium text-gray-900">{issue.message}</p>
                              <span className="text-xs text-gray-500 whitespace-nowrap">{issue.detector}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                              <span className="font-mono">{issue.file}</span>
                              <span>Line {issue.line}{issue.column ? `:${issue.column}` : ''}</span>
                            </div>
                            {issue.suggestion && (
                              <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-800 mt-2">
                                <span className="font-medium">Suggestion: </span>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to analyze</h3>
              <p className="text-gray-500">Configure your analysis settings and click "Run Analysis" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
