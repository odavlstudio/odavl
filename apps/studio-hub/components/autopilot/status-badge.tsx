import { cn } from '@/lib/utils';

type StatusBadgeProps = {
  status: 'running' | 'success' | 'failed';
  size?: 'sm' | 'md' | 'lg';
};

const statusConfig = {
  running: {
    label: 'Running',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
    dotClassName: 'bg-orange-600 animate-pulse',
  },
  success: {
    label: 'Success',
    className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    dotClassName: 'bg-green-600',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    dotClassName: 'bg-red-600',
  },
};

const sizeConfig = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
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
