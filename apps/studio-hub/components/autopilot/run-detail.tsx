'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from './status-badge';
import { CycleTimeline } from './cycle-timeline';
import { Button } from '@/components/ui/button';
import { http } from '@/lib/utils/fetch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow, format } from 'date-fns';
import { Clock, FileText, Undo } from 'lucide-react';

type AutopilotRun = {
  id: string;
  status: 'running' | 'success' | 'failed';
  createdAt: Date;
  completedAt?: Date | null;
  observeDuration?: number | null;
  decideDuration?: number | null;
  actDuration?: number | null;
  verifyDuration?: number | null;
  learnDuration?: number | null;
  errorMessage?: string | null;
  project: {
    id: string;
    name: string;
    slug: string;
  };
  edits: Array<{
    id: string;
    filePath: string;
    linesChanged: number;
    changeType: string;
  }>;
};

type RunDetailProps = {
  run: AutopilotRun;
  open: boolean;
  onClose: () => void;
};

export function RunDetail({ run, open, onClose }: RunDetailProps) {
  const totalDuration =
    (run.observeDuration || 0) +
    (run.decideDuration || 0) +
    (run.actDuration || 0) +
    (run.verifyDuration || 0) +
    (run.learnDuration || 0);

  const totalLinesChanged = run.edits.reduce((sum, edit) => sum + edit.linesChanged, 0);

  const handleUndo = async () => {
    try {
      const res = await http.post(`/api/autopilot/runs/${run.id}/undo`, {});

      if (res.ok) {
        alert('Changes have been reverted successfully!');
        onClose();
      } else {
        alert('Failed to undo changes');
      }
    } catch (error) {
      alert('Error undoing changes');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2">
                Autopilot Run #{run.id.slice(0, 8)}
              </DialogTitle>
              <div className="flex items-center gap-3">
                <StatusBadge status={run.status} size="md" />
                <span className="text-sm text-muted-foreground">
                  {run.project.name}
                </span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
            {run.status === 'success' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                className="gap-2"
              >
                <Undo className="w-4 h-4" />
                Undo Changes
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="timeline" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="edits">Edits ({run.edits.length})</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" />
                  Total Duration
                </div>
                <div className="text-2xl font-bold">
                  {(totalDuration / 1000).toFixed(2)}s
                </div>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Files Changed
                </div>
                <div className="text-2xl font-bold">{run.edits.length}</div>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Lines Changed
                </div>
                <div className="text-2xl font-bold">{totalLinesChanged}</div>
              </div>
            </div>

            <CycleTimeline run={run} />
          </TabsContent>

          <TabsContent value="edits" className="space-y-4">
            {run.edits.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No edits were made during this run
              </p>
            ) : (
              <div className="space-y-2">
                {run.edits.map((edit) => (
                  <div
                    key={edit.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-mono font-medium">
                        {edit.filePath}
                      </code>
                      <span className="text-xs px-2 py-1 rounded-md bg-muted">
                        {edit.changeType}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {edit.linesChanged} {edit.linesChanged === 1 ? 'line' : 'lines'} changed
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-1">Run ID</h4>
                <code className="px-3 py-1.5 rounded-md bg-muted font-mono text-xs">
                  {run.id}
                </code>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-1">Started At</h4>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(run.createdAt), 'PPpp')}
                </p>
              </div>

              {run.completedAt && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Completed At</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(run.completedAt), 'PPpp')}
                  </p>
                </div>
              )}

              {run.errorMessage && (
                <div>
                  <h4 className="font-semibold text-sm mb-1 text-red-600">Error Message</h4>
                  <div className="p-4 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                    <p className="text-sm text-red-800 dark:text-red-200 font-mono whitespace-pre-wrap">
                      {run.errorMessage}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
