'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { 
  Eye, 
  Brain, 
  Zap, 
  CheckCircle2, 
  GraduationCap,
  ArrowRight,
  ArrowDown,
  Play
} from 'lucide-react';

const ProcessStep = ({ 
  step, 
  icon: Icon, 
  title, 
  description, 
  details, 
  isLast = false,
  delay = 0 
}: {
  step: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  details: string[];
  isLast?: boolean;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay }}
    viewport={{ once: true }}
    className="relative"
  >
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Step Number & Icon */}
      <div className="flex-shrink-0 relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-electric-cyan/20 to-odavl-navy/40 
                        border border-electric-cyan/30 flex items-center justify-center relative group
                        hover:scale-110 transition-transform duration-300">
          <Icon className="w-8 h-8 text-electric-cyan" />
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-electric-cyan text-odavl-navy 
                          flex items-center justify-center text-sm font-bold">
            {step}
          </div>
          
          {/* Animated ring */}
          <div className="absolute inset-0 rounded-full border-2 border-electric-cyan/50 
                          scale-0 group-hover:scale-110 opacity-0 group-hover:opacity-100 
                          transition-all duration-500" />
        </div>
        
        {/* Connector Line */}
        {!isLast && (
          <div className="hidden lg:block absolute left-10 top-20 w-0.5 h-32 bg-gradient-to-b 
                          from-electric-cyan/50 to-transparent" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-[200px]">
        <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-electric-cyan transition-colors duration-300">
          {title}
        </h3>
        
        <p className="text-slate-300 text-lg mb-6 leading-relaxed">
          {description}
        </p>

        <div className="space-y-3">
          {details.map((detail, index) => (
            <motion.div
              key={`${title}-detail-${index}`}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: delay + 0.2 + (index * 0.1) }}
              viewport={{ once: true }}
              className="flex items-start gap-3 text-slate-300"
            >
              <CheckCircle2 className="w-5 h-5 text-electric-cyan flex-shrink-0 mt-0.5" />
              <span className="text-sm leading-relaxed">{detail}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>

    {/* Mobile Connector */}
    {!isLast && (
      <div className="lg:hidden flex justify-center my-8">
        <ArrowDown className="w-6 h-6 text-electric-cyan/50" />
      </div>
    )}
  </motion.div>
);

const CustomerJourneyStep = ({ 
  phase, 
  title, 
  description, 
  duration, 
  outcomes,
  delay = 0 
}: {
  phase: string;
  title: string;
  description: string;
  duration: string;
  outcomes: string[];
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
    className="relative p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/2 border border-white/10
               hover:border-electric-cyan/30 transition-all duration-300 group"
  >
    <div className="text-electric-cyan font-bold text-sm mb-2">{phase}</div>
    <h4 className="text-lg font-semibold text-white mb-3 group-hover:text-electric-cyan transition-colors duration-300">
      {title}
    </h4>
    <p className="text-slate-300 text-sm mb-4 leading-relaxed">{description}</p>
    
    <div className="text-xs text-electric-cyan/70 mb-4">
      Duration: {duration}
    </div>

    <div className="space-y-2">
      {outcomes.map((outcome, index) => (
        <div key={`${title}-outcome-${index}`} className="flex items-center gap-2 text-xs text-muted-accessible">
          <CheckCircle2 className="w-3 h-3 text-electric-cyan/60" />
          <span>{outcome}</span>
        </div>
      ))}
    </div>

    {/* Hover effect */}
    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-electric-cyan/5 to-transparent 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
  </motion.div>
);

export default function HowItWorksSection() {
  const t = useTranslations('howItWorks');

  const processSteps = [
    {
      step: "1",
      icon: Eye,
      title: t('observe.title'),
      description: t('observe.description'),
      details: [
        t('observe.details.metrics'),
        t('observe.details.patterns'),
        t('observe.details.baseline')
      ]
    },
    {
      step: "2",
      icon: Brain,
      title: t('decide.title'),
      description: t('decide.description'),
      details: [
        t('decide.details.analysis'),
        t('decide.details.priority'),
        t('decide.details.safety')
      ]
    },
    {
      step: "3",
      icon: Zap,
      title: t('act.title'),
      description: t('act.description'),
      details: [
        t('act.details.execution'),
        t('act.details.testing'),
        t('act.details.deployment')
      ]
    },
    {
      step: "4",
      icon: CheckCircle2,
      title: t('verify.title'),
      description: t('verify.description'),
      details: [
        t('verify.details.validation'),
        t('verify.details.metrics'),
        t('verify.details.rollback')
      ]
    },
    {
      step: "5",
      icon: GraduationCap,
      title: t('learn.title'),
      description: t('learn.description'),
      details: [
        t('learn.details.adaptation'),
        t('learn.details.improvement'),
        t('learn.details.optimization')
      ]
    }
  ];

  const customerJourney = [
    {
      phase: t('journey.discovery.phase'),
      title: t('journey.discovery.title'),
      description: t('journey.discovery.description'),
      duration: t('journey.discovery.duration'),
      outcomes: [
        t('journey.discovery.outcomes.assessment'),
        t('journey.discovery.outcomes.demo'),
        t('journey.discovery.outcomes.proposal')
      ]
    },
    {
      phase: t('journey.pilot.phase'),
      title: t('journey.pilot.title'),
      description: t('journey.pilot.description'),
      duration: t('journey.pilot.duration'),
      outcomes: [
        t('journey.pilot.outcomes.integration'),
        t('journey.pilot.outcomes.fixes'),
        t('journey.pilot.outcomes.metrics')
      ]
    },
    {
      phase: t('journey.scale.phase'),
      title: t('journey.scale.title'),
      description: t('journey.scale.description'),
      duration: t('journey.scale.duration'),
      outcomes: [
        t('journey.scale.outcomes.rollout'),
        t('journey.scale.outcomes.training'),
        t('journey.scale.outcomes.optimization')
      ]
    }
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-odavl-navy via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(0,212,255,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(15,52,96,0.2),transparent_50%)]" />

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
            <Play className="w-4 h-4 text-electric-cyan" />
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

        {/* ODAVL Process */}
        <div className="mb-32">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-white mb-16"
          >
            {t('process.title')}
          </motion.h3>

          <div className="space-y-16 lg:space-y-24">
            {processSteps.map((step, index) => (
              <ProcessStep
                key={`process-${step.step}`}
                {...step}
                isLast={index === processSteps.length - 1}
                delay={0.1 * index}
              />
            ))}
          </div>
        </div>

        {/* Customer Journey */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h3 className="text-3xl font-bold text-center text-white mb-4">
            {t('journey.title')}
          </h3>
          <p className="text-slate-300 text-center max-w-2xl mx-auto mb-16">
            {t('journey.subtitle')}
          </p>

          <div className="grid lg:grid-cols-3 gap-8">
            {customerJourney.map((step, index) => (
              <CustomerJourneyStep
                key={`journey-${step.phase}`}
                {...step}
                delay={0.2 * index}
              />
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center"
        >
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
          
          <p className="text-muted-accessible text-sm mt-4">
            {t('cta.subtitle')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}