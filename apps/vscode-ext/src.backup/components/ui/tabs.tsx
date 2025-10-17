import * as RadixTabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { ReactNode } from 'react';

type Tab = {
  value: string;
  label: ReactNode;
};

type TabsProps = {
  tabs: Tab[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children?: ReactNode;
};

export function Tabs({ tabs, value, onValueChange, className, children }: TabsProps) {
  return (
    <RadixTabs.Root value={value} onValueChange={onValueChange} className={className}>
      <RadixTabs.List className="flex border-b border-border relative">
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            className={clsx(
              'px-4 py-2 font-medium text-foreground transition-colors',
              value === tab.value ? 'border-b-2 border-primary text-primary' : 'hover:text-primary'
            )}
          >
            {tab.label}
            {value === tab.value && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      <RadixTabs.Content value={value} className="pt-4">
        {children}
      </RadixTabs.Content>
    </RadixTabs.Root>
  );
}
