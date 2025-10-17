// ODAVL-WAVE-X7-INJECT: Animated Button - Enhanced CTA with Motion
// @odavl-governance: UX-POLISH-SAFE mode active

'use client';
import React from 'react';

import { motion } from 'framer-motion';
import { buttonHover } from './motion.config';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  ariaLabel
}: AnimatedButtonProps) {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2';

  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <motion.button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      {...buttonHover}
    >
      {children}
    </motion.button>
  );
}
