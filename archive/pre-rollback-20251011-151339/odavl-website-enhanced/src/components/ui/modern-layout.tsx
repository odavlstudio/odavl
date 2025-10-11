/*
 * ODAVL WAVE X-1 - Modern Layout Components
 * Enhanced grid system with glass morphism and responsive containers
 */

import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'wide' | 'narrow' | 'full';
  glass?: boolean;
}

export const ModernContainer: React.FC<ContainerProps> = ({ 
  children, 
  className = '', 
  variant = 'default',
  glass = false 
}) => {
  const containerClasses = {
    default: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    wide: 'max-w-8xl mx-auto px-4 sm:px-6 lg:px-12',
    narrow: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',
    full: 'w-full px-4 sm:px-6 lg:px-8',
  };

  const glassEffect = glass 
    ? 'backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl' 
    : '';

  return (
    <div className={`${containerClasses[variant]} ${glassEffect} ${className}`}>
      {children}
    </div>
  );
};

interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ModernGrid: React.FC<GridProps> = ({ 
  children, 
  cols = 1, 
  gap = 'md',
  className = '' 
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    12: 'grid-cols-12',
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12',
  };

  return (
    <div className={`grid ${gridClasses[cols]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  background?: 'default' | 'glass' | 'gradient';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ModernSection: React.FC<SectionProps> = ({
  children,
  className = '',
  background = 'default',
  padding = 'lg'
}) => {
  const backgroundClasses = {
    default: '',
    glass: 'backdrop-blur-sm bg-gradient-to-b from-white/5 to-transparent',
    gradient: 'bg-gradient-to-br from-primary/5 via-transparent to-accent/5',
  };

  const paddingClasses = {
    sm: 'py-8',
    md: 'py-16',
    lg: 'py-24',
    xl: 'py-32',
  };

  return (
    <section className={`${backgroundClasses[background]} ${paddingClasses[padding]} ${className}`}>
      {children}
    </section>
  );
};