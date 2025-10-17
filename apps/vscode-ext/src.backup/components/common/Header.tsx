
import type { ReactNode } from 'react';
import clsx from 'clsx';
import { Button } from '../ui/button';
import { useEffect, useRef } from 'react';

export type HeaderProps = {
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
};



export function Header({ title, actions, className }: Readonly<HeaderProps>) {
  // Ref for VS Code API (if available)
  // VS Code API is injected at runtime; use type assertion to avoid type errors
  const vscodeRef = useRef<any>(null);
  useEffect(() => {
    // @ts-expect-error: acquireVsCodeApi is injected by VS Code
    if (typeof window.acquireVsCodeApi === 'function') {
      // @ts-expect-error: acquireVsCodeApi is injected by VS Code
      vscodeRef.current = window.acquireVsCodeApi();
    }
  }, []);

  // Handler for Start Demo
  const handleStartDemo = () => {
    if (vscodeRef.current) {
      vscodeRef.current.postMessage({ type: 'startDemo' });
    } else if (window.parent) {
      // fallback for browser demo, specify origin for security
      window.parent.postMessage({ type: 'startDemo' }, window.origin);
    }
  };

  return (
    <header className={clsx('flex items-center justify-between px-6 py-4 border-b border-border bg-header', className)}>
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      <div className="flex items-center gap-2">
        {/* Existing actions, e.g., Run Cycle button */}
        {actions}
        {/* Start Demo button */}
        <Button
          variant="outline"
          size="md"
          onClick={handleStartDemo}
          icon={<span aria-hidden="true" style={{ fontSize: '1.2em', lineHeight: 1 }}>▶️</span>}
        >
          Start Demo
        </Button>
      </div>
    </header>
  );
}
