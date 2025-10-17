import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import type { ReactNode } from 'react';

export type SelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

type SelectProps = {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function Select({ options, value, onValueChange, placeholder, className, disabled }: SelectProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RadixSelect.Trigger
        className={clsx(
          'inline-flex items-center justify-between w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-50 disabled:pointer-events-none',
          className
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon asChild>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Content className="z-50 bg-background border border-border rounded-lg shadow-lg mt-1">
        <RadixSelect.Viewport className="p-1">
          {options.map((opt) => (
            <RadixSelect.Item
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              className={clsx(
                'px-3 py-2 rounded-md cursor-pointer select-none text-foreground hover:bg-accent focus:bg-accent',
                opt.disabled && 'opacity-50 pointer-events-none'
              )}
            >
              <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
            </RadixSelect.Item>
          ))}
        </RadixSelect.Viewport>
      </RadixSelect.Content>
    </RadixSelect.Root>
  );
}
