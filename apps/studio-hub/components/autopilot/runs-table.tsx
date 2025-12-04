'use client';

import { useState, useEffect } from 'react';
import { StatusBadge } from './status-badge';
import { RunDetail } from './run-detail';
import { formatDistanceToNow } from 'date-fns';
import { http } from '@/lib/utils/fetch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { logger } from '@/lib/logger';

type AutopilotRunDisplay = {
  id: string;
  status: 'running' | 'success' | 'failed';
  createdAt: Date;
  completedAt?: Date | null;
  observeDuration?: number | null;
  decideDuration?: number | null;
  actDuration?: number | null;
  verifyDuration?: number | null;
  learnDuration?: number | null;
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

type SortField = 'createdAt' | 'status' | 'duration';
type SortDirection = 'asc' | 'desc';

export function RunsTable({ initialRuns }: { initialRuns: AutopilotRunDisplay[] }) {
  const [runs, setRuns] = useState<AutopilotRunDisplay[]>(initialRuns);
  const [selectedRun, setSelectedRun] = useState<AutopilotRunDisplay | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Real-time updates via polling (30s interval)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await http.get('/api/autopilot/runs');
        if (res.ok) {
          const newRuns = await res.json();
          setRuns(newRuns);
        }
      } catch (error) {
        logger.error('Failed to fetch runs', error as Error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getTotalDuration = (run: AutopilotRunDisplay) => {
    return (
      (run.observeDuration || 0) +
      (run.decideDuration || 0) +
      (run.actDuration || 0) +
      (run.verifyDuration || 0) +
      (run.learnDuration || 0)
    );
  };

  const sortedRuns = [...runs].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;

    switch (sortField) {
      case 'status':
        const statusOrder = { running: 1, success: 2, failed: 3 };
        return (statusOrder[a.status] - statusOrder[b.status]) * direction;
      case 'duration':
        return (getTotalDuration(a) - getTotalDuration(b)) * direction;
      case 'createdAt':
      default:
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
    }
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 ml-1 inline" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1 inline" />
    );
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('status')}
                className="font-semibold"
              >
                Status
                <SortIcon field="status" />
              </Button>
            </TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Files Changed</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('duration')}
                className="font-semibold"
              >
                Duration
                <SortIcon field="duration" />
              </Button>
            </TableHead>
            <TableHead>Phases</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('createdAt')}
                className="font-semibold"
              >
                Time
                <SortIcon field="createdAt" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRuns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No autopilot runs yet. Start your first run to see it here! 🚀
              </TableCell>
            </TableRow>
          ) : (
            sortedRuns.map((run) => (
              <TableRow
                key={run.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedRun(run)}
              >
                <TableCell>
                  <StatusBadge status={run.status} />
                </TableCell>
                <TableCell>
                  <span className="font-medium">{run.project.name}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {run.edits.length} {run.edits.length === 1 ? 'file' : 'files'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {run.status === 'running'
                      ? 'In progress...'
                      : `${(getTotalDuration(run) / 1000).toFixed(1)}s`
                    }
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {run.observeDuration && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" title="Observe" />
                    )}
                    {run.decideDuration && (
                      <div className="w-2 h-2 rounded-full bg-purple-500" title="Decide" />
                    )}
                    {run.actDuration && (
                      <div className="w-2 h-2 rounded-full bg-orange-500" title="Act" />
                    )}
                    {run.verifyDuration && (
                      <div className="w-2 h-2 rounded-full bg-green-500" title="Verify" />
                    )}
                    {run.learnDuration && (
                      <div className="w-2 h-2 rounded-full bg-pink-500" title="Learn" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {selectedRun && (
        <RunDetail
          run={selectedRun}
          open={!!selectedRun}
          onClose={() => setSelectedRun(null)}
        />
      )}
    </>
  );
}
