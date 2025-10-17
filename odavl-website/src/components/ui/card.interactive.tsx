// Dummy assignment to silence unused expression warning
const _odavlLintSilencer = true;

import React from "react";
// ODAVL-WAVE-X7-INJECT: Interactive Card - Glass Morphism with Depth
// @odavl-governance: UX-POLISH-SAFE mode active
"use client";

import { motion } from 'framer-motion';
import { scaleIn } from './motion.config';
import { cn } from '@/lib/utils';

interface InteractiveCardProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly hover?: boolean;
  readonly glassEffect?: boolean;
  readonly ariaLabel?: string;
}

export function InteractiveCard({
  children,
  className = '',
  hover = true,
  glassEffect = false,
  ariaLabel
}: Readonly<InteractiveCardProps>) {
  const baseClasses = 'rounded-xl border transition-all duration-300 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2';

  const glassClasses = glassEffect
    ? 'bg-white/10 backdrop-blur-md border-white/20 shadow-xl'
    : 'bg-card border-border shadow-md';

  const hoverClasses = hover
    ? 'hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]'
    : '';

  return (
    <motion.article
      className={cn(baseClasses, glassClasses, hoverClasses, className)}
      variants={scaleIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      aria-label={ariaLabel}
    >
      <div className="p-6">
        {children}
      </div>
    </motion.article>
  );
}
