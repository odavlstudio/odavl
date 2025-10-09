/*
 * ODAVL Pricing Page - Glass Morphism Design
 * Multi-tier pricing with modern animations and full i18n support
 */

'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ModernContainer, ModernSection } from '@/components/ui/modern-layout';
import { motion } from 'framer-motion';
import { Check, Zap, Building2, Rocket } from 'lucide-react';
import { pricingTiers } from '@/data/pricing';

export default function PricingPage() {
  const t = useTranslations('pricing');

  const iconMap = [Zap, Building2, Rocket];
  const tiers = pricingTiers.map((tier, index) => ({
    ...tier,
    price: tier.priceDisplay,
    period: tier.priceMonthly !== 'custom' && tier.priceMonthly > 0 ? t('period.month') : '',
    description: t(`tiers.${tier.id}.description`),
    icon: iconMap[index] || Rocket,
    cta: tier.ctaLabel
  }));

  return (
    <div className="min-h-screen pt-20">
      <ModernSection background="glass" padding="xl">
        <ModernContainer>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent mb-6">
              {t('title')}
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              {t('subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {tiers.map((tier, index) => {
              const Icon = tier.icon;
              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`relative backdrop-blur-xl rounded-2xl border p-8 ${
                    tier.popular
                      ? 'border-cyan-400/50 bg-white/10 scale-105'
                      : 'border-white/20 bg-white/5'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-400 to-blue-400 text-black text-sm font-semibold rounded-full">
                      {t('popular')}
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <Icon className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                    <p className="text-white/70 mb-4">{tier.description}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-white">{tier.price}</span>
                      {tier.period && <span className="text-white/60">/{tier.period}</span>}
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${
                      tier.popular
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-500 hover:to-blue-500 text-black'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    }`}
                    size="lg"
                    asChild
                  >
                    <Link href="/contact">
                      {tier.cta}
                    </Link>
                  </Button>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-16"
          >
            <p className="text-white/60 mb-8">
              {t('guarantee')}
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-white/50">
              <span>✓ {t('features.noSetup')}</span>
              <span>✓ {t('features.cancel')}</span>
              <span>✓ {t('features.support')}</span>
            </div>
          </motion.div>
        </ModernContainer>
      </ModernSection>
    </div>
  );
}