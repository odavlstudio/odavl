import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import clsx from 'clsx';
import type { ReactNode } from 'react';

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function Dialog({ open, onOpenChange, title, description, children, footer, className }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-black/40 z-50 animate-fade-in" />
        <RadixDialog.Content
          className={clsx(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-background p-6 shadow-lg border border-border focus:outline-none',
            className
          )}
        >
          <div className="flex items-center justify-between mb-2">
            {title && <RadixDialog.Title className="text-lg font-semibold text-foreground">{title}</RadixDialog.Title>}
            <RadixDialog.Close asChild>
              <button className="p-1 rounded hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </RadixDialog.Close>
          </div>
          {description && <RadixDialog.Description className="mb-4 text-sm text-muted-foreground">{description}</RadixDialog.Description>}
          <div>{children}</div>
          {footer && <div className="mt-4">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
