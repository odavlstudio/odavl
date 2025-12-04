import { cn } from '@/lib/utils';

type AccessibilityScoreProps = {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function AccessibilityScore({ score, size = 'md', className }: AccessibilityScoreProps) {
  const getColor = () => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getLabel = () => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Work';
    return 'Poor';
  };

  const sizeConfig = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className={cn('font-medium', sizeConfig[size], getColor())}>
            {getLabel()}
          </span>
          <span className={cn('font-mono', sizeConfig[size], getColor())}>
            {score}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all',
              score >= 90
                ? 'bg-green-500'
                : score >= 70
                ? 'bg-yellow-500'
                : 'bg-red-500'
            )}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}
