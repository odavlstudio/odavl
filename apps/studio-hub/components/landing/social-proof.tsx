'use client';

import { motion } from 'framer-motion';
import { Star, Users, TrendingUp, Clock, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'CTO, TechCorp',
    avatar: 'S',
    avatarColor: 'bg-blue-600',
    quote: 'ODAVL reduced our debugging time by 60%. The ML-powered suggestions are incredibly accurate and save us hours every week.',
    rating: 5
  },
  {
    id: 2,
    name: 'Michael Rodriguez',
    role: 'Lead Developer, StartupXYZ',
    avatar: 'M',
    avatarColor: 'bg-purple-600',
    quote: 'Autopilot caught issues we didn\'t even know existed. It\'s like having a senior developer reviewing every commit automatically.',
    rating: 5
  },
  {
    id: 3,
    name: 'Aisha Patel',
    role: 'VP Engineering, FinTech Inc',
    avatar: 'A',
    avatarColor: 'bg-green-600',
    quote: 'Guardian saved us from a critical security vulnerability before our Series A launch. The ROI was immediate and substantial.',
    rating: 5
  },
  {
    id: 4,
    name: 'James Liu',
    role: 'Senior DevOps, CloudScale',
    avatar: 'J',
    avatarColor: 'bg-orange-600',
    quote: 'The integration with our CI/CD pipeline was seamless. ODAVL is now an essential part of our quality gates.',
    rating: 5
  },
  {
    id: 5,
    name: 'Elena Volkov',
    role: 'Engineering Manager, DataFlow',
    avatar: 'E',
    avatarColor: 'bg-pink-600',
    quote: 'We saw a 70% reduction in production bugs within the first month. The team morale improved dramatically.',
    rating: 5
  },
  {
    id: 6,
    name: 'David Park',
    role: 'CTO, MobileFirst',
    avatar: 'D',
    avatarColor: 'bg-indigo-600',
    quote: 'ODAVL\'s multi-language support is a game-changer. We use TypeScript, Python, and Java, and it handles all three flawlessly.',
    rating: 5
  }
];

const stats = [
  {
    icon: Users,
    value: '1,000+',
    label: 'Teams',
    color: 'text-blue-600'
  },
  {
    icon: TrendingUp,
    value: '10M+',
    label: 'Lines Analyzed',
    color: 'text-purple-600'
  },
  {
    icon: Clock,
    value: '99.9%',
    label: 'Uptime',
    color: 'text-green-600'
  },
  {
    icon: Shield,
    value: '24/7',
    label: 'Support',
    color: 'text-orange-600'
  }
];

export function SocialProof() {
  const t = useTranslations('home');

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
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
            Trusted by Development Teams Worldwide
          </h2>
          <p className="text-xl text-gray-600">
            Join thousands of developers shipping better code faster
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 max-w-5xl mx-auto"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;

            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="text-center bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <Icon className={`h-8 w-8 ${stat.color} mx-auto mb-3`} />
                <div className={`text-4xl font-bold ${stat.color} mb-2`}>
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ y: -8 }}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all"
            >
              {/* Avatar & Info */}
              <div className="flex items-center mb-6">
                <div className={`w-12 h-12 ${testimonial.avatarColor} rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
                  {testimonial.avatar}
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-16"
        >
          <p className="text-center text-gray-600 mb-6 font-medium">
            Certified & Compliant
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg shadow-md">
              <Shield className="h-6 w-6 text-green-600" />
              <span className="font-semibold text-gray-900">SOC 2 Type II</span>
            </div>
            <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg shadow-md">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg shadow-md">
              <Shield className="h-6 w-6 text-purple-600" />
              <span className="font-semibold text-gray-900">ISO 27001</span>
            </div>
            <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg shadow-md">
              <Shield className="h-6 w-6 text-orange-600" />
              <span className="font-semibold text-gray-900">HIPAA Ready</span>
            </div>
          </div>
        </motion.div>

        {/* Bottom Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1 }}
          className="text-center mt-12"
        >
          <a
            href="/case-studies"
            className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 group"
          >
            Read More Case Studies
            <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
