'use client';

import { motion } from 'framer-motion';
import { Play, ArrowRight, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { VideoModal } from './video-modal';

export function HeroSection() {
  const t = useTranslations('home');
  const [showVideo, setShowVideo] = useState(false);

  return (
    <>
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />

        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />

        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8 border border-white/20"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium">{t('hero.badge')}</span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            >
              ODAVL Studio
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300 mt-2"
              >
                {t('hero.titleAccent')}
              </motion.span>
            </motion.h1>

            {/* Subheading */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-2xl md:text-3xl text-blue-100 mb-6 font-semibold"
            >
              AI-Powered Error Detection, Self-Healing Infrastructure, and Pre-Deploy Testing
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Stop debugging manually. Let ODAVL&apos;s machine learning algorithms detect errors, automatically fix issues, and test your applications before deployment. Join <span className="font-bold text-white">1,000+ teams</span> shipping better code faster.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <motion.a
                href="/auth/signin"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-900 bg-white rounded-lg hover:bg-blue-50 transition-all shadow-xl group"
              >
                {t('hero.ctaPrimary')}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <motion.button
                onClick={() => setShowVideo(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-lg hover:bg-white/20 transition-all group"
              >
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Demo (90s)
              </motion.button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="flex flex-wrap items-center justify-center gap-8 text-blue-100"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="flex items-center gap-2"
              >
                <Check className="h-5 w-5 text-green-400" />
                <span className="text-sm font-medium">99.9% Uptime</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.4 }}
                className="flex items-center gap-2"
              >
                <Check className="h-5 w-5 text-green-400" />
                <span className="text-sm font-medium">SOC 2 Certified</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.6 }}
                className="flex items-center gap-2"
              >
                <Check className="h-5 w-5 text-green-400" />
                <span className="text-sm font-medium">GDPR Compliant</span>
              </motion.div>
            </motion.div>

            {/* Trusted by section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.8 }}
              className="mt-16"
            >
              <p className="text-blue-200 text-sm mb-6 font-medium">
                Trusted by 1,000+ developers at world-class companies
              </p>

              {/* Company logos placeholder - you can replace with actual logos */}
              <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
                <div className="w-32 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold">
                  Logo 1
                </div>
                <div className="w-32 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold">
                  Logo 2
                </div>
                <div className="w-32 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold">
                  Logo 3
                </div>
                <div className="w-32 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold">
                  Logo 4
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 80C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Video Modal */}
      <VideoModal
        isOpen={showVideo}
        onClose={() => setShowVideo(false)}
        videoUrl="https://www.youtube.com/embed/dQw4w9WgXcQ" // Replace with actual demo video
      />
    </>
  );
}
