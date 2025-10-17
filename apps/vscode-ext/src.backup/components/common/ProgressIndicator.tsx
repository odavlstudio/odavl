import { motion } from 'framer-motion';
import clsx from 'clsx';

export type ProgressIndicatorProps = {
  progress: number; // 0-100
  className?: string;
};

export function ProgressIndicator({ progress, className }: ProgressIndicatorProps) {
  return (
    <div className={clsx('w-full h-2 bg-muted rounded-full overflow-hidden', className)}>
      <motion.div
        className="h-full bg-primary"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      />
    </div>
  );
}
