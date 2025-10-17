import clsx from 'clsx';
import type { ReactNode, CSSProperties } from 'react';

export type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  rounded?: boolean;
};

export function Skeleton({ className, style, children, rounded = true }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-muted',
        rounded ? 'rounded-lg' : '',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
