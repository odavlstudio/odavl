'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SidebarItem {
  title: string;
  href: string;
  items?: SidebarItem[];
}

interface DocSidebarProps {
  items: SidebarItem[];
  className?: string;
}

export function DocSidebar({ items, className }: DocSidebarProps) {
  const pathname = usePathname();

  const renderItem = (item: SidebarItem, level = 0) => {
    const isActive = pathname === item.href;
    
    return (
      <motion.div
        key={item.href}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: level * 0.05 }}
      >
        <Link
          href={item.href}
          className={cn(
            'block px-3 py-2 text-sm rounded-md transition-colors',
            'hover:bg-muted hover:text-foreground',
            isActive && 'bg-primary text-primary-foreground',
            level > 0 && 'ml-4'
          )}
        >
          {item.title}
        </Link>
        {item.items?.map(subItem => renderItem(subItem, level + 1))}
      </motion.div>
    );
  };

  return (
    <nav className={cn('space-y-1', className)}>
      <h3 className="px-3 mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Documentation
      </h3>
      {items.map(item => renderItem(item))}
    </nav>
  );
}