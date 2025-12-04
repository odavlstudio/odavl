/**
 * Sync Dashboard Page
 * Monitor sync jobs and view results from CLI tools
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface SyncJob {
  id: string;
  type: string;
  status: string;
  projectId: string;
  organizationId: string;
  localPath?: string;
  cloudUrl?: string;
  uploadProgress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface SyncStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  uploading: number;
  byType: Record<string, number>;
}

interface InsightAnalysis {
  id: string;
  projectId: string;
  timestamp: string;
  totalIssues: number;
  issuesBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  detectors: string[];
  metrics?: {
    filesAnalyzed: number;
    duration: number;
  };
}

interface AutopilotLedger {
  id: string;
  projectId: string;
  runId: string;
  timestamp: string;
  success: boolean;
  totalDuration: number;
  improvementScore?: number;
  phases: {
    observe: { status: string };
    decide: { status: string; selectedRecipe?: string };
    act: { status: string; filesModified?: string[] };
    verify: { status: string; qualityImproved?: boolean };
    learn: { status: string };
  };
}

interface GuardianResult {
  id: string;
  projectId: string;
  testRunId: string;
  timestamp: string;
  url: string;
  environment: string;
  passed: boolean;
  totalTests: number;
  failedTests: number;
  tests: {
    accessibility: {
      score: number;
      violations: number;
      passes: number;
    };
    performance: {
      loadTime: number;
      ttfb: number;
      fcp: number;
      lcp: number;
    };
    security: {
      vulnerabilities: number;
      warnings: number;
    };
  };
  screenshots: string[];
}

export default function SyncDashboardPage() {
  const params = useParams();
  const locale = params?.locale as string;
  const orgSlug = params?.orgSlug as string;

  const [activeTab, setActiveTab] = useState<'jobs' | 'insight' | 'autopilot' | 'guardian'>('jobs');
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [insightAnalyses, setInsightAnalyses] = useState<InsightAnalysis[]>([]);
  const [autopilotLedgers, setAutopilotLedgers] = useState<AutopilotLedger[]>([]);
  const [guardianResults, setGuardianResults] = useState<GuardianResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch sync jobs
  const fetchSyncJobs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock data for demo
      const mockStats: SyncStats = {
        total: 47,
        completed: 42,
        failed: 2,
        pending: 1,
        uploading: 2,
        byType: {
          INSIGHT_ANALYSIS: 18,
          AUTOPILOT_LEDGER: 15,
          GUARDIAN_RESULTS: 12,
          GUARDIAN_SCREENSHOT: 2,
        },
      };

      const mockJobs: SyncJob[] = [
        {
          id: 'job_1',
          type: 'INSIGHT_ANALYSIS',
          status: 'COMPLETED',
          projectId: 'proj_1',
          organizationId: 'org_1',
          localPath: '/workspace/.odavl/insight-results.json',
          cloudUrl: 'https://storage.odavl.studio/uploads/org_1/proj_1/insight-results.json',
          uploadProgress: 100,
          createdAt: new Date(Date.now() - 3600000),
          startedAt: new Date(Date.now() - 3595000),
          completedAt: new Date(Date.now() - 3590000),
          metadata: { totalIssues: 42, detectors: 5 },
        },
        {
          id: 'job_2',
          type: 'AUTOPILOT_LEDGER',
          status: 'UPLOADING',
          projectId: 'proj_1',
          organizationId: 'org_1',
          localPath: '/workspace/.odavl/ledger/run-123.json',
          uploadProgress: 67,
          createdAt: new Date(Date.now() - 120000),
          startedAt: new Date(Date.now() - 115000),
          metadata: { runId: 'run_123', success: true },
        },
        {
          id: 'job_3',
          type: 'GUARDIAN_RESULTS',
          status: 'FAILED',
          projectId: 'proj_1',
          organizationId: 'org_1',
          localPath: '/workspace/.odavl/guardian/test-results.json',
          uploadProgress: 0,
          createdAt: new Date(Date.now() - 7200000),
          startedAt: new Date(Date.now() - 7195000),
          error: 'Network timeout',
          metadata: { testRunId: 'test_456', passed: false },
        },
      ];

      setSyncStats(mockStats);
      setSyncJobs(mockJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sync jobs');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Insight analyses
  const fetchInsightAnalyses = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const mockAnalyses: InsightAnalysis[] = [
        {
          id: 'insight_1',
          projectId: 'proj_1',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          totalIssues: 42,
          issuesBySeverity: { critical: 2, high: 8, medium: 15, low: 17 },
          detectors: ['typescript', 'eslint', 'security', 'complexity', 'import'],
          metrics: { filesAnalyzed: 156, duration: 12500 },
        },
        {
          id: 'insight_2',
          projectId: 'proj_1',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          totalIssues: 51,
          issuesBySeverity: { critical: 3, high: 10, medium: 18, low: 20 },
          detectors: ['typescript', 'eslint', 'security', 'complexity'],
          metrics: { filesAnalyzed: 142, duration: 11200 },
        },
      ];

      setInsightAnalyses(mockAnalyses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Insight analyses');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Autopilot ledgers
  const fetchAutopilotLedgers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const mockLedgers: AutopilotLedger[] = [
        {
          id: 'autopilot_1',
          projectId: 'proj_1',
          runId: 'run_123',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          success: true,
          totalDuration: 8500,
          improvementScore: 85,
          phases: {
            observe: { status: 'success' },
            decide: { status: 'success', selectedRecipe: 'remove-unused-imports' },
            act: { status: 'success', filesModified: ['src/index.ts', 'src/utils.ts'] },
            verify: { status: 'success', qualityImproved: true },
            learn: { status: 'success' },
          },
        },
      ];

      setAutopilotLedgers(mockLedgers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Autopilot ledgers');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Guardian results
  const fetchGuardianResults = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const mockResults: GuardianResult[] = [
        {
          id: 'guardian_1',
          projectId: 'proj_1',
          testRunId: 'test_456',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          url: 'https://example.com',
          environment: 'production',
          passed: true,
          totalTests: 15,
          failedTests: 0,
          tests: {
            accessibility: { score: 95, violations: 2, passes: 13 },
            performance: { loadTime: 1250, ttfb: 120, fcp: 850, lcp: 1100 },
            security: { vulnerabilities: 0, warnings: 1 },
          },
          screenshots: ['screenshot1.png', 'screenshot2.png'],
        },
      ];

      setGuardianResults(mockResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Guardian results');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount and tab change
  useEffect(() => {
    if (activeTab === 'jobs') {
      fetchSyncJobs();
    } else if (activeTab === 'insight') {
      fetchInsightAnalyses();
    } else if (activeTab === 'autopilot') {
      fetchAutopilotLedgers();
    } else if (activeTab === 'guardian') {
      fetchGuardianResults();
    }
  }, [activeTab]);

  // Retry failed job
  const retryJob = async (jobId: string) => {
    try {
      // TODO: Call API to retry job
      console.log('Retrying job:', jobId);
      await fetchSyncJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry job');
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'UPLOADING': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Cloud Sync Dashboard</h1>

      {/* Statistics Cards */}
      {syncStats && activeTab === 'jobs' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Jobs</div>
            <div className="text-2xl font-bold">{syncStats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-2xl font-bold text-green-600">{syncStats.completed}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Failed</div>
            <div className="text-2xl font-bold text-red-600">{syncStats.failed}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{syncStats.pending}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Uploading</div>
            <div className="text-2xl font-bold text-blue-600">{syncStats.uploading}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'jobs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sync Jobs
          </button>
          <button
            onClick={() => setActiveTab('insight')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'insight'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Insight Results
          </button>
          <button
            onClick={() => setActiveTab('autopilot')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'autopilot'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Autopilot Cycles
          </button>
          <button
            onClick={() => setActiveTab('guardian')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'guardian'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Guardian Tests
          </button>
        </nav>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Sync Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {syncJobs.map(job => (
                <tr key={job.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{job.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{job.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${job.uploadProgress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{job.uploadProgress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {job.status === 'FAILED' && (
                      <button
                        onClick={() => retryJob(job.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Retry
                      </button>
                    )}
                    {job.cloudUrl && (
                      <a
                        href={job.cloudUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 text-blue-600 hover:text-blue-900"
                      >
                        View
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Insight Results Tab */}
      {activeTab === 'insight' && (
        <div className="space-y-4">
          {insightAnalyses.map(analysis => (
            <div key={analysis.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Analysis {analysis.id}</h3>
                  <p className="text-sm text-gray-600">{new Date(analysis.timestamp).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{analysis.totalIssues}</div>
                  <div className="text-sm text-gray-600">Total Issues</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-red-50 p-3 rounded">
                  <div className="text-sm text-red-600">Critical</div>
                  <div className="text-xl font-bold text-red-700">{analysis.issuesBySeverity.critical}</div>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <div className="text-sm text-orange-600">High</div>
                  <div className="text-xl font-bold text-orange-700">{analysis.issuesBySeverity.high}</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                  <div className="text-sm text-yellow-600">Medium</div>
                  <div className="text-xl font-bold text-yellow-700">{analysis.issuesBySeverity.medium}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-blue-600">Low</div>
                  <div className="text-xl font-bold text-blue-700">{analysis.issuesBySeverity.low}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>📊 {analysis.metrics?.filesAnalyzed} files analyzed</span>
                <span>⏱️ {(analysis.metrics?.duration || 0) / 1000}s duration</span>
                <span>🔍 {analysis.detectors.length} detectors</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Autopilot Ledgers Tab */}
      {activeTab === 'autopilot' && (
        <div className="space-y-4">
          {autopilotLedgers.map(ledger => (
            <div key={ledger.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Run {ledger.runId}</h3>
                  <p className="text-sm text-gray-600">{new Date(ledger.timestamp).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    ledger.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {ledger.success ? '✅ Success' : '❌ Failed'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-4">
                {Object.entries(ledger.phases).map(([phase, data]) => (
                  <div key={phase} className="bg-gray-50 p-3 rounded text-center">
                    <div className="text-xs uppercase text-gray-600 mb-1">{phase}</div>
                    <div className={`text-sm font-semibold ${
                      data.status === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {data.status}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>⏱️ {ledger.totalDuration / 1000}s total</span>
                {ledger.improvementScore && (
                  <span>📈 {ledger.improvementScore}% improvement</span>
                )}
                {ledger.phases.act.filesModified && (
                  <span>📝 {ledger.phases.act.filesModified.length} files modified</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Guardian Results Tab */}
      {activeTab === 'guardian' && (
        <div className="space-y-4">
          {guardianResults.map(result => (
            <div key={result.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{result.url}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(result.timestamp).toLocaleString()} • {result.environment}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.passed ? '✅ Passed' : '❌ Failed'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded">
                  <div className="text-sm text-blue-600 mb-1">Accessibility</div>
                  <div className="text-2xl font-bold text-blue-700">{result.tests.accessibility.score}</div>
                  <div className="text-xs text-blue-600">{result.tests.accessibility.violations} violations</div>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <div className="text-sm text-green-600 mb-1">Performance</div>
                  <div className="text-2xl font-bold text-green-700">{result.tests.performance.loadTime}ms</div>
                  <div className="text-xs text-green-600">Load time</div>
                </div>
                <div className="bg-purple-50 p-4 rounded">
                  <div className="text-sm text-purple-600 mb-1">Security</div>
                  <div className="text-2xl font-bold text-purple-700">{result.tests.security.vulnerabilities}</div>
                  <div className="text-xs text-purple-600">Vulnerabilities</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>🧪 {result.totalTests} tests</span>
                <span>📸 {result.screenshots.length} screenshots</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}
    </div>
  );
}
