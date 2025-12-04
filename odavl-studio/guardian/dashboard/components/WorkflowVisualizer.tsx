import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle2, Circle, Clock, PlayCircle } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface WorkflowPhase {
  id: string;
  name: string;
  agentName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  confidence?: number;
  duration?: number; // ms
  findings?: number;
  timestamp?: string;
}

interface WorkflowVisualizerProps {
  phases: WorkflowPhase[];
  currentPhase?: string;
  totalDuration?: number;
  overallConfidence?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getPhaseIcon = (status: WorkflowPhase['status']) => {
  const iconClass = 'w-6 h-6';
  
  switch (status) {
    case 'completed':
      return <CheckCircle2 className={`${iconClass} text-green-500`} />;
    case 'running':
      return <PlayCircle className={`${iconClass} text-blue-500 animate-pulse`} />;
    case 'failed':
      return <Circle className={`${iconClass} text-red-500`} />;
    case 'pending':
      return <Clock className={`${iconClass} text-gray-400`} />;
  }
};

const getStatusBadge = (status: WorkflowPhase['status']) => {
  const variants: Record<WorkflowPhase['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    completed: 'default',
    running: 'secondary',
    failed: 'destructive',
    pending: 'outline',
  };

  const colors: Record<WorkflowPhase['status'], string> = {
    completed: 'bg-green-100 text-green-800 border-green-300',
    running: 'bg-blue-100 text-blue-800 border-blue-300',
    failed: 'bg-red-100 text-red-800 border-red-300',
    pending: 'bg-gray-100 text-gray-600 border-gray-300',
  };

  return (
    <Badge variant={variants[status]} className={colors[status]}>
      {status.toUpperCase()}
    </Badge>
  );
};

const getPhaseEmoji = (phaseName: string): string => {
  if (phaseName.includes('Runtime')) return '🏃';
  if (phaseName.includes('Visual')) return '👁️';
  if (phaseName.includes('Error')) return '🔍';
  if (phaseName.includes('Handoff')) return '🤝';
  return '⚙️';
};

// ============================================================================
// Main Component
// ============================================================================

export function WorkflowVisualizer({
  phases,
  currentPhase,
  totalDuration,
  overallConfidence,
}: WorkflowVisualizerProps) {
  const completedPhases = phases.filter((p) => p.status === 'completed').length;
  const totalPhases = phases.length;
  const progress = (completedPhases / totalPhases) * 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Guardian v4.0 Workflow</CardTitle>
          
          {/* Overall Progress */}
          <div className="flex items-center gap-4">
            {overallConfidence !== undefined && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {overallConfidence}%
                </div>
                <div className="text-xs text-gray-500">Confidence</div>
              </div>
            )}
            
            {totalDuration !== undefined && (
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-700">
                  {totalDuration < 1000
                    ? `${totalDuration.toFixed(0)}ms`
                    : `${(totalDuration / 1000).toFixed(2)}s`}
                </div>
                <div className="text-xs text-gray-500">Duration</div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Phase {completedPhases} of {totalPhases}
            </span>
            <span className="text-sm font-medium text-blue-600">
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <div
              key={phase.id}
              className={`
                relative p-4 border rounded-lg transition-all
                ${phase.id === currentPhase ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                ${phase.status === 'completed' ? 'bg-green-50' : ''}
                ${phase.status === 'failed' ? 'bg-red-50' : ''}
              `}
            >
              {/* Connecting Line */}
              {index < phases.length - 1 && (
                <div
                  className={`
                    absolute left-[25px] top-[60px] w-0.5 h-8
                    ${phase.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}
                  `}
                />
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                  {getPhaseIcon(phase.status)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getPhaseEmoji(phase.name)}</span>
                    <h3 className="font-semibold text-gray-900">
                      {phase.name}
                    </h3>
                    {getStatusBadge(phase.status)}
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    {phase.agentName}
                  </p>

                  {/* Metrics */}
                  {phase.status === 'completed' && (
                    <div className="flex items-center gap-6 text-sm">
                      {phase.confidence !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Confidence:</span>
                          <span className="font-semibold text-green-600">
                            {phase.confidence}%
                          </span>
                        </div>
                      )}

                      {phase.duration !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-semibold">
                            {phase.duration < 1000
                              ? `${phase.duration.toFixed(0)}ms`
                              : `${(phase.duration / 1000).toFixed(2)}s`}
                          </span>
                        </div>
                      )}

                      {phase.findings !== undefined && phase.findings > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Issues:</span>
                          <span className="font-semibold text-orange-600">
                            {phase.findings}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Running State */}
                  {phase.status === 'running' && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                      <span>Analyzing...</span>
                    </div>
                  )}

                  {/* Timestamp */}
                  {phase.timestamp && (
                    <div className="mt-2 text-xs text-gray-500">
                      {new Date(phase.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {completedPhases === totalPhases && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <h4 className="font-semibold text-green-900">
                  Workflow Complete
                </h4>
                <p className="text-sm text-green-700">
                  All phases executed successfully. Review the handoff for next steps.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Example Usage
// ============================================================================

export function WorkflowVisualizerExample() {
  const examplePhases: WorkflowPhase[] = [
    {
      id: 'phase-1',
      name: 'Phase 1: Runtime Testing',
      agentName: 'RuntimeTestingAgent',
      status: 'completed',
      confidence: 85,
      duration: 114.31,
      findings: 2,
      timestamp: new Date(Date.now() - 5000).toISOString(),
    },
    {
      id: 'phase-2',
      name: 'Phase 2: Visual Inspection',
      agentName: 'AIVisualInspector',
      status: 'completed',
      confidence: 88,
      duration: 59.25,
      findings: 1,
      timestamp: new Date(Date.now() - 3000).toISOString(),
    },
    {
      id: 'phase-3',
      name: 'Phase 3: AI Error Analysis',
      agentName: 'SmartErrorAnalyzer',
      status: 'running',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'phase-4',
      name: 'Phase 4: Handoff Generation',
      agentName: 'HandoffGenerator',
      status: 'pending',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto p-8">
      <WorkflowVisualizer
        phases={examplePhases}
        currentPhase="phase-3"
        totalDuration={173.56}
        overallConfidence={86}
      />
    </div>
  );
}
