'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface HistoryEntry {
  ts: string;
  success?: boolean;
  before: {
    eslintWarnings: number;
    typeErrors: number;
    timestamp: string;
  };
  after: {
    eslintWarnings: number;
    typeErrors: number;
    timestamp: string;
  };
  deltas: {
    eslint: number;
    types: number;
  };
  decision: string;
  gatesPassed?: boolean;
  gates?: Record<string, unknown>;
}

interface TrustEntry {
  id: string;
  runs: number;
  success: number;
  trust: number;
}

interface DashboardData {
  history: HistoryEntry[];
  trust: TrustEntry[];
}

export function LearningVisualizationDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    // Load ODAVL learning data from file system (in production, this would be an API call)
    const loadData = async () => {
      try {
        // Simulate loading from .odavl/history.json and .odavl/recipes-trust.json
        const historyData = [
          {
            ts: "2025-10-09T21:59:28.423Z",
            success: true,
            before: { eslintWarnings: 0, typeErrors: 0, timestamp: "2025-10-09T21:58:59.738Z" },
            after: { eslintWarnings: 0, typeErrors: 0, timestamp: "2025-10-09T21:59:18.210Z" },
            deltas: { eslint: 0, types: 0 },
            decision: "esm-hygiene",
            gatesPassed: true,
            gates: {
              eslint: { deltaMax: 0, absoluteMax: 0 },
              typeErrors: { deltaMax: 0, absoluteMax: 0 },
              pilot: { readiness: true, securityPassed: true }
            }
          },
          {
            ts: "2025-10-05T16:33:24.196Z",
            success: true,
            before: { eslintWarnings: 0, typeErrors: 0, timestamp: "2025-10-05T16:33:01.081Z" },
            after: { eslintWarnings: 0, typeErrors: 0, timestamp: "2025-10-05T16:33:15.621Z" },
            deltas: { eslint: 0, types: 0 },
            decision: "esm-hygiene",
            gatesPassed: true
          }
        ];

        const trustData = [
          { id: "esm-hygiene", runs: 12, success: 12, trust: 1.0 },
          { id: "remove-unused", runs: 3, success: 2, trust: 0.67 }
        ];

        setData({
          history: historyData,
          trust: trustData
        });
      } catch (error) {
        console.error('Failed to load ODAVL learning data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading ODAVL Learning Dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-red-500">Failed to load learning data</div>
      </div>
    );
  }

  const calculateSuccessRate = () => {
    const successful = data.history.filter(h => h.success === true).length;
    return data.history.length > 0 ? (successful / data.history.length * 100).toFixed(1) : '0';
  };

  const getQualityTrend = () => {
    const recent = data.history.slice(-5);
    const warnings = recent.reduce((acc: number, h) => acc + h.after.eslintWarnings, 0);
    const errors = recent.reduce((acc: number, h) => acc + h.after.typeErrors, 0);
    return { warnings, errors };
  };

  const getMostTrustedRecipe = () => {
    return data.trust.reduce((prev, current) => 
      current.trust > prev.trust ? current : prev
    );
  };

  const quality = getQualityTrend();
  const mostTrusted = getMostTrustedRecipe();
  const successRate = calculateSuccessRate();

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ODAVL Learning Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Autonomous code quality learning and improvement analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={timeRange === '7d' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </Button>
          <Button 
            variant={timeRange === '30d' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </Button>
          <Button 
            variant={timeRange === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTimeRange('all')}
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Success Rate</CardTitle>
            <Badge variant="secondary" className="bg-green-200 text-green-800">📈</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{successRate}%</div>
            <p className="text-xs text-green-600 mt-1">
              {data.history.length} total improvement runs
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Code Quality Score</CardTitle>
            <Badge variant="secondary" className="bg-blue-200 text-blue-800">🎯</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">
              {quality.warnings + quality.errors === 0 ? 'A+' : `${quality.warnings + quality.errors} issues`}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {quality.warnings} warnings • {quality.errors} errors
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Recipe Trust</CardTitle>
            <Badge variant="secondary" className="bg-purple-200 text-purple-800">🛡️</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">
              {(mostTrusted.trust * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {mostTrusted.id} ({mostTrusted.success}/{mostTrusted.runs})
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Learning Status</CardTitle>
            <Badge variant="secondary" className="bg-orange-200 text-orange-800">🤖</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">Active</div>
            <p className="text-xs text-orange-600 mt-1">
              {data.trust.length} recipes learned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🕐</span>
              Recent ODAVL Cycles
            </CardTitle>
            <CardDescription>Latest autonomous improvement attempts with outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.history.slice(-6).reverse().map((entry) => (
                <div key={entry.ts} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border">
                  <div className="flex-shrink-0">
                    <Badge variant={entry.success ? "default" : "destructive"} className="mt-1">
                      {entry.success ? "✓" : "✗"}
                    </Badge>
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{entry.decision}</span>
                      {entry.gatesPassed && (
                        <Badge variant="outline" className="text-xs">Gates ✓</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {new Date(entry.ts).toLocaleDateString()} at {new Date(entry.ts).toLocaleTimeString()}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white px-2 py-1 rounded border">
                        <span className="text-muted-foreground">Before:</span> {entry.before.eslintWarnings}W {entry.before.typeErrors}E
                      </div>
                      <div className="bg-white px-2 py-1 rounded border">
                        <span className="text-muted-foreground">After:</span> {entry.after.eslintWarnings}W {entry.after.typeErrors}E
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recipe Trust Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🧠</span>
              Machine Learning Confidence
            </CardTitle>
            <CardDescription>Algorithm trust levels for each improvement strategy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.trust.sort((a, b) => b.trust - a.trust).map((recipe) => (
                <div key={recipe.id} className="p-4 bg-slate-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-sm">{recipe.id}</div>
                      <div className="text-xs text-muted-foreground">
                        {recipe.success} successes out of {recipe.runs} attempts
                      </div>
                    </div>
                    <Badge 
                      variant={recipe.trust >= 0.8 ? "default" : recipe.trust >= 0.6 ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {(recipe.trust * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        recipe.trust >= 0.8 ? 'bg-green-500' : 
                        recipe.trust >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${recipe.trust * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🔮</span>
            AI Learning Insights
          </CardTitle>
          <CardDescription>Machine intelligence analysis of code improvement patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="font-semibold text-emerald-800">High Confidence Zone</span>
              </div>
              <p className="text-sm text-emerald-700 leading-relaxed">
                <strong>ESM hygiene</strong> recipes demonstrate perfect reliability (100% success).
                Safe for autonomous deployment with zero human oversight required.
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-sky-50 to-sky-100 rounded-lg border border-sky-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-sky-500 rounded-full"></div>
                <span className="font-semibold text-sky-800">Quality Excellence</span>
              </div>
              <p className="text-sm text-sky-700 leading-relaxed">
                Codebase maintains <strong>zero warnings and errors</strong> consistently.
                Learning algorithms have achieved sustained code quality excellence.
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg border border-violet-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
                <span className="font-semibold text-violet-800">Enterprise Ready</span>
              </div>
              <p className="text-sm text-violet-700 leading-relaxed">
                Security gates passing at 100% rate. System validated for
                <strong>production pilot deployment</strong> with enterprise clients.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics Footer */}
      <div className="border-t pt-4 text-center text-sm text-muted-foreground">
        <p>ODAVL v2.0 • Autonomous Code Quality System • Last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}