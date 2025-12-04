import { cn } from '@/lib/utils';

type SeverityBadgeProps = {
  severity: 'critical' | 'high' | 'medium' | 'low';
  size?: 'sm' | 'md' | 'lg';
};

const severityConfig = {
  critical: {
    label: 'Critical',
    className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    dotClassName: 'bg-red-600',
  },
  high: {
    label: 'High',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
    dotClassName: 'bg-orange-600',
  },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
    dotClassName: 'bg-yellow-600',
  },
  low: {
    label: 'Low',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
    dotClassName: 'bg-blue-600',
  },
};

const sizeConfig = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function SeverityBadge({ severity, size = 'sm' }: SeverityBadgeProps) {
  const config = severityConfig[severity];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.className,
        sizeConfig[size]
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dotClassName)} />
      {config.label}
    </span>
  );
}
