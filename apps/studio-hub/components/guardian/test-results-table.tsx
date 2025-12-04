'use client';

import { useState, useEffect } from 'react';
import { TestStatusBadge } from './test-status-badge';
import { TestDetail } from './test-detail';
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
  project: {
    id: string;
    name: string;
    slug: string;
  };
};

type SortField = 'createdAt' | 'status' | 'category';
type SortDirection = 'asc' | 'desc';

export function TestResultsTable({ initialTests }: { initialTests: GuardianTest[] }) {
  const [tests, setTests] = useState<GuardianTest[]>(initialTests);
  const [selectedTest, setSelectedTest] = useState<GuardianTest | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Real-time updates via polling (30s interval)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await http.get('/api/guardian/tests');
        if (res.ok) {
          const newTests = await res.json();
          setTests(newTests);
        }
      } catch (error) {
        logger.error('Failed to fetch tests', error as Error);
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

  const sortedTests = [...tests].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;

    switch (sortField) {
      case 'status':
        const statusOrder = { running: 1, failed: 2, warning: 3, passed: 4 };
        return (statusOrder[a.status] - statusOrder[b.status]) * direction;
      case 'category':
        return a.category.localeCompare(b.category) * direction;
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

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
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
            <TableHead>URL</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('category')}
                className="font-semibold"
              >
                Category
                <SortIcon field="category" />
              </Button>
            </TableHead>
            <TableHead>Scores</TableHead>
            <TableHead>Issues</TableHead>
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
          {sortedTests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No tests run yet. Start your first test to see results here! 🧪
              </TableCell>
            </TableRow>
          ) : (
            sortedTests.map((test) => (
              <TableRow
                key={test.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedTest(test)}
              >
                <TableCell>
                  <TestStatusBadge status={test.status} />
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate">
                    <a
                      href={test.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {test.url}
                    </a>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="capitalize text-sm">{test.category}</span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 text-sm">
                    {test.accessibilityScore !== null && (
                      <span className={getScoreColor(test.accessibilityScore ?? 0)}>
                        A:{test.accessibilityScore}
                      </span>
                    )}
                    {test.performanceScore !== null && (
                      <span className={getScoreColor(test.performanceScore ?? 0)}>
                        P:{test.performanceScore}
                      </span>
                    )}
                    {test.securityScore !== null && (
                      <span className={getScoreColor(test.securityScore ?? 0)}>
                        S:{test.securityScore}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {test.issuesFound > 0 ? (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        {test.issuesFound}
                      </span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400">0</span>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{test.project.name}</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(test.createdAt), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {selectedTest && (
        <TestDetail
          test={selectedTest}
          open={!!selectedTest}
          onClose={() => setSelectedTest(null)}
        />
      )}
    </>
  );
}
