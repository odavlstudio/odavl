'use client';

import { motion } from 'framer-motion';
import { Download, Search, Zap, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

const steps = [
  {
    id: 1,
    title: 'Install Extension',
    description: 'Install ODAVL VS Code extension in 1 click',
    icon: Download,
    color: 'from-blue-500 to-indigo-500',
    badge: 'bg-blue-600'
  },
  {
    id: 2,
    title: 'Analyze Code',
    description: 'Real-time error detection as you type',
    icon: Search,
    color: 'from-purple-500 to-pink-500',
    badge: 'bg-purple-600'
  },
  {
    id: 3,
    title: 'Auto-Fix',
    description: 'Accept AI-powered fixes with one click',
    icon: Zap,
    color: 'from-green-500 to-emerald-500',
    badge: 'bg-green-600'
  },
  {
    id: 4,
    title: 'Deploy Safely',
    description: 'Guardian tests run before every deployment',
    icon: Shield,
    color: 'from-orange-500 to-amber-500',
    badge: 'bg-orange-600'
  }
];

export function HowItWorks() {
  const t = useTranslations('home');

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How ODAVL Works
            </h2>
            <p className="text-xl text-gray-600">
              From installation to deployment in 4 simple steps
            </p>
          </motion.div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.6 }}
                  className="text-center"
                >
                  {/* Icon Container */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-6 shadow-xl`}
                  >
                    <Icon className="w-10 h-10" />
                  </motion.div>

                  {/* Step Number */}
                  <div className={`w-8 h-8 ${step.badge} text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4`}>
                    {step.id}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600">
                    {step.description}
                  </p>

                  {/* Connector Line (except last item) */}
                  {index < steps.length - 1 && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.15 + 0.3, duration: 0.5 }}
                      className="hidden lg:block absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 origin-left"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="text-center mt-16"
          >
            <p className="text-gray-600 mb-6">
              Ready to streamline your development workflow?
            </p>
            <a
              href="/auth/signin"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Get Started Free
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
