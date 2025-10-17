import * as RadixTooltip from '@radix-ui/react-tooltip';
import clsx from 'clsx';
import type { ReactNode } from 'react';

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  delayDuration?: number;
};

export function Tooltip({ content, children, side = 'top', className, delayDuration = 200 }: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            className={clsx(
              'z-50 px-3 py-2 rounded-md bg-popover text-popover-foreground text-xs shadow-lg border border-border animate-fade-in',
              className
            )}
          >
            {content}
            <RadixTooltip.Arrow className="fill-border" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
