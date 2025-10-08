'use client';

import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface CodeBlockProps {
  children: string;
  language?: string;
  filename?: string;
  className?: string;
}

export function CodeBlock({ children, language, filename, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('relative group', className)}>
      {filename && (
        <div className="bg-muted px-4 py-2 text-sm font-mono border-b">
          {filename}
        </div>
      )}
      <div className="relative">
        <pre className={cn(
          'p-4 overflow-x-auto text-sm',
          'bg-slate-950 text-slate-50 rounded-md',
          filename && 'rounded-t-none'
        )}>
          <code className={language ? `language-${language}` : ''}>{children}</code>
        </pre>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={copyToClipboard}
          className={cn(
            'absolute top-2 right-2 p-2 rounded',
            'bg-slate-800 hover:bg-slate-700',
            'opacity-0 group-hover:opacity-100 transition-opacity'
          )}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </motion.button>
      </div>
    </div>
  );
}