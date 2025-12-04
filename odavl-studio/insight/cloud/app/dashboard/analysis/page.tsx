/**
 * Live Analysis Page
 * Run analysis with real-time progress tracking
 */

'use client';

import { useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useRealTimeAnalysis } from '@/hooks/useRealTimeAnalysis';

export default function LiveAnalysisPage() {
  const [token, setToken] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('demo-project-123');
  const [isRunning, setIsRunning] = useState(false);

  // Get token from localStorage on mount
  useState(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      setToken(storedToken);
    }
  });

  // WebSocket connection
  const { socket, state } = useSocket({
    token,
    autoConnect: !!token,
  });

  // Real-time analysis tracking
  const analysis = useRealTimeAnalysis({
    socket,
    projectId,
    onComplete: (data) => {
      console.log('✅ Analysis complete:', data);
      setIsRunning(false);
    },
    onError: (error) => {
      console.error('❌ Analysis error:', error);
      setIsRunning(false);
    },
  });

  // Start analysis
  const startAnalysis = async () => {
    if (!token) {
      alert('Please login first');
      return;
    }

    setIsRunning(true);

    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          detectors: [
            'typescript',
            'eslint',
            'import',
            'package',
            'runtime',
            'build',
            'security',
            'circular',
            'network',
            'performance',
            'complexity',
            'isolation',
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis request failed');
      }

      const data = await response.json();
      console.log('Analysis started:', data);
    } catch (error) {
      console.error('Failed to start analysis:', error);
      setIsRunning(false);
      alert('Failed to start analysis');
    }
  };

  // Cancel analysis
  const cancelAnalysis = async () => {
    if (!analysis.analysisId) return;

    try {
      const response = await fetch(`/api/analysis/${analysis.analysisId}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('Analysis cancelled');
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Failed to cancel analysis:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Analysis</h1>
          <p className="text-gray-600 mt-2">Run code analysis with real-time progress</p>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                state.connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-700">
              {state.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {!isRunning && analysis.status === 'idle' && (
            <button
              onClick={startAnalysis}
              disabled={!state.connected}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Start Analysis
            </button>
          )}
        </div>

        {/* Overall Progress */}
        {analysis.status !== 'idle' && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Progress</h2>
              <span className={`text-sm px-3 py-1 rounded-full ${
                analysis.status === 'running' ? 'bg-blue-100 text-blue-700' :
                analysis.status === 'complete' ? 'bg-green-100 text-green-700' :
                analysis.status === 'error' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {analysis.status}
              </span>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Overall Progress</span>
                <span className="font-semibold">{analysis.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${analysis.progress}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-gray-900">
                  {analysis.issuesFound}
                </div>
                <div className="text-sm text-gray-600">Issues Found</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-gray-900">
                  {analysis.currentDetector || '-'}
                </div>
                <div className="text-sm text-gray-600">Current Detector</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-gray-900">
                  {analysis.estimatedTimeRemaining ? `${analysis.estimatedTimeRemaining}s` : '-'}
                </div>
                <div className="text-sm text-gray-600">Time Remaining</div>
              </div>
            </div>

            {/* Cancel Button */}
            {analysis.status === 'running' && (
              <button
                onClick={cancelAnalysis}
                className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Cancel Analysis
              </button>
            )}
          </div>
        )}

        {/* Detector Progress */}
        {analysis.detectors.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Detectors</h2>
            <div className="space-y-3">
              {analysis.detectors.map((detector) => (
                <div
                  key={detector.name}
                  className="border border-gray-200 rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          detector.status === 'complete'
                            ? 'bg-green-500'
                            : detector.status === 'running'
                            ? 'bg-blue-500 animate-pulse'
                            : detector.status === 'error'
                            ? 'bg-red-500'
                            : 'bg-gray-300'
                        }`}
                      />
                      <span className="font-medium text-gray-900">
                        {detector.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">{detector.progress}%</span>
                      <span className="text-gray-600">
                        {detector.issuesFound} issues
                      </span>
                    </div>
                  </div>

                  {/* Detector Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        detector.status === 'complete'
                          ? 'bg-green-500'
                          : detector.status === 'running'
                          ? 'bg-blue-500'
                          : detector.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-gray-300'
                      }`}
                      style={{ width: `${detector.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completion Summary */}
        {analysis.status === 'complete' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-900 mb-4">
              ✅ Analysis Complete!
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700">Total Issues:</span>
                <span className="ml-2 font-semibold text-green-900">
                  {analysis.issuesFound}
                </span>
              </div>
              <div>
                <span className="text-green-700">Detectors Run:</span>
                <span className="ml-2 font-semibold text-green-900">
                  {analysis.detectors.length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {analysis.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              ❌ Analysis Error
            </h2>
            <p className="text-red-700">{analysis.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
