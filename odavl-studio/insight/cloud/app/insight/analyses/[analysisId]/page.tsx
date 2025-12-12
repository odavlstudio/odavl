/**
 * Analysis Detail Page
 * Route: /insight/analyses/:analysisId
 * 
 * Shows analysis summary and filterable issues list
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Download,
  ExternalLink,
  Code,
  Lightbulb,
  X
} from 'lucide-react';

interface AnalysisData {
  analysis: {
    id: string;
    projectId: string;
    projectName: string;
    status: string;
    progress: number;
    summary: {
      totalIssues: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
      info: number;
    };
    timing: {
      startedAt: string | null;
      finishedAt: string | null;
      duration: number | null;
    };
    error: string | null;
  };
  issues: Array<{
    id: string;
    filePath: string;
    line: number;
    column: number | null;
    endLine: number | null;
    endColumn: number | null;
    severity: string;
    detector: string;
    message: string;
    ruleId: string | null;
    category: string | null;
    code: string | null;
    pattern: string | null;
    suggestion: string | null;
    autoFixable: boolean;
    confidence: number | null;
    metadata: any;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AnalysisDetailPage({
  params
}: {
  params: { analysisId: string };
}) {
  const router = useRouter();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [detectorFilter, setDetectorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Fetch analysis data
  useEffect(() => {
    async function fetchAnalysis() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/insight/analysis/${params.analysisId}?page=${page}&limit=50`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch analysis');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalysis();
  }, [params.analysisId, page]);

  // Filter issues
  const filteredIssues = data?.issues.filter((issue) => {
    if (severityFilter !== 'all' && issue.severity !== severityFilter.toUpperCase()) {
      return false;
    }
    if (detectorFilter !== 'all' && issue.detector !== detectorFilter) {
      return false;
    }
    if (searchQuery && !issue.filePath.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  // Get unique detectors for filter
  const uniqueDetectors = Array.from(
    new Set(data?.issues.map((i) => i.detector) || [])
  ).sort();

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'HIGH':
        return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'MEDIUM':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'LOW':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'INFO':
        return 'text-gray-700 bg-gray-100 border-gray-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return <AlertCircle className="w-4 h-4" />;
      case 'MEDIUM':
      case 'LOW':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-600 mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Error loading analysis
          </h3>
          <p className="text-red-700 mb-4">{error || 'Analysis not found'}</p>
          <Link
            href="/insight/projects"
            className="inline-flex items-center text-red-600 hover:text-red-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const { analysis, issues, pagination } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        href={`/insight/projects/${analysis.projectId}`}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to {analysis.projectName}
      </Link>

      {/* Analysis Summary Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Analysis Results
            </h1>
            <p className="text-sm text-gray-600">
              {analysis.timing.startedAt &&
                new Date(analysis.timing.startedAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // TODO: Implement download
                window.open(`/api/insight/analysis/${analysis.id}/export?format=json`, '_blank');
              }}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {analysis.summary.totalIssues}
            </p>
            <p className="text-xs text-gray-600 mt-1">Total Issues</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-700">
              {analysis.summary.critical}
            </p>
            <p className="text-xs text-red-600 mt-1">Critical</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-700">
              {analysis.summary.high}
            </p>
            <p className="text-xs text-orange-600 mt-1">High</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-700">
              {analysis.summary.medium}
            </p>
            <p className="text-xs text-yellow-600 mt-1">Medium</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">
              {analysis.summary.low}
            </p>
            <p className="text-xs text-blue-600 mt-1">Low</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-700">
              {analysis.summary.info}
            </p>
            <p className="text-xs text-gray-600 mt-1">Info</p>
          </div>
        </div>

        {/* Duration */}
        {analysis.timing.duration && (
          <div className="mt-4 text-sm text-gray-600">
            Completed in {(analysis.timing.duration / 1000).toFixed(1)} seconds
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>

          {/* Detector Filter */}
          <select
            value={detectorFilter}
            onChange={(e) => setDetectorFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Detectors</option>
            {uniqueDetectors.map((detector) => (
              <option key={detector} value={detector}>
                {detector}
              </option>
            ))}
          </select>

          {/* File Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by file path..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            {filteredIssues.length} of {issues.length} issues
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredIssues.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No issues found
            </h3>
            <p className="text-gray-600">
              {issues.length === 0
                ? 'This analysis found no issues in your codebase.'
                : 'No issues match the current filters.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredIssues.map((issue) => (
              <div key={issue.id} className="p-6 hover:bg-gray-50 transition-colors">
                {/* Issue Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded border ${getSeverityColor(issue.severity)}`}
                    >
                      {getSeverityIcon(issue.severity)}
                      {issue.severity}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded">
                      {issue.detector}
                    </span>
                    {issue.autoFixable && (
                      <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded">
                        Auto-fixable
                      </span>
                    )}
                  </div>
                </div>

                {/* Issue Message */}
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  {issue.message}
                </h3>

                {/* File Location */}
                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <Code className="w-4 h-4 mr-2" />
                  <span className="font-mono">
                    {issue.filePath}:{issue.line}
                    {issue.column && `:${issue.column}`}
                  </span>
                </div>

                {/* Code Snippet */}
                {issue.code && (
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-sm overflow-x-auto mb-3">
                    <code>{issue.code}</code>
                  </pre>
                )}

                {/* Suggestion */}
                {issue.suggestion && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Suggested Fix
                        </p>
                        <p className="text-sm text-blue-700">{issue.suggestion}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {issue.ruleId && <span>Rule: {issue.ruleId}</span>}
                  {issue.category && <span>Category: {issue.category}</span>}
                  {issue.confidence !== null && (
                    <span>Confidence: {(issue.confidence * 100).toFixed(0)}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
