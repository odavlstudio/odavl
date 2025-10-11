'use client';

import { useState, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { 
  Calculator, 
  Check, 
  ArrowRight, 
  TrendingUp,
  Clock,
  DollarSign,
  Shield
} from 'lucide-react';

const PricingCard = ({ 
  name, 
  price, 
  period, 
  description, 
  features, 
  popular = false, 
  cta,
  delay = 0 
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  cta: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
    className={`relative h-full p-8 rounded-2xl border transition-all duration-300 ${
      popular 
        ? 'bg-gradient-to-br from-electric-cyan/10 to-odavl-navy/20 border-electric-cyan/50 shadow-[0_0_30px_rgba(0,212,255,0.2)]' 
        : 'bg-gradient-to-br from-white/5 to-white/2 border-white/10 hover:border-electric-cyan/30'
    }`}
  >
    {popular && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <div className="px-4 py-2 bg-electric-cyan text-odavl-navy rounded-full text-sm font-semibold">
          Most Popular
        </div>
      </div>
    )}

    <div className="text-center mb-8">
      <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
      <p className="text-slate-300 mb-6">{description}</p>
      
      <div className="mb-6">
        <span className="text-4xl font-bold text-white">{price}</span>
        <span className="text-muted-accessible ml-2">/{period}</span>
      </div>
    </div>

    <ul className="space-y-4 mb-8">
      {features.map((feature, index) => (
        <li key={`${name}-feature-${index}`} className="flex items-start gap-3">
          <Check className="w-5 h-5 text-electric-cyan flex-shrink-0 mt-0.5" />
          <span className="text-slate-200 text-base">{feature}</span>
        </li>
      ))}
    </ul>

    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
        popular
          ? 'bg-electric-cyan text-odavl-navy hover:bg-electric-cyan/90'
          : 'border border-electric-cyan/50 text-electric-cyan hover:bg-electric-cyan/10'
      }`}
    >
      {cta}
    </motion.button>
  </motion.div>
);



const ROICalculator = memo(function ROICalculator() {
  const t = useTranslations('pricing.roi');
  const [developers, setDevelopers] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(75);
  const [issuesPerWeek, setIssuesPerWeek] = useState(25);
  const [timePerIssue, setTimePerIssue] = useState(2);

  // Memoized ROI Calculations for better performance
  const calculations = useMemo(() => {
    const weeklyTimeSaved = issuesPerWeek * timePerIssue * 0.7; // 70% time reduction
    const weeklyCostSaving = weeklyTimeSaved * hourlyRate;
    const monthlySaving = weeklyCostSaving * 4.33; // Average weeks per month
    const yearlySaving = monthlySaving * 12;
    const odavlAnnualCost = developers * 99 * 12; // Assuming $99/dev/month
    const netROI = yearlySaving - odavlAnnualCost;
    const roiPercentage = ((netROI / odavlAnnualCost) * 100).toFixed(0);
    
    return {
      monthlySaving,
      yearlySaving,
      netROI,
      roiPercentage
    };
  }, [developers, hourlyRate, issuesPerWeek, timePerIssue]);

  const { monthlySaving, yearlySaving, netROI, roiPercentage } = calculations;

  return (
    <div className="p-8 rounded-2xl bg-gradient-to-br from-odavl-navy/20 to-slate-900/40 border border-white/10">
      <div className="text-center mb-8">
        <Calculator className="w-8 h-8 text-electric-cyan mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">{t('title')}</h3>
        <p className="text-slate-300">{t('subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Input Controls */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {t('inputs.developers')}
            </label>
            <input
              type="range"
              min="5"
              max="100"
              value={developers}
              onChange={(e) => setDevelopers(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer
                         slider:bg-electric-cyan slider:rounded-full"
            />
            <div className="text-electric-cyan font-semibold mt-1">{developers} developers</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {t('inputs.hourlyRate')}
            </label>
            <input
              type="range"
              min="50"
              max="150"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
            />
            <div className="text-electric-cyan font-semibold mt-1">${hourlyRate}/hour</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {t('inputs.issuesPerWeek')}
            </label>
            <input
              type="range"
              min="10"
              max="50"
              value={issuesPerWeek}
              onChange={(e) => setIssuesPerWeek(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
            />
            <div className="text-electric-cyan font-semibold mt-1">{issuesPerWeek} issues/week</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {t('inputs.timePerIssue')}
            </label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={timePerIssue}
              onChange={(e) => setTimePerIssue(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
            />
            <div className="text-electric-cyan font-semibold mt-1">{timePerIssue} hours/issue</div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-electric-cyan/10 to-transparent border border-electric-cyan/20">
            <div className="text-3xl font-bold text-electric-cyan mb-2">
              {roiPercentage}%
            </div>
            <div className="text-white font-semibold mb-1">{t('results.roi')}</div>
            <div className="text-xs text-muted-accessible">{t('results.roiDescription')}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-white/5">
              <div className="text-xl font-bold text-white mb-1">
                ${monthlySaving.toLocaleString()}
              </div>
              <div className="text-xs text-muted-accessible">{t('results.monthlySaving')}</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-white/5">
              <div className="text-xl font-bold text-white mb-1">
                ${yearlySaving.toLocaleString()}
              </div>
              <div className="text-xs text-muted-accessible">{t('results.yearlySaving')}</div>
            </div>
          </div>

          <div className="text-center p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <div className="text-2xl font-bold text-green-400 mb-1">
              ${netROI.toLocaleString()}
            </div>
            <div className="text-sm text-white font-medium">{t('results.netROI')}</div>
            <div className="text-xs text-muted-accessible mt-1">{t('results.netROIDescription')}</div>
          </div>
        </div>
      </div>
    </div>
  );
});

const ValueProp = ({ 
  icon: Icon, 
  title, 
  description, 
  metric,
  delay = 0 
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  metric: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
    className="text-center p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/2 border border-white/10
               hover:border-electric-cyan/30 transition-all duration-300"
  >
    <Icon className="w-10 h-10 text-electric-cyan mx-auto mb-4" />
    <div className="text-2xl font-bold text-electric-cyan mb-2">{metric}</div>
    <h4 className="font-semibold text-white mb-2">{title}</h4>
    <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
  </motion.div>
);

export default function EnhancedPricingSection() {
  const t = useTranslations('pricing');

  const pricingTiers = [
    {
      name: t('tiers.starter.name'),
      price: t('tiers.starter.price'),
      period: t('period.month'),
      description: t('tiers.starter.description'),
      features: [
        t('tiers.starter.features.repositories'),
        t('tiers.starter.features.basicFixes'),
        t('tiers.starter.features.reports'),
        t('tiers.starter.features.support'),
        t('tiers.starter.features.integrations')
      ],
      cta: t('cta.startTrial'),
      popular: false
    },
    {
      name: t('tiers.professional.name'),
      price: t('tiers.professional.price'),
      period: t('period.month'),
      description: t('tiers.professional.description'),
      features: [
        t('tiers.professional.features.unlimited'),
        t('tiers.professional.features.advancedFixes'),
        t('tiers.professional.features.customRules'),
        t('tiers.professional.features.cicd'),
        t('tiers.professional.features.analytics'),
        t('tiers.professional.features.priority')
      ],
      cta: t('cta.startTrial'),
      popular: true
    },
    {
      name: t('tiers.enterprise.name'),
      price: t('tiers.enterprise.price'),
      period: t('period.custom'),
      description: t('tiers.enterprise.description'),
      features: [
        t('tiers.enterprise.features.onPremise'),
        t('tiers.enterprise.features.sla'),
        t('tiers.enterprise.features.dedicated'),
        t('tiers.enterprise.features.training'),
        t('tiers.enterprise.features.compliance'),
        t('tiers.enterprise.features.customization')
      ],
      cta: t('cta.contactSales'),
      popular: false
    }
  ];

  const valueProps = [
    {
      icon: Clock,
      title: t('value.time.title'),
      description: t('value.time.description'),
      metric: t('value.time.metric')
    },
    {
      icon: DollarSign,
      title: t('value.cost.title'),
      description: t('value.cost.description'),
      metric: t('value.cost.metric')
    },
    {
      icon: TrendingUp,
      title: t('value.quality.title'),
      description: t('value.quality.description'),
      metric: t('value.quality.metric')
    },
    {
      icon: Shield,
      title: t('value.safety.title'),
      description: t('value.safety.description'),
      metric: t('value.safety.metric')
    }
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-odavl-navy via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(0,212,255,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(15,52,96,0.2),transparent_50%)]" />

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
            <DollarSign className="w-4 h-4 text-electric-cyan" />
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

        {/* Value Propositions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {valueProps.map((prop, index) => (
            <ValueProp
              key={`value-${prop.title}`}
              {...prop}
              delay={0.1 * index}
            />
          ))}
        </div>

        {/* ROI Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <ROICalculator />
        </motion.div>

        {/* Pricing Tiers */}
        <div className="mb-20">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-white mb-16"
          >
            {t('plans.title')}
          </motion.h3>

          <div className="grid lg:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <PricingCard
                key={`tier-${tier.name}`}
                {...tier}
                delay={0.1 * index}
              />
            ))}
          </div>
        </div>

        {/* Enterprise CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="max-w-3xl mx-auto p-8 rounded-2xl bg-gradient-to-br from-electric-cyan/10 to-odavl-navy/20 
                          border border-electric-cyan/30">
            <h3 className="text-2xl font-bold text-white mb-4">
              {t('enterprise.title')}
            </h3>
            <p className="text-slate-300 mb-6 leading-relaxed">
              {t('enterprise.description')}
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-electric-cyan to-blue-500 
                         text-white font-semibold text-lg shadow-[0_0_30px_rgba(0,212,255,0.3)]
                         hover:shadow-[0_0_50px_rgba(0,212,255,0.5)] transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-2">
                {t('enterprise.cta')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-electric-cyan/20 to-blue-500/20 
                              blur-xl group-hover:scale-110 transition-transform duration-300" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}