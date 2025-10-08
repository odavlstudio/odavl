'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface DocLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  breadcrumbs?: ReactNode;
  className?: string;
}

export function DocLayout({ children, sidebar, breadcrumbs, className }: DocLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <aside className="w-64 shrink-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {sidebar}
            </motion.div>
          </aside>
          <main className="flex-1 min-w-0">
            {breadcrumbs && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mb-4"
              >
                {breadcrumbs}
              </motion.div>
            )}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="prose prose-slate dark:prose-invert max-w-none"
            >
              {children}
            </motion.article>
          </main>
        </div>
      </div>
    </div>
  );
}