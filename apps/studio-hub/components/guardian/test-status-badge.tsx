import { cn } from '@/lib/utils';

type TestStatusBadgeProps = {
  status: 'passed' | 'failed' | 'warning' | 'running';
  size?: 'sm' | 'md' | 'lg';
};

const statusConfig = {
  passed: {
    label: 'Passed',
    className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    dotClassName: 'bg-green-600',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    dotClassName: 'bg-red-600',
  },
  warning: {
    label: 'Warning',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
    dotClassName: 'bg-yellow-600',
  },
  running: {
    label: 'Running',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
    dotClassName: 'bg-blue-600 animate-pulse',
  },
};

const sizeConfig = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function TestStatusBadge({ status, size = 'sm' }: TestStatusBadgeProps) {
  const config = statusConfig[status];

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
