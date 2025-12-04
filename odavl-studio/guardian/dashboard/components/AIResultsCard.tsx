import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface AIResult {
  agentName: string;
  confidence: number;
  status: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
  duration: number; // ms
  memoryUsed: number; // MB
  findings: Finding[];
}

interface Finding {
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file?: string;
  line?: number;
  suggestedFix?: string;
}

// ============================================================================
// Component Props
// ============================================================================

interface AIResultsCardProps {
  result: AIResult;
  onViewDetails?: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getStatusIcon = (status: AIResult['status']) => {
  const iconProps = { className: 'w-5 h-5' };
  
  switch (status) {
    case 'success':
      return <CheckCircle2 {...iconProps} className="w-5 h-5 text-green-500" />;
    case 'warning':
      return <AlertCircle {...iconProps} className="w-5 h-5 text-yellow-500" />;
    case 'error':
      return <XCircle {...iconProps} className="w-5 h-5 text-red-500" />;
    case 'info':
      return <Info {...iconProps} className="w-5 h-5 text-blue-500" />;
  }
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 90) return 'text-green-600';
  if (confidence >= 70) return 'text-yellow-600';
  if (confidence >= 50) return 'text-orange-600';
  return 'text-red-600';
};

const getSeverityBadge = (severity: Finding['severity']) => {
  const variants: Record<Finding['severity'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    critical: 'destructive',
    high: 'destructive',
    medium: 'secondary',
    low: 'outline',
  };

  const colors: Record<Finding['severity'], string> = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  return (
    <Badge variant={variants[severity]} className={colors[severity]}>
      {severity.toUpperCase()}
    </Badge>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export function AIResultsCard({ result, onViewDetails }: AIResultsCardProps) {
  const {
    agentName,
    confidence,
    status,
    timestamp,
    duration,
    memoryUsed,
    findings,
  } = result;

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(status)}
            <div>
              <CardTitle className="text-lg">{agentName}</CardTitle>
              <CardDescription>
                {new Date(timestamp).toLocaleString()}
              </CardDescription>
            </div>
          </div>
          
          {/* Confidence Score */}
          <div className="text-right">
            <div className={`text-2xl font-bold ${getConfidenceColor(confidence)}`}>
              {confidence}%
            </div>
            <div className="text-xs text-gray-500">Confidence</div>
          </div>
        </div>
        
        {/* Confidence Progress Bar */}
        <Progress value={confidence} className="mt-4" />
      </CardHeader>

      <CardContent>
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-600">Execution Time</div>
            <div className="text-lg font-semibold">
              {duration < 1000 ? `${duration.toFixed(0)}ms` : `${(duration / 1000).toFixed(2)}s`}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Memory Used</div>
            <div className="text-lg font-semibold">{memoryUsed.toFixed(2)} MB</div>
          </div>
        </div>

        {/* Findings */}
        {findings.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-700">
              Findings ({findings.length})
            </h4>
            
            {findings.slice(0, 3).map((finding, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getSeverityBadge(finding.severity)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {finding.message}
                    </p>
                    
                    {finding.file && (
                      <p className="text-xs text-gray-600 mt-1">
                        📄 {finding.file}
                        {finding.line && `:${finding.line}`}
                      </p>
                    )}
                    
                    {finding.suggestedFix && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs text-blue-800">
                          💡 <strong>Suggested Fix:</strong> {finding.suggestedFix}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {findings.length > 3 && (
              <button
                onClick={onViewDetails}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all {findings.length} findings →
              </button>
            )}
          </div>
        )}

        {findings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p className="text-sm">No issues detected</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Example Usage
// ============================================================================

export function AIResultsCardExample() {
  const exampleResult: AIResult = {
    agentName: 'RuntimeTestingAgent',
    confidence: 92,
    status: 'warning',
    timestamp: new Date().toISOString(),
    duration: 114.31,
    memoryUsed: 0.18,
    findings: [
      {
        severity: 'high',
        message: 'Cannot read properties of null (reading useContext)',
        file: 'dashboard/components/AnalysisView.tsx',
        line: 42,
        suggestedFix: 'Add "use client" directive at the top of the file',
      },
      {
        severity: 'medium',
        message: 'Dashboard activation time exceeds target (2150ms > 200ms)',
        suggestedFix: 'Consider lazy loading heavy components',
      },
    ],
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <AIResultsCard
        result={exampleResult}
        onViewDetails={() => console.log('View details clicked')}
      />
    </div>
  );
}
