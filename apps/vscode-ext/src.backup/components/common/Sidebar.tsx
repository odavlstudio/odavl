import { Home, BarChart, Settings, Activity, Brain, BookOpen } from 'lucide-react';
import clsx from 'clsx';
import type { ReactNode } from 'react';

const navItems = [
  { label: 'Dashboard', icon: Home, route: '/dashboard' },
  { label: 'Activity', icon: Activity, route: '/activity' },
  { label: 'Insights', icon: BarChart, route: '/insights' },
  { label: 'Intelligence', icon: Brain, route: '/intelligence' },
  { label: 'Recipes', icon: BookOpen, route: '/recipes' },
  { label: 'Config', icon: Settings, route: '/config' },
];

type SidebarProps = {
  currentRoute: string;
  onNavigate: (route: string) => void;
  className?: string;
  footer?: ReactNode;
};

export function Sidebar({ currentRoute, onNavigate, className, footer }: SidebarProps) {
  return (
    <aside className={clsx('flex flex-col h-full w-20 bg-sidebar border-r border-border py-4', className)}>
      <nav className="flex-1 flex flex-col gap-2 items-center">
        {navItems.map(({ label, icon: Icon, route }) => (
          <button
            key={route}
            title={label}
            className={clsx(
              'flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-colors',
              currentRoute === route ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-accent',
            )}
            onClick={() => onNavigate(route)}
            aria-current={currentRoute === route}
          >
            <Icon className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </nav>
      {footer && <div className="mt-auto px-2">{footer}</div>}
    </aside>
  );
}
