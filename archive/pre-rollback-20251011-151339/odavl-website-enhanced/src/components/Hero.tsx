/*
 * ODAVL WAVE X-1 - Modern Hero Component
 * Enhanced with glass morphism, advanced animations, and pulse logo
 */

'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
/* <ODAVL-AUTO-REFINE> Removed unused Badge import */
import { modernTheme } from '../theme.tokens';

const PulseLogo: React.FC = () => (
  <motion.div
    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32"
    {...modernTheme.motion.pulse}
  >
    <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 opacity-20 blur-xl" />
    <motion.div
      className="absolute inset-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-300 opacity-40"
      {...modernTheme.motion.float}
    />
    <div className="absolute inset-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30" />
  </motion.div>
);

const FloatingOrbs: React.FC = () => (
  <>
    <motion.div 
      className="absolute top-20 -left-4 w-96 h-96 rounded-full"
      style={{ background: modernTheme.colors.gradients.hero }}
      animate={{ x: [0, 100, 0], y: [0, -50, 0], rotate: [0, 180, 360] }}
      transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div 
      className="absolute bottom-20 -right-4 w-80 h-80 rounded-full opacity-30"
      style={{ background: modernTheme.colors.gradients.card }}
      animate={{ x: [0, -80, 0], y: [0, 30, 0], scale: [1, 1.2, 1] }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
    />
  </>
);

export const ModernHero: React.FC = () => {
  const t = useTranslations('hero');
  const locale = useLocale();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Dynamic Background */}
      <div 
        className="absolute inset-0 opacity-90"
        style={{ background: modernTheme.colors.gradients.hero }}
      />
      
      {/* Glass Overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/10" />
      
      {/* Floating Elements */}
      <FloatingOrbs />
      
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
            <motion.h1 
              className="font-black leading-tight text-white"
              style={{ 
                fontSize: modernTheme.typography.scale.hero,
                background: modernTheme.colors.gradients.text,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, ...modernTheme.motion.spring }}
            >
              {t('title')}
            </motion.h1>
            
            <motion.p 
              className="text-xl lg:text-2xl text-white/80 font-medium max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, ...modernTheme.motion.spring }}
            >
              {t('subtitle')}
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, ...modernTheme.motion.spring }}
            >
              <Button size="lg" className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/20 text-white font-semibold px-8 py-4 h-auto" asChild>
                <Link href={`/${locale}/pilot#pilot-form`}>
                  {t('ctaPilot')}
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 px-8 py-4 h-auto" asChild>
                <Link href="https://marketplace.visualstudio.com/items?itemName=odavl.odavl" target="_blank" rel="noopener noreferrer">
                  {t('ctaInstall')}
                </Link>
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Visual Element */}
          <motion.div 
            className="relative h-96 lg:h-[500px]"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, ...modernTheme.motion.spring }}
          >
            <PulseLogo />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ModernHero;