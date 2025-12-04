'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SeverityBadge } from './severity-badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, XCircle, Clipboard } from 'lucide-react';
import { useState } from 'react';

type Issue = {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file: string;
  line: number;
  column?: number;
  detector: string;
  createdAt: Date;
  resolvedAt?: Date | null;
  codeSnippet?: string;
  suggestion?: string;
  documentation?: string;
  project: {
    id: string;
    name: string;
    slug: string;
  };
};

type IssueDetailProps = {
  issue: Issue;
  open: boolean;
  onClose: () => void;
};

export function IssueDetail({ issue, open, onClose }: IssueDetailProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLocation = () => {
    navigator.clipboard.writeText(`${issue.file}:${issue.line}${issue.column ? `:${issue.column}` : ''}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2">{issue.message}</DialogTitle>
              <div className="flex items-center gap-3">
                <SeverityBadge severity={issue.severity} size="md" />
                <span className="text-sm text-muted-foreground">
                  {issue.project.name}
                </span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
            {issue.resolvedAt ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Resolved</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <XCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Open</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="solution">Solution</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-1">Location</h4>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-2 rounded-md bg-muted font-mono text-sm flex-1">
                    {issue.file}:{issue.line}
                    {issue.column && `:${issue.column}`}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLocation}
                  >
                    <Clipboard className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-1">Detector</h4>
                <span className="px-3 py-1.5 rounded-md bg-muted text-sm font-medium">
                  {issue.detector}
                </span>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-1">Issue ID</h4>
                <code className="px-3 py-1.5 rounded-md bg-muted font-mono text-xs">
                  {issue.id}
                </code>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="code" className="space-y-4">
            {issue.codeSnippet ? (
              <div>
                <h4 className="font-semibold text-sm mb-2">Code Snippet</h4>
                <pre className="p-4 rounded-md bg-muted overflow-x-auto">
                  <code className="text-sm font-mono">{issue.codeSnippet}</code>
                </pre>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Code snippet not available
              </p>
            )}
          </TabsContent>

          <TabsContent value="solution" className="space-y-4">
            {issue.suggestion ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Suggested Fix</h4>
                  <div className="p-4 rounded-md bg-muted">
                    <p className="text-sm">{issue.suggestion}</p>
                  </div>
                </div>

                {issue.documentation && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Documentation</h4>
                    <div className="p-4 rounded-md bg-muted">
                      <p className="text-sm whitespace-pre-wrap">{issue.documentation}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button>Apply Fix</Button>
                  <Button variant="outline">Ignore Issue</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No automated fix available for this issue
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
