'use client';


import React from 'react';
import { MotionConfig } from 'framer-motion';

/**
 * Global Framer Motion performance optimization
 * Reduces motion on low-end devices and respects user preferences
 */
export default function OptimizedMotionConfig({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{
        type: "tween",
        ease: "easeOut",
        duration: 0.3
      }}
    >
      {children}
    </MotionConfig>
  );
}
