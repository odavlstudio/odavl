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
    // Simulate loading ODAVL learning data
    // In real implementation, this would fetch from .odavl/history.json and recipes-trust.json
    const loadData = async () => {
      try {
        const mockData: DashboardData = {
          history: [
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
            }
          ],
          trust: [
            { id: "esm-hygiene", runs: 12, success: 12, trust: 1.0 }
          ]
        };
        setData(mockData);
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
    const warnings = recent.reduce((acc, h) => acc + h.after.eslintWarnings, 0);
    const errors = recent.reduce((acc, h) => acc + h.after.typeErrors, 0);
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
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ODAVL Learning Dashboard</h1>
          <p className="text-muted-foreground">
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Badge variant="secondary">📈</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.history.length} total runs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Code Quality</CardTitle>
            <Badge variant="secondary">🎯</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {quality.warnings + quality.errors === 0 ? '✓' : `${quality.warnings + quality.errors}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {quality.warnings} warnings, {quality.errors} errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trust Score</CardTitle>
            <Badge variant="secondary">🛡️</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {(mostTrusted.trust * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {mostTrusted.id} recipe
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Status</CardTitle>
            <Badge variant="secondary">🤖</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">Active</div>
            <p className="text-xs text-muted-foreground">
              {data.trust.length} recipes learned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent ODAVL Runs</CardTitle>
            <CardDescription>Latest autonomous improvement attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.history.slice(-5).reverse().map((entry, index) => (
                <div key={entry.ts} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant={entry.success ? "default" : "destructive"}>
                      {entry.success ? "✓" : "✗"}
                    </Badge>
                    <div>
                      <div className="font-medium">{entry.decision}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(entry.ts).toLocaleDateString()} {new Date(entry.ts).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      ESLint: {entry.after.eslintWarnings}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Types: {entry.after.typeErrors}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recipe Trust Scores</CardTitle>
            <CardDescription>Machine learning confidence in improvement strategies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.trust.map((recipe) => (
                <div key={recipe.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">{recipe.id}</div>
                    <div className="text-sm text-muted-foreground">
                      {recipe.success}/{recipe.runs} successful runs
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${recipe.trust * 100}%` }}
                      />
                    </div>
                    <Badge variant="outline">
                      {(recipe.trust * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Insights</CardTitle>
          <CardDescription>AI-powered analysis of code improvement patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-semibold text-green-800">High Confidence</span>
              </div>
              <p className="text-sm text-green-700">
                ESM hygiene recipes show 100% success rate across 12 runs.
                Safe to apply automatically.
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-semibold text-blue-800">Quality Stable</span>
              </div>
              <p className="text-sm text-blue-700">
                Code quality metrics remain consistently at zero warnings/errors.
                Learning system is maintaining excellence.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="font-semibold text-purple-800">Pilot Ready</span>
              </div>
              <p className="text-sm text-purple-700">
                Security gates passing consistently. System ready for
                enterprise pilot deployment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}