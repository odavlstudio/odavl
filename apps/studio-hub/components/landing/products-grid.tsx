'use client';

import { motion } from 'framer-motion';
import { Search, Zap, Shield, Check, ArrowRight, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

const products = [
  {
    id: 'insight',
    name: 'ODAVL Insight',
    icon: Search,
    color: 'blue',
    gradient: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-100 hover:border-blue-300',
    iconBg: 'bg-blue-600',
    iconColor: 'text-blue-600',
    description: 'ML-Powered Error Detection',
    longDesc: 'Detect TypeScript, ESLint, security vulnerabilities, and performance issues before they reach production. 12 specialized detectors with 95% accuracy.',
    features: [
      '12 specialized error detectors',
      'Real-time analysis in VS Code',
      'Multi-language support (TS, Python, Java)',
      'Automated fix suggestions'
    ],
    stats: 'Detects 10x more issues than traditional linters',
    href: '/products/insight'
  },
  {
    id: 'autopilot',
    name: 'ODAVL Autopilot',
    icon: Zap,
    color: 'purple',
    gradient: 'from-purple-50 to-pink-50',
    borderColor: 'border-purple-100 hover:border-purple-300',
    iconBg: 'bg-purple-600',
    iconColor: 'text-purple-600',
    description: 'Self-Healing Infrastructure',
    longDesc: 'Autonomous code fixes using O-D-A-V-L cycle (Observe, Decide, Act, Verify, Learn). Zero human intervention required.',
    features: [
      'Automatic dependency updates',
      'Import optimization',
      'Code complexity reduction',
      'Trust-based recipe system'
    ],
    stats: 'Fixes 80% of common issues automatically',
    href: '/products/autopilot'
  },
  {
    id: 'guardian',
    name: 'ODAVL Guardian',
    icon: Shield,
    color: 'emerald',
    gradient: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-100 hover:border-emerald-300',
    iconBg: 'bg-emerald-600',
    iconColor: 'text-emerald-600',
    description: 'Pre-Deploy Testing Suite',
    longDesc: 'Test accessibility, performance, security, and Core Web Vitals before every deployment. Prevent production incidents.',
    features: [
      'Lighthouse integration',
      'OWASP Top 10 scanning',
      'Core Web Vitals tracking',
      'Multi-environment testing'
    ],
    stats: 'Reduces production bugs by 70%',
    href: '/products/guardian'
  }
];

export function ProductsGrid() {
  const t = useTranslations('home');

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Three Products, One Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive code quality solution from error detection to autonomous fixes and pre-deploy testing
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {products.map((product, index) => {
            const Icon = product.icon;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className={`group relative bg-gradient-to-br ${product.gradient} rounded-2xl p-8 border-2 ${product.borderColor} transition-all hover:shadow-2xl`}
              >
                {/* Background decoration */}
                <div className={`absolute top-4 right-4 w-16 h-16 ${product.iconBg} rounded-xl opacity-10 group-hover:opacity-20 transition-opacity`} />

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className={`w-14 h-14 ${product.iconBg} rounded-xl flex items-center justify-center mb-6 shadow-lg`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h3>

                  {/* Description */}
                  <p className="text-lg font-semibold text-gray-700 mb-3">
                    {product.description}
                  </p>

                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {product.longDesc}
                  </p>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {product.features.map((feature) => (
                      <motion.li
                        key={feature}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex items-start gap-2"
                      >
                        <Check className={`h-5 w-5 ${product.iconColor} mt-0.5 flex-shrink-0`} />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* Stats Badge */}
                  <div className={`bg-${product.color}-50 rounded-lg p-4 mb-6 border border-${product.color}-100`}>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className={`h-4 w-4 ${product.iconColor}`} />
                      <p className={`text-xs font-semibold ${product.iconColor} uppercase tracking-wide`}>
                        Impact
                      </p>
                    </div>
                    <p className={`text-sm font-semibold ${product.iconColor}`}>
                      {product.stats}
                    </p>
                  </div>

                  {/* Learn More Link */}
                  <Link
                    href={product.href}
                    className={`inline-flex items-center ${product.iconColor} font-semibold hover:gap-3 transition-all group/link`}
                  >
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            View Pricing
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
