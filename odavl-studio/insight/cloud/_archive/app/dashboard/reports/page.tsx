/**
 * Reports & Insights Page
 * Week 10 Day 3: Reports & Insights
 * 
 * Main page for viewing insights, recommendations, and generating reports.
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Lightbulb,
  Target,
  TrendingUp,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { InsightCard } from '@/components/InsightCard';
import { RecommendationCard } from '@/components/RecommendationCard';
import type { Insight, Recommendation, Anomaly } from '@/lib/reports/types';

export default function ReportsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'recommendations' | 'anomalies'>('insights');

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/insights?projectId=demo-project-123&timeRange=7d');
      const result = await response.json();

      if (result.success) {
        setInsights(result.data.insights);
        setRecommendations(result.data.recommendations);
        setAnomalies(result.data.anomalies);
      }
    } catch (error) {
      console.error('Fetch insights error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (reportType: string) => {
    try {
      setGeneratingReport(true);

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'demo-project-123',
          reportType,
          timeRange: '7d'
        })
      });

      const result = await response.json();

      if (result.success) {
        // Convert report to HTML and download
        const reportHTML = generateReportHTML(result.report);
        const blob = new Blob([reportHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `odavl-${reportType}-report-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Generate report error:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const generateReportHTML = (report: any): string => {
    const sectionsHTML = report.sections
      .map((section: any) => `
        <section style="margin-bottom: 30px;">
          <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 15px;">${section.title}</h2>
          <div style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${section.content}</div>
        </section>
      `)
      .join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f9fafb;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    h1 {
      color: #111827;
      font-size: 32px;
      margin-bottom: 10px;
    }
    .meta {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    strong {
      color: #1f2937;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${report.title}</h1>
    <div class="meta">
      <p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>
      <p><strong>Project ID:</strong> ${report.projectId}</p>
      <p>${report.description}</p>
    </div>
    ${sectionsHTML}
  </div>
</body>
</html>
    `.trim();
  };

  const handleRecommendationStatusChange = (id: string, status: Recommendation['status']) => {
    setRecommendations(prev =>
      prev.map(rec => (rec.id === id ? { ...rec, status } : rec))
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900">Reports & Insights</h1>
            </div>
            <p className="text-gray-600">AI-powered insights and actionable recommendations</p>
          </div>

          {/* Generate Report Dropdown */}
          <div className="relative group">
            <button
              disabled={generatingReport}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {generatingReport ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Generate Report
                </>
              )}
            </button>

            {!generatingReport && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleGenerateReport('summary')}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-medium">Summary Report</div>
                      <div className="text-xs text-gray-500">Quick overview</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleGenerateReport('detailed')}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="font-medium">Detailed Report</div>
                      <div className="text-xs text-gray-500">Complete analysis</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleGenerateReport('team')}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="font-medium">Team Report</div>
                      <div className="text-xs text-gray-500">Performance & collaboration</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Lightbulb className="w-8 h-8" />
            <span className="text-3xl font-bold">{insights.length}</span>
          </div>
          <p className="text-blue-100">Insights Detected</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8" />
            <span className="text-3xl font-bold">{recommendations.length}</span>
          </div>
          <p className="text-green-100">Recommendations</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-8 h-8" />
            <span className="text-3xl font-bold">{anomalies.length}</span>
          </div>
          <p className="text-orange-100">Anomalies Found</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('insights')}
            className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'insights'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Insights ({insights.length})
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'recommendations'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Recommendations ({recommendations.length})
          </button>
          <button
            onClick={() => setActiveTab('anomalies')}
            className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'anomalies'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Anomalies ({anomalies.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <>
          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-4">
              {insights.length === 0 ? (
                <div className="text-center py-16">
                  <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No insights available at this time.</p>
                </div>
              ) : (
                insights.map(insight => (
                  <InsightCard key={insight.id} insight={insight} />
                ))
              )}
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              {recommendations.length === 0 ? (
                <div className="text-center py-16">
                  <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recommendations at this time. Keep up the good work!</p>
                </div>
              ) : (
                recommendations.map(rec => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    onStatusChange={handleRecommendationStatusChange}
                  />
                ))
              )}
            </div>
          )}

          {/* Anomalies Tab */}
          {activeTab === 'anomalies' && (
            <div className="space-y-4">
              {anomalies.length === 0 ? (
                <div className="text-center py-16">
                  <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No anomalies detected. Your metrics look stable.</p>
                </div>
              ) : (
                anomalies.map(anomaly => (
                  <div
                    key={anomaly.id}
                    className="bg-white border border-orange-200 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{anomaly.description}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            anomaly.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            anomaly.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {anomaly.severity}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Expected:</span>{' '}
                            <span className="font-medium">{anomaly.expectedValue}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Actual:</span>{' '}
                            <span className="font-medium">{anomaly.actualValue}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Deviation:</span>{' '}
                            <span className="font-medium text-orange-600">
                              {anomaly.deviation.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Detected on {new Date(anomaly.detectedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
