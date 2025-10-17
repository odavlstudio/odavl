import * as RadixToast from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import clsx from 'clsx';
import type { ReactNode } from 'react';

export type ToastProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  duration?: number;
  className?: string;
};

export function Toast({ open, onOpenChange, title, description, action, duration = 4000, className }: ToastProps) {
  return (
    <RadixToast.Provider swipeDirection="right" duration={duration}>
      <RadixToast.Root open={open} onOpenChange={onOpenChange} className={clsx('z-50 fixed bottom-4 right-4 w-96 rounded-lg bg-popover text-popover-foreground shadow-lg border border-border p-4 flex flex-col gap-2', className)}>
        <div className="flex items-center justify-between">
          <RadixToast.Title className="font-semibold text-foreground">{title}</RadixToast.Title>
          <RadixToast.Close asChild>
            <button className="p-1 rounded hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </RadixToast.Close>
        </div>
        {description && <RadixToast.Description className="text-sm text-muted-foreground">{description}</RadixToast.Description>}
        {action && <div className="mt-2">{action}</div>}
      </RadixToast.Root>
      <RadixToast.Viewport className="fixed bottom-4 right-4 z-50" />
    </RadixToast.Provider>
  );
}
