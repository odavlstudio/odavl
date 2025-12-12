'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useProjects } from '@/lib/api-hooks';

interface FixResult {
  success: boolean;
  recipesApplied: number;
  filesModified: number;
  locChanged: number;
  fixes: Array<{
    recipe: string;
    file: string;
    changes: string;
  }>;
  error?: string;
}

export default function AutopilotPage() {
  const { data: projects, loading: projectsLoading } = useProjects('ACTIVE');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [analysisPath, setAnalysisPath] = useState<string>('.');
  const [maxFiles, setMaxFiles] = useState<number>(10);
  const [maxLoc, setMaxLoc] = useState<number>(40);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<FixResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAutopilot = async () => {
    setRunning(true);
    setError(null);
    setResult(null);

    try {
      // Note: /api/fix endpoint needs to be implemented
      // For now, we'll show a placeholder response
      const response = await fetch('/api/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: analysisPath,
          projectId: selectedProject || undefined,
          maxFiles,
          maxLoc,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Autopilot run failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Autopilot</h1>
        <p className="text-gray-600">Automatically fix code issues with AI-powered recipes</p>
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
                Fix Path
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

            {/* Safety Constraints */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Safety Constraints
              </label>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Max Files per Run: {maxFiles}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={maxFiles}
                    onChange={(e) => setMaxFiles(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Max LOC per File: {maxLoc}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={maxLoc}
                    onChange={(e) => setMaxLoc(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Safety Notice */}
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mb-6">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-xs text-yellow-800">
                  <p className="font-medium mb-1">Safety First</p>
                  <p>All changes are reversible via undo snapshots. Protected paths are never modified.</p>
                </div>
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={runAutopilot}
              disabled={running}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {running ? 'Running Autopilot...' : 'Run Autopilot'}
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
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Recipes Applied</div>
                  <div className="text-2xl font-bold">{result.recipesApplied}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                  <div className="text-sm text-blue-600 mb-1">Files Modified</div>
                  <div className="text-2xl font-bold text-blue-600">{result.filesModified}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
                  <div className="text-sm text-green-600 mb-1">LOC Changed</div>
                  <div className="text-2xl font-bold text-green-600">{result.locChanged}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
                  <div className="text-sm text-purple-600 mb-1">Status</div>
                  <div className="text-lg font-bold text-purple-600">
                    {result.success ? 'Success' : 'Failed'}
                  </div>
                </div>
              </div>

              {/* Success Banner */}
              {result.success && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-md mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium text-green-800">Autopilot run completed successfully</p>
                    <p className="text-sm text-green-700 mt-1">
                      Applied {result.recipesApplied} recipes across {result.filesModified} files
                    </p>
                  </div>
                </div>
              )}

              {/* Fixes List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">Fixes Applied ({result.fixes.length})</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {result.fixes.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 mb-1">No fixes needed</p>
                      <p className="text-sm text-gray-500">Your code is already in good shape!</p>
                    </div>
                  ) : (
                    result.fixes.map((fix, index) => (
                      <div key={index} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <p className="text-sm font-medium text-gray-900">{fix.recipe}</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                              <span className="font-mono">{fix.file}</span>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 p-3 rounded font-mono text-xs overflow-x-auto">
                              <pre className="whitespace-pre-wrap">{fix.changes}</pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Undo Instructions */}
              {result.success && result.fixes.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mt-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Need to undo?</p>
                      <p>Run <code className="bg-blue-100 px-1 py-0.5 rounded">odavl autopilot undo</code> in your terminal to restore the previous state.</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to fix</h3>
              <p className="text-gray-500">Configure your settings and click "Run Autopilot" to automatically fix code issues.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
