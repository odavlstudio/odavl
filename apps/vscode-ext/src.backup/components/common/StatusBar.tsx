import type { ReactNode } from 'react';
import clsx from 'clsx';

export type StatusBarProps = {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
};

export function StatusBar({ left, center, right, className }: StatusBarProps) {
  return (
    <footer className={clsx('flex items-center justify-between px-4 py-2 border-t border-border bg-statusbar text-xs text-muted-foreground', className)}>
      <div className="flex-1 flex items-center gap-2">{left}</div>
      <div className="flex-1 flex items-center justify-center">{center}</div>
      <div className="flex-1 flex items-center justify-end gap-2">{right}</div>
    </footer>
  );
}
