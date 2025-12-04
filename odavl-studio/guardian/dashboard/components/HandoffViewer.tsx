import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  FileCode,
  Download,
  Copy,
  CheckCircle2,
  ExternalLink,
  PlayCircle,
} from 'lucide-react';
import { GuardianAutopilotHandoff } from '../lib/handoff-schema';

// ============================================================================
// Component Props
// ============================================================================

interface HandoffViewerProps {
  handoff: GuardianAutopilotHandoff;
  onDownload?: () => void;
  onCopy?: () => void;
  onRunAutopilot?: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 90) return 'text-green-600';
  if (confidence >= 70) return 'text-yellow-600';
  if (confidence >= 50) return 'text-orange-600';
  return 'text-red-600';
};

const getSeverityBadge = (severity: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    critical: 'destructive',
    high: 'destructive',
    medium: 'secondary',
    low: 'outline',
  };

  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  return (
    <Badge variant={variants[severity] || 'outline'} className={colors[severity] || ''}>
      {severity.toUpperCase()}
    </Badge>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export function HandoffViewer({
  handoff,
  onDownload,
  onCopy,
  onRunAutopilot,
}: HandoffViewerProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
    } else {
      navigator.clipboard.writeText(JSON.stringify(handoff, null, 2));
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCode className="w-6 h-6 text-blue-600" />
            <div>
              <CardTitle>Guardian → Autopilot Handoff</CardTitle>
              <CardDescription>
                Generated on {new Date(handoff.timestamp).toLocaleString()}
              </CardDescription>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'visual' ? 'json' : 'visual')}
            >
              {viewMode === 'visual' ? '📄 JSON' : '👁️ Visual'}
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>

            {onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}

            {onRunAutopilot && (
              <Button onClick={onRunAutopilot}>
                <PlayCircle className="w-4 h-4 mr-2" />
                Run Autopilot
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {viewMode === 'visual' ? (
          <VisualView handoff={handoff} />
        ) : (
          <JsonView handoff={handoff} />
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Visual View Component
// ============================================================================

function VisualView({ handoff }: { handoff: GuardianAutopilotHandoff }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="text-sm text-gray-600">Overall Confidence</div>
          <div className={`text-2xl font-bold ${getConfidenceColor(handoff.confidence)}`}>
            {handoff.confidence}%
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Issues Detected</div>
          <div className="text-2xl font-bold text-gray-900">
            {handoff.detectedIssues.length}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Suggested Fixes</div>
          <div className="text-2xl font-bold text-blue-600">
            {handoff.suggestedFix.files.length}
          </div>
        </div>
      </div>

      {/* Detected Issues */}
      {handoff.detectedIssues.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">🔍 Detected Issues</h3>
          <div className="space-y-3">
            {handoff.detectedIssues.map((issue, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(issue.severity)}
                    <span className="text-sm text-gray-600">{issue.source}</span>
                  </div>
                  <Badge variant="outline">{issue.confidence}% confident</Badge>
                </div>

                <p className="font-medium text-gray-900 mb-2">{issue.message}</p>

                {issue.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileCode className="w-4 h-4" />
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      {issue.location.file}
                      {issue.location.line && `:${issue.location.line}`}
                    </code>
                  </div>
                )}

                {issue.aiReasoning && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-900">
                      <strong>AI Analysis:</strong> {issue.aiReasoning}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Root Cause */}
      {handoff.rootCause && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-purple-900">
            🎯 Root Cause Analysis
          </h3>
          <p className="text-purple-800">{handoff.rootCause}</p>
        </div>
      )}

      {/* Suggested Fixes */}
      {handoff.suggestedFix.files.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">💡 Suggested Fixes</h3>
          <div className="space-y-4">
            {handoff.suggestedFix.files.map((file, index) => (
              <div
                key={index}
                className="p-4 border border-green-200 bg-green-50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-green-700" />
                    <code className="font-mono text-sm font-semibold text-green-900">
                      {file.path}
                    </code>
                  </div>
                  <Badge className="bg-green-200 text-green-800">
                    {file.changes.length} change{file.changes.length > 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {file.changes.map((change, changeIndex) => (
                    <div
                      key={changeIndex}
                      className="p-3 bg-white border border-green-300 rounded"
                    >
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        {change.description}
                      </p>
                      {change.line && (
                        <div className="text-xs text-gray-600 mb-2">
                          Line {change.line}
                        </div>
                      )}
                      {change.before && (
                        <div className="mb-2">
                          <div className="text-xs text-red-600 font-semibold mb-1">
                            - Before:
                          </div>
                          <pre className="text-xs bg-red-50 p-2 rounded border border-red-200 overflow-x-auto">
                            <code>{change.before}</code>
                          </pre>
                        </div>
                      )}
                      {change.after && (
                        <div>
                          <div className="text-xs text-green-600 font-semibold mb-1">
                            + After:
                          </div>
                          <pre className="text-xs bg-green-100 p-2 rounded border border-green-300 overflow-x-auto">
                            <code>{change.after}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {handoff.nextSteps.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-blue-900">
            📋 Next Steps
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            {handoff.nextSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Platform Info */}
      {handoff.platform && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-100 rounded-lg text-sm">
          {handoff.platform.os && (
            <div>
              <div className="text-gray-600">OS</div>
              <div className="font-semibold">{handoff.platform.os}</div>
            </div>
          )}
          {handoff.platform.browser && (
            <div>
              <div className="text-gray-600">Browser</div>
              <div className="font-semibold">{handoff.platform.browser}</div>
            </div>
          )}
          {handoff.platform.viewport && (
            <div>
              <div className="text-gray-600">Viewport</div>
              <div className="font-semibold">
                {handoff.platform.viewport.width} × {handoff.platform.viewport.height}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// JSON View Component
// ============================================================================

function JsonView({ handoff }: { handoff: GuardianAutopilotHandoff }) {
  return (
    <div className="relative">
      <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm font-mono">
        <code>{JSON.stringify(handoff, null, 2)}</code>
      </pre>
    </div>
  );
}

// ============================================================================
// Example Usage
// ============================================================================

export function HandoffViewerExample() {
  const exampleHandoff: GuardianAutopilotHandoff = {
    version: '4.0',
    timestamp: new Date().toISOString(),
    confidence: 92,
    detectedIssues: [
      {
        message: 'Cannot read properties of null (reading useContext)',
        severity: 'high',
        source: 'RuntimeTestingAgent',
        confidence: 85,
        location: {
          file: 'dashboard/components/AnalysisView.tsx',
          line: 42,
        },
        aiReasoning:
          'The useContext hook is being called outside of a client component context',
      },
    ],
    rootCause:
      'Missing "use client" directive causes React hooks to fail in server components',
    suggestedFix: {
      description: 'Add client directive and implement error boundaries',
      files: [
        {
          path: 'dashboard/components/AnalysisView.tsx',
          changes: [
            {
              type: 'add',
              line: 1,
              description: 'Add "use client" directive',
              before: "import React from 'react';",
              after: '"use client";\nimport React from \'react\';',
            },
          ],
        },
      ],
    },
    nextSteps: [
      'Review the suggested fix above',
      'Run: odavl autopilot run',
      'If needed, rollback with: odavl autopilot undo',
    ],
    platform: {
      os: 'Windows 11',
      browser: 'Chrome 131',
      viewport: { width: 1920, height: 1080 },
    },
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <HandoffViewer
        handoff={exampleHandoff}
        onDownload={() => console.log('Download clicked')}
        onCopy={() => console.log('Copy clicked')}
        onRunAutopilot={() => console.log('Run Autopilot clicked')}
      />
    </div>
  );
}
