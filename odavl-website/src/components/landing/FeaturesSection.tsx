'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { 
  Shield, 
  Zap, 
  Brain, 
  Target, 
  GitBranch, 
  BarChart3,
  CheckCircle,
  ArrowRight,
  Code2
} from 'lucide-react';

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  benefits, 
  delay = 0 
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  benefits: string[];
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
    className="relative group"
  >
    <div className="relative h-full p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 
                    hover:bg-white/8 hover:border-electric-cyan/30 transition-all duration-300
                    hover:shadow-[0_0_30px_rgba(0,212,255,0.15)]">
      
      {/* Icon with animated background */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-odavl-navy/20 to-electric-cyan/20 
                        flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-8 h-8 text-electric-cyan" />
        </div>
        <div className="absolute inset-0 w-16 h-16 rounded-xl bg-electric-cyan/20 blur-xl opacity-0 
                        group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-electric-cyan transition-colors duration-300">
        {title}
      </h3>
      
      <p className="text-slate-300 mb-6 leading-relaxed">
        {description}
      </p>

      <div className="space-y-3">
        {benefits.map((benefit, index) => (
          <motion.div
            key={`${title}-benefit-${index}`}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: delay + 0.1 + (index * 0.1) }}
            viewport={{ once: true }}
            className="flex items-center gap-3 text-sm text-slate-300"
          >
            <CheckCircle className="w-4 h-4 text-electric-cyan flex-shrink-0" />
            <span>{benefit}</span>
          </motion.div>
        ))}
      </div>

      {/* Hover effect gradient */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-electric-cyan/5 to-transparent 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  </motion.div>
);

const TechnicalMetric = ({ 
  value, 
  unit, 
  label, 
  description,
  delay = 0 
}: {
  value: string;
  unit: string;
  label: string;
  description: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="text-center p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/2 border border-white/10
               hover:border-electric-cyan/30 transition-all duration-300"
  >
    <div className="text-3xl font-bold text-electric-cyan mb-1">
      {value}
      <span className="text-lg text-slate-400 ml-1">{unit}</span>
    </div>
    <div className="text-sm font-medium text-white mb-2">{label}</div>
    <div className="text-xs text-slate-400 leading-relaxed">{description}</div>
  </motion.div>
);

export default function FeaturesSection() {
  const t = useTranslations('featuresSection');

  const features = [
    {
      icon: Brain,
      title: t('autonomous.title'),
      description: t('autonomous.description'),
      benefits: [
        t('autonomous.benefits.continuous'),
        t('autonomous.benefits.learning'),
        t('autonomous.benefits.proactive')
      ]
    },
    {
      icon: Shield,
      title: t('safety.title'),
      description: t('safety.description'),
      benefits: [
        t('safety.benefits.gates'),
        t('safety.benefits.rollback'),
        t('safety.benefits.validation')
      ]
    },
    {
      icon: Zap,
      title: t('performance.title'),
      description: t('performance.description'),
      benefits: [
        t('performance.benefits.speed'),
        t('performance.benefits.efficiency'),
        t('performance.benefits.scale')
      ]
    },
    {
      icon: Target,
      title: t('precision.title'),
      description: t('precision.description'),
      benefits: [
        t('precision.benefits.accuracy'),
        t('precision.benefits.context'),
        t('precision.benefits.minimal')
      ]
    },
    {
      icon: GitBranch,
      title: t('integration.title'),
      description: t('integration.description'),
      benefits: [
        t('integration.benefits.universal'),
        t('integration.benefits.workflow'),
        t('integration.benefits.tools')
      ]
    },
    {
      icon: BarChart3,
      title: t('insights.title'),
      description: t('insights.description'),
      benefits: [
        t('insights.benefits.metrics'),
        t('insights.benefits.trends'),
        t('insights.benefits.optimization')
      ]
    }
  ];

  const metrics = [
    {
      value: "99.8",
      unit: "%",
      label: t('metrics.safety.label'),
      description: t('metrics.safety.description')
    },
    {
      value: "10x",
      unit: "",
      label: t('metrics.speed.label'),
      description: t('metrics.speed.description')
    },
    {
      value: "24/7",
      unit: "",
      label: t('metrics.availability.label'),
      description: t('metrics.availability.description')
    },
    {
      value: "0",
      unit: "",
      label: t('metrics.downtime.label'),
      description: t('metrics.downtime.description')
    }
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-odavl-navy" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,212,255,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(15,52,96,0.3),transparent_50%)]" />
      
      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="container mx-auto px-6 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
                       bg-gradient-to-r from-electric-cyan/20 to-transparent 
                       border border-electric-cyan/30 mb-6"
          >
            <Code2 className="w-4 h-4 text-electric-cyan" />
            <span className="text-sm font-medium text-electric-cyan">
              {t('badge')}
            </span>
          </motion.div>

          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            {t('title.main')} <br />
            <span className="bg-gradient-to-r from-electric-cyan via-blue-400 to-electric-cyan bg-clip-text text-transparent">
              {t('title.highlight')}
            </span>
          </h2>
          
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Technical Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {metrics.map((metric, index) => (
            <TechnicalMetric
              key={`metric-${metric.label}-${index}`}
              {...metric}
              delay={0.1 * index}
            />
          ))}
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={`feature-${feature.title}-${index}`}
              {...feature}
              delay={0.1 * index}
            />
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <div className="relative inline-block">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-electric-cyan to-blue-500 
                         text-white font-semibold text-lg shadow-[0_0_30px_rgba(0,212,255,0.3)]
                         hover:shadow-[0_0_50px_rgba(0,212,255,0.5)] transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-2">
                {t('cta.main')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-electric-cyan/20 to-blue-500/20 
                              blur-xl group-hover:scale-110 transition-transform duration-300" />
            </motion.button>
          </div>
          
          <p className="text-slate-400 text-sm mt-4">
            {t('cta.subtitle')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}