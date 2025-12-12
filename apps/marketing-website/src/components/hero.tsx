'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl md:text-6xl font-bold text-white mb-6"
        >
          Autonomous Code Quality
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-purple">
            Powered by AI
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto"
        >
          Transform your codebase with ML-powered detection, self-healing automation, and intelligent testing.
          Enterprise-grade quality assurance for modern development teams.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/console"
            className="px-8 py-3 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition text-lg font-semibold"
          >
            Start Free Trial
          </Link>
          <Link
            href="/products"
            className="px-8 py-3 bg-white text-brand-dark rounded-lg hover:bg-gray-100 transition text-lg font-semibold"
          >
            Explore Products
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
