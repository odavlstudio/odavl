'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TestStatusBadge } from './test-status-badge';
import { AccessibilityScore } from './accessibility-score';
import { Button } from '@/components/ui/button';
import { http } from '@/lib/utils/fetch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow, format } from 'date-fns';
import { AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';

type GuardianTest = {
  id: string;
  url: string;
  status: 'passed' | 'failed' | 'warning' | 'running';
  category: 'accessibility' | 'performance' | 'security' | 'all';
  severity?: 'critical' | 'high' | 'medium' | 'low' | null;
  accessibilityScore?: number | null;
  performanceScore?: number | null;
  securityScore?: number | null;
  issuesFound: number;
  createdAt: Date;
  completedAt?: Date | null;
  lcp?: number | null;
  fid?: number | null;
  cls?: number | null;
  ttfb?: number | null;
  errorMessage?: string | null;
  recommendations?: string | null;
  project: {
    id: string;
    name: string;
    slug: string;
  };
};

type TestDetailProps = {
  test: GuardianTest;
  open: boolean;
  onClose: () => void;
};

export function TestDetail({ test, open, onClose }: TestDetailProps) {
  const handleRerun = async () => {
    try {
      const res = await http.post(`/api/guardian/tests/${test.id}/rerun`, {});

      if (res.ok) {
        alert('Test rerun initiated successfully!');
        onClose();
      } else {
        alert('Failed to rerun test');
      }
    } catch (error) {
      alert('Error rerunning test');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatMetric = (value: number | null | undefined, unit: string = 'ms') => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(2)}${unit}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2">
                Test Report #{test.id.slice(0, 8)}
              </DialogTitle>
              <div className="flex items-center gap-3 mb-2">
                <TestStatusBadge status={test.status} size="md" />
                <span className="text-sm text-muted-foreground capitalize">
                  {test.category}
                </span>
                {test.severity && (
                  <span className="text-xs px-2 py-1 rounded-md bg-muted capitalize">
                    {test.severity}
                  </span>
                )}
              </div>
              <a
                href={test.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"
              >
                {test.url}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            {test.status !== 'running' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRerun}
                className="gap-2"
              >
                <Clock className="w-4 h-4" />
                Rerun Test
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
            <TabsTrigger value="issues">Issues ({test.issuesFound})</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {test.accessibilityScore !== null && (
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Accessibility</div>
                  <div className={cn('text-3xl font-bold', getScoreColor(test.accessibilityScore ?? 0))}>
                    {test.accessibilityScore}
                  </div>
                  <AccessibilityScore score={test.accessibilityScore ?? 0} size="sm" className="mt-2" />
                </div>
              )}

              {test.performanceScore !== null && (
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Performance</div>
                  <div className={cn('text-3xl font-bold', getScoreColor(test.performanceScore ?? 0))}>
                    {test.performanceScore}
                  </div>
                </div>
              )}

              {test.securityScore !== null && (
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Security</div>
                  <div className={cn('text-3xl font-bold', getScoreColor(test.securityScore ?? 0))}>
                    {test.securityScore}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-1">Test ID</h4>
                <code className="px-3 py-1.5 rounded-md bg-muted font-mono text-xs">
                  {test.id}
                </code>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-1">Started At</h4>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(test.createdAt), 'PPpp')}
                </p>
              </div>

              {test.completedAt && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Completed At</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(test.completedAt), 'PPpp')}
                  </p>
                </div>
              )}

              {test.errorMessage && (
                <div>
                  <h4 className="font-semibold text-sm mb-1 text-red-600">Error Message</h4>
                  <div className="p-4 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                    <p className="text-sm text-red-800 dark:text-red-200 font-mono whitespace-pre-wrap">
                      {test.errorMessage}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="vitals" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <h4 className="font-semibold text-sm">Largest Contentful Paint (LCP)</h4>
                </div>
                <div className="text-2xl font-bold">{formatMetric(test.lcp)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: &lt;2.5s
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <h4 className="font-semibold text-sm">First Input Delay (FID)</h4>
                </div>
                <div className="text-2xl font-bold">{formatMetric(test.fid)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: &lt;100ms
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <h4 className="font-semibold text-sm">Cumulative Layout Shift (CLS)</h4>
                </div>
                <div className="text-2xl font-bold">{formatMetric(test.cls, '')}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: &lt;0.1
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <h4 className="font-semibold text-sm">Time to First Byte (TTFB)</h4>
                </div>
                <div className="text-2xl font-bold">{formatMetric(test.ttfb)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: &lt;200ms
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            {test.issuesFound === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No issues found! Your site passed all checks. 🎉
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Found {test.issuesFound} {test.issuesFound === 1 ? 'issue' : 'issues'} that need attention.
                </p>
                {/* TODO: Add detailed issues list from database */}
                <div className="border rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-sm">Issue placeholder</h5>
                    <p className="text-sm text-muted-foreground mt-1">
                      Detailed issue data will be displayed here once stored in database.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {test.recommendations ? (
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap">{test.recommendations}</div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No specific recommendations at this time.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
