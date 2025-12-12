'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Zap, Shield } from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: CheckCircle,
      title: 'ML-Powered Detection',
      description: '16+ specialized detectors with machine learning for accurate issue identification',
    },
    {
      icon: Zap,
      title: 'Self-Healing Automation',
      description: 'Parallel recipe execution with ML trust prediction and smart rollback',
    },
    {
      icon: Shield,
      title: 'Pre-Deploy Testing',
      description: 'Comprehensive website testing with quality gates and multi-browser support',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Why Choose ODAVL?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20"
            >
              <feature.icon className="w-12 h-12 text-brand-blue mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
