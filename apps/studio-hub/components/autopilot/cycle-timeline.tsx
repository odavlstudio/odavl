'use client';

import { Progress } from '@/components/ui/progress';

type AutopilotRun = {
  observeDuration?: number | null;
  decideDuration?: number | null;
  actDuration?: number | null;
  verifyDuration?: number | null;
  learnDuration?: number | null;
};

type CycleTimelineProps = {
  run: AutopilotRun;
};

const phases = [
  { 
    key: 'observe', 
    name: 'Observe', 
    color: 'blue',
    description: 'Analyzing codebase metrics'
  },
  { 
    key: 'decide', 
    name: 'Decide', 
    color: 'purple',
    description: 'Selecting improvement recipe'
  },
  { 
    key: 'act', 
    name: 'Act', 
    color: 'orange',
    description: 'Applying code changes'
  },
  { 
    key: 'verify', 
    name: 'Verify', 
    color: 'green',
    description: 'Running quality checks'
  },
  { 
    key: 'learn', 
    name: 'Learn', 
    color: 'pink',
    description: 'Updating recipe trust scores'
  },
] as const;

const colorClasses = {
  blue: {
    bg: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-100 dark:ring-blue-950',
  },
  purple: {
    bg: 'bg-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    ring: 'ring-purple-100 dark:ring-purple-950',
  },
  orange: {
    bg: 'bg-orange-500',
    text: 'text-orange-600 dark:text-orange-400',
    ring: 'ring-orange-100 dark:ring-orange-950',
  },
  green: {
    bg: 'bg-green-500',
    text: 'text-green-600 dark:text-green-400',
    ring: 'ring-green-100 dark:ring-green-950',
  },
  pink: {
    bg: 'bg-pink-500',
    text: 'text-pink-600 dark:text-pink-400',
    ring: 'ring-pink-100 dark:ring-pink-950',
  },
};

export function CycleTimeline({ run }: CycleTimelineProps) {
  const totalDuration = 
    (run.observeDuration || 0) +
    (run.decideDuration || 0) +
    (run.actDuration || 0) +
    (run.verifyDuration || 0) +
    (run.learnDuration || 0);

  return (
    <div className="space-y-4">
      {phases.map((phase) => {
        const durationKey = `${phase.key}Duration` as keyof AutopilotRun;
        const duration = run[durationKey] as number || 0;
        const percentage = totalDuration > 0 ? (duration / totalDuration) * 100 : 0;
        const colorClass = colorClasses[phase.color];

        return (
          <div key={phase.key} className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${colorClass.bg} flex items-center justify-center ring-4 ${colorClass.ring}`}>
                <span className="text-white font-bold text-sm">
                  {phase.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <span className={`font-semibold ${colorClass.text}`}>
                      {phase.name}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {phase.description}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground font-mono">
                    {duration > 0 ? `${duration}ms` : 'N/A'}
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
