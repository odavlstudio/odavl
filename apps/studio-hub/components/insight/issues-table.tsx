'use client';

import { useState, useEffect } from 'react';
import { SeverityBadge } from './severity-badge';
import { IssueDetail } from './issue-detail';
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

type Issue = {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file: string;
  line: number;
  detector: string;
  createdAt: Date;
  project: {
    id: string;
    name: string;
    slug: string;
  };
};

type SortField = 'severity' | 'createdAt' | 'file' | 'detector';
type SortDirection = 'asc' | 'desc';

export function IssuesTable({ initialIssues }: { initialIssues: Issue[] }) {
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Real-time updates via polling (30s interval)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await http.get('/api/insight/issues');
        if (res.ok) {
          const newIssues = await res.json();
          setIssues(newIssues);
        }
      } catch (error) {
        logger.error('Failed to fetch issues', error as Error);
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

  const sortedIssues = [...issues].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;

    switch (sortField) {
      case 'severity':
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (severityOrder[a.severity] - severityOrder[b.severity]) * direction;
      case 'createdAt':
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
      case 'file':
        return a.file.localeCompare(b.file) * direction;
      case 'detector':
        return a.detector.localeCompare(b.detector) * direction;
      default:
        return 0;
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
                onClick={() => handleSort('severity')}
                className="font-semibold"
              >
                Severity
                <SortIcon field="severity" />
              </Button>
            </TableHead>
            <TableHead className="w-[40%]">Message</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('file')}
                className="font-semibold"
              >
                File
                <SortIcon field="file" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('detector')}
                className="font-semibold"
              >
                Detector
                <SortIcon field="detector" />
              </Button>
            </TableHead>
            <TableHead>Project</TableHead>
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
          {sortedIssues.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No issues found. Your code is looking clean! 🎉
              </TableCell>
            </TableRow>
          ) : (
            sortedIssues.map((issue) => (
              <TableRow
                key={issue.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedIssue(issue)}
              >
                <TableCell>
                  <SeverityBadge severity={issue.severity} />
                </TableCell>
                <TableCell className="max-w-md">
                  <p className="truncate" title={issue.message}>
                    {issue.message}
                  </p>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {issue.file}:{issue.line}
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-md bg-muted text-xs font-medium">
                    {issue.detector}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {issue.project.name}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {selectedIssue && (
        <IssueDetail
          issue={selectedIssue}
          open={!!selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </>
  );
}
