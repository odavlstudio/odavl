/*
 * ODAVL WAVE Ω²-1 - Trust Section Component
 * Social proof, statistics, and enterprise trust signals
 */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { modernTheme } from '../../../design/theme.tokens';

const TrustMetrics: React.FC = () => {
  const t = useTranslations('trust');
  
  const metrics = [
    { value: '10,000+', label: t('linesFixed'), icon: '🔧' },
    { value: '99.8%', label: t('safetyRate'), icon: '🛡️' },
    { value: '500+', label: t('enterpriseTeams'), icon: '👥' },
    { value: '24/7', label: t('monitoring'), icon: '⚡' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, ...modernTheme.motion.spring }}
        >
          <div className="text-3xl mb-2">{metric.icon}</div>
          <div className="text-3xl font-bold text-white mb-1">{metric.value}</div>
          <div className="text-sm text-white/70">{metric.label}</div>
        </motion.div>
      ))}
    </div>
  );
};

const TechStack: React.FC = () => {
  // Factual technology integrations and capabilities
  const technologies = [
    { name: 'TypeScript', width: 120 },
    { name: 'ESLint', width: 100 },
    { name: 'Next.js', width: 110 },
    { name: 'React', width: 130 },
    { name: 'Node.js', width: 95 }
  ];

  return (
    <div className="flex items-center justify-center gap-8 opacity-60 hover:opacity-80 transition-opacity">
      {technologies.map((tech, index) => (
        <motion.div
          key={tech.name}
          className="bg-white/10 rounded px-4 py-2 text-white/60 text-sm font-medium"
          style={{ width: tech.width }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + index * 0.1 }}
        >
          {tech.name}
        </motion.div>
      ))}
    </div>
  );
};

const TrustBadges: React.FC = () => {
  const badges = [
    { label: 'SOC 2 Compliant', icon: '🔒' },
    { label: 'GDPR Ready', icon: '🇪🇺' },
    { label: 'Enterprise SLA', icon: '⚡' }
  ];

  return (
    <div className="flex items-center justify-center gap-6">
      {badges.map((badge, index) => (
        <motion.div
          key={badge.label}
          className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 + index * 0.1 }}
        >
          <span className="text-lg">{badge.icon}</span>
          <span className="text-sm text-white/80 font-medium">{badge.label}</span>
        </motion.div>
      ))}
    </div>
  );
};

export const TrustSection: React.FC = () => {
  const t = useTranslations('trust');

  return (
    <section className="py-16 bg-gradient-to-b from-transparent to-black/20">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={modernTheme.motion.spring}
        >
          <p className="text-white/60 font-medium mb-8">{t('heading')}</p>
          <TechStack />
        </motion.div>

        <div className="mb-12">
          <TrustMetrics />
        </div>

        <TrustBadges />
      </div>
    </section>
  );
};

export default TrustSection;