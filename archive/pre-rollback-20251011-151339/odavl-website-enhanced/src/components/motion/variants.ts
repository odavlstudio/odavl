'use client';

import { motion, type Variants } from 'framer-motion';

// Optimized animation variants for better performance
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 }
};

// High-performance motion components with optimizations
export const MotionDiv = motion.div;
export const MotionSection = motion.section;
export const MotionH2 = motion.h2;
export const MotionH3 = motion.h3;
export const MotionP = motion.p;
export const MotionButton = motion.button;

// Optimized viewport options for better performance
export const defaultViewport = { 
  once: true, 
  margin: "-50px" 
};

// Fast transition presets
export const fastTransition = { 
  duration: 0.3, 
  ease: "easeOut" 
};

export const mediumTransition = { 
  duration: 0.5, 
  ease: "easeOut" 
};