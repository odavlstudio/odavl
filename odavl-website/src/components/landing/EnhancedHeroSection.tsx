/*
 * ODAVL WAVE Ω²-1 - Enhanced Hero Section
 * Enterprise-focused messaging with clear value proposition
 */

'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import Link from 'next/link';

// Utility to render text with markdown-like bold formatting
const renderBoldText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};
import { Button } from '@/components/ui/button';
import { modernTheme } from '../../../design/theme.tokens';

const EnterpriseLogoBadge: React.FC = () => (
  <motion.div
    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.8, ...modernTheme.motion.spring }}
  >
    {/* Outer glow ring */}
    <motion.div
      className="absolute inset-0 rounded-full opacity-20 blur-xl"
      style={{ background: modernTheme.colors.gradients.cta }}
      animate={{ 
        scale: [1, 1.1, 1],
        opacity: [0.2, 0.3, 0.2]
      }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    
    {/* Middle ring */}
    <motion.div
      className="absolute inset-6 rounded-full border border-white/20 backdrop-blur-sm"
      style={{ background: 'rgba(255, 255, 255, 0.05)' }}
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    />
    
    {/* Inner logo area */}
    <div className="absolute inset-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 flex items-center justify-center">
      <div className="text-2xl font-bold text-white">ODAVL</div>
    </div>
  </motion.div>
);

const ValuePropositionBadges: React.FC = () => {
  const t = useTranslations('hero');
  
  const benefits = [
    { key: 'autonomous', icon: '🤖' },
    { key: 'enterprise', icon: '🏢' },
    { key: 'secure', icon: '🔒' }
  ];

  return (
    <motion.div
      className="flex flex-wrap gap-3 justify-center lg:justify-start"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, ...modernTheme.motion.spring }}
    >
      {benefits.map((benefit, index) => (
        <motion.div
          key={benefit.key}
          className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2"
          whileHover={{ 
            scale: 1.05, 
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)'
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 + index * 0.1 }}
        >
          <span className="text-lg">{benefit.icon}</span>
          <span className="text-sm font-medium text-white">{t(`benefits.${benefit.key}`)}</span>
        </motion.div>
      ))}
    </motion.div>
  );
};

const CTAButtons: React.FC = () => {
  const t = useTranslations('hero');
  const locale = useLocale();

  return (
    <motion.div
      className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, ...modernTheme.motion.spring }}
    >
      {/* Primary CTA */}
      <Button 
        size="lg" 
        className="group relative overflow-hidden font-semibold px-8 py-4 h-auto text-base"
        style={{ 
          background: modernTheme.colors.gradients.cta,
          border: 'none'
        }}
        asChild
      >
        <Link href={`/${locale}/pilot`}>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.5 }}
          />
          <span className="relative z-10 text-white">{t('ctaPrimary')}</span>
        </Link>
      </Button>

      {/* Secondary CTA */}
      <Button 
        variant="outline" 
        size="lg" 
        className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 font-semibold px-8 py-4 h-auto text-base backdrop-blur-sm"
        asChild
      >
        <Link href={`/${locale}/demo`}>
          {t('ctaSecondary')}
        </Link>
      </Button>
    </motion.div>
  );
};

export const EnhancedHeroSection: React.FC = () => {
  const t = useTranslations('hero');

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Enhanced Background */}
      <div 
        className="absolute inset-0"
        style={{ background: modernTheme.colors.gradients.hero }}
      />
      
      {/* Overlay for better text contrast */}
      <div 
        className="absolute inset-0"
        style={{ background: modernTheme.colors.gradients.heroOverlay }}
      />
      
      {/* Animated background elements */}
      <motion.div 
        className="absolute top-20 -left-4 w-96 h-96 rounded-full opacity-10"
        style={{ background: modernTheme.colors.gradients.cta }}
        animate={{ 
          x: [0, 100, 0], 
          y: [0, -50, 0], 
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div 
        className="absolute bottom-20 -right-4 w-80 h-80 rounded-full opacity-10"
        style={{ background: modernTheme.colors.brand.accent }}
        animate={{ 
          x: [0, -80, 0], 
          y: [0, 30, 0], 
          rotate: [0, 180, 360]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <motion.div 
            className="space-y-8 text-center lg:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={modernTheme.motion.spring}
          >
            {/* Pre-headline */}
            <motion.div
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-white">{t('preHeadline')}</span>
            </motion.div>

            {/* Main headline */}
            <motion.h1 
              className="font-black leading-tight text-white"
              style={{ 
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                background: modernTheme.colors.gradients.text,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, ...modernTheme.motion.spring }}
            >
              {t('headline')}
            </motion.h1>
            
            {/* Subheadline */}
            <motion.p 
              className="text-xl lg:text-2xl text-white/90 font-medium max-w-2xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, ...modernTheme.motion.spring }}
            >
              {t('subheadline')}
            </motion.p>

            {/* Value proposition badges */}
            <ValuePropositionBadges />
            
            {/* CTA Buttons */}
            <CTAButtons />

            {/* Trust indicator */}
            <motion.p
              className="text-sm text-white/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {renderBoldText(t('trustIndicator'))}
            </motion.p>
          </motion.div>
          
          {/* Visual Element */}
          <motion.div 
            className="relative h-96 lg:h-[500px]"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, ...modernTheme.motion.spring }}
          >
            <EnterpriseLogoBadge />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedHeroSection;