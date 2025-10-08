'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface DocBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function DocBreadcrumbs({ items }: DocBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <motion.span
          key={`${item.title}-${index}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
          className="flex items-center space-x-2"
        >
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.title}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.title}</span>
          )}
        </motion.span>
      ))}
    </nav>
  );
}