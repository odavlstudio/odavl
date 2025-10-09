// ODAVL-WAVE-X10-INJECT: Evolution Dashboard - Visual Self-Improvement Tracking
// @odavl-governance: SELF-EVOLVING-SAFE mode - Read-only metrics visualization

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Note: Progress component will be available after UI setup
import { TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface EvolutionMetrics {
  performance: { score: number; trend: 'up' | 'down' | 'stable' };
  quality: { warnings: number; errors: number; coverage: number };
  suggestions: { total: number; implemented: number; pending: number };
  lastRun: string;
}

export function EvolutionDashboard() {
  // Mock data - in production would come from actual metrics
  const metrics: EvolutionMetrics = {
    performance: { score: 95, trend: 'up' },
    quality: { warnings: 3, errors: 0, coverage: 85 },
    suggestions: { total: 12, implemented: 7, pending: 5 },
    lastRun: '2025-10-07T10:30:00Z'
  };

  const recentSuggestions = [
    { id: 1, title: 'Remove unused imports', status: 'safe', priority: 'low' },
    { id: 2, title: 'Optimize image assets', status: 'safe', priority: 'medium' },
    { id: 3, title: 'Add loading states', status: 'review', priority: 'low' }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Evolution Dashboard</h1>
        <Badge variant="secondary">SELF-EVOLVING-SAFE</Badge>
      </div>

      {/* Metrics Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.performance.score}</div>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${metrics.performance.score}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Code Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Warnings</span>
                <span className="text-yellow-600">{metrics.quality.warnings}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Errors</span>
                <span className="text-green-600">{metrics.quality.errors}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Coverage</span>
                <span>{metrics.quality.coverage}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Suggestions Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Implemented</span>
                <span className="text-green-600">{metrics.suggestions.implemented}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pending</span>
                <span className="text-secondary-accessible">{metrics.suggestions.pending}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Suggestions</CardTitle>
          <CardDescription>
            Latest improvement recommendations from evolution system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {suggestion.status === 'safe' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="font-medium">{suggestion.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={suggestion.priority === 'medium' ? 'default' : 'secondary'}>
                    {suggestion.priority}
                  </Badge>
                  <Badge variant={suggestion.status === 'safe' ? 'secondary' : 'outline'}>
                    {suggestion.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Last Run Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Last evolution cycle: {new Date(metrics.lastRun).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}