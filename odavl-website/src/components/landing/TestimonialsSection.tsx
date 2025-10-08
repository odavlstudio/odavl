'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { 
  Quote, 
  Star, 
  Building2, 
  Users, 
  TrendingUp,
  ArrowRight,
  Award
} from 'lucide-react';

const TestimonialCard = ({ 
  quote, 
  author, 
  role, 
  company, 
  avatar, 
  results, 
  rating = 5,
  delay = 0 
}: {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar: string;
  results: { metric: string; value: string; }[];
  rating?: number;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
    className="relative group"
  >
    <div className="h-full p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/2 border border-white/10
                    hover:border-electric-cyan/30 transition-all duration-300 backdrop-blur-sm
                    hover:shadow-[0_0_30px_rgba(0,212,255,0.15)]">
      
      {/* Quote Icon */}
      <div className="mb-6">
        <Quote className="w-8 h-8 text-electric-cyan/60" />
      </div>

      {/* Rating Stars */}
      <div className="flex gap-1 mb-6">
        {[...Array(rating)].map((_, i) => (
          <Star key={`star-${author}-${i}`} className="w-4 h-4 text-yellow-400 fill-current" />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-white text-lg leading-relaxed mb-8 font-medium">
        &ldquo;{quote}&rdquo;
      </blockquote>

      {/* Results */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {results.map((result, index) => (
          <div key={`${author}-result-${index}`} className="text-center">
            <div className="text-2xl font-bold text-electric-cyan mb-1">
              {result.value}
            </div>
            <div className="text-xs text-slate-400">
              {result.metric}
            </div>
          </div>
        ))}
      </div>

      {/* Author */}
      <div className="flex items-center gap-4 pt-6 border-t border-white/10">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-electric-cyan/20 to-odavl-navy/40 
                        flex items-center justify-center text-electric-cyan font-bold text-lg">
          {avatar}
        </div>
        <div>
          <div className="font-semibold text-white">{author}</div>
          <div className="text-sm text-slate-300">{role}</div>
          <div className="text-xs text-electric-cyan/70">{company}</div>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-electric-cyan/5 to-transparent 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  </motion.div>
);

const CaseStudyCard = ({ 
  company, 
  industry, 
  challenge, 
  solution, 
  results, 
  logo,
  delay = 0 
}: {
  company: string;
  industry: string;
  challenge: string;
  solution: string;
  results: { title: string; value: string; improvement: string; }[];
  logo: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
    className="relative group"
  >
    <div className="h-full p-8 rounded-2xl bg-gradient-to-br from-odavl-navy/20 to-slate-900/40 
                    border border-white/10 hover:border-electric-cyan/30 transition-all duration-300
                    hover:shadow-[0_0_30px_rgba(0,212,255,0.15)]">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center
                        text-2xl font-bold text-electric-cyan">
          {logo}
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{company}</h3>
          <p className="text-sm text-slate-300">{industry}</p>
        </div>
      </div>

      {/* Challenge */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-electric-cyan mb-2">Challenge</h4>
        <p className="text-slate-300 text-sm leading-relaxed">{challenge}</p>
      </div>

      {/* Solution */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-electric-cyan mb-2">Solution</h4>
        <p className="text-slate-300 text-sm leading-relaxed">{solution}</p>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-electric-cyan">Results</h4>
        {results.map((result, index) => (
          <div key={`${company}-result-${index}`} 
               className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <div>
              <div className="text-sm font-medium text-white">{result.title}</div>
              <div className="text-xs text-slate-400">{result.improvement}</div>
            </div>
            <div className="text-lg font-bold text-electric-cyan">
              {result.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

const TrustBadge = ({ 
  icon: Icon, 
  title, 
  description,
  delay = 0 
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
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
    <Icon className="w-8 h-8 text-electric-cyan mx-auto mb-4" />
    <h4 className="font-semibold text-white mb-2">{title}</h4>
    <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
  </motion.div>
);

export default function TestimonialsSection() {
  const t = useTranslations('testimonials');

  const testimonials = [
    {
      quote: t('testimonial1.quote'),
      author: t('testimonial1.author'),
      role: t('testimonial1.role'),
      company: t('testimonial1.company'),
      avatar: "SM",
      results: [
        { metric: t('testimonial1.results.quality'), value: "85%" },
        { metric: t('testimonial1.results.time'), value: "40%" }
      ]
    },
    {
      quote: t('testimonial2.quote'),
      author: t('testimonial2.author'),
      role: t('testimonial2.role'),
      company: t('testimonial2.company'),
      avatar: "DR",
      results: [
        { metric: t('testimonial2.results.defects'), value: "92%" },
        { metric: t('testimonial2.results.velocity'), value: "60%" }
      ]
    },
    {
      quote: t('testimonial3.quote'),
      author: t('testimonial3.author'),
      role: t('testimonial3.role'),
      company: t('testimonial3.company'),
      avatar: "AL",
      results: [
        { metric: t('testimonial3.results.incidents'), value: "78%" },
        { metric: t('testimonial3.results.deployment'), value: "3x" }
      ]
    }
  ];

  const caseStudies = [
    {
      company: t('case1.company'),
      industry: t('case1.industry'),
      challenge: t('case1.challenge'),
      solution: t('case1.solution'),
      logo: "TG",
      results: [
        { 
          title: t('case1.results.quality.title'), 
          value: t('case1.results.quality.value'),
          improvement: t('case1.results.quality.improvement') 
        },
        { 
          title: t('case1.results.time.title'), 
          value: t('case1.results.time.value'),
          improvement: t('case1.results.time.improvement') 
        }
      ]
    },
    {
      company: t('case2.company'),
      industry: t('case2.industry'),
      challenge: t('case2.challenge'),
      solution: t('case2.solution'),
      logo: "FS",
      results: [
        { 
          title: t('case2.results.defects.title'), 
          value: t('case2.results.defects.value'),
          improvement: t('case2.results.defects.improvement') 
        },
        { 
          title: t('case2.results.satisfaction.title'), 
          value: t('case2.results.satisfaction.value'),
          improvement: t('case2.results.satisfaction.improvement') 
        }
      ]
    }
  ];

  const trustBadges = [
    {
      icon: Award,
      title: t('trust.certification.title'),
      description: t('trust.certification.description')
    },
    {
      icon: Building2,
      title: t('trust.enterprise.title'),
      description: t('trust.enterprise.description')
    },
    {
      icon: Users,
      title: t('trust.community.title'),
      description: t('trust.community.description')
    },
    {
      icon: TrendingUp,
      title: t('trust.growth.title'),
      description: t('trust.growth.description')
    }
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-odavl-navy to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_20%,rgba(0,212,255,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(15,52,96,0.15),transparent_50%)]" />

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
            <Award className="w-4 h-4 text-electric-cyan" />
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

        {/* Customer Testimonials */}
        <div className="mb-32">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-white mb-16"
          >
            {t('testimonials.title')}
          </motion.h3>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={`testimonial-${testimonial.author}`}
                {...testimonial}
                delay={0.1 * index}
              />
            ))}
          </div>
        </div>

        {/* Case Studies */}
        <div className="mb-32">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-white mb-4"
          >
            {t('caseStudies.title')}
          </motion.h3>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-slate-300 text-center max-w-2xl mx-auto mb-16"
          >
            {t('caseStudies.subtitle')}
          </motion.p>

          <div className="grid lg:grid-cols-2 gap-8">
            {caseStudies.map((caseStudy, index) => (
              <CaseStudyCard
                key={`case-${caseStudy.company}`}
                {...caseStudy}
                delay={0.2 * index}
              />
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mb-20">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-center text-white mb-12"
          >
            {t('trust.title')}
          </motion.h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustBadges.map((badge, index) => (
              <TrustBadge
                key={`trust-${badge.title}`}
                {...badge}
                delay={0.1 * index}
              />
            ))}
          </div>
        </div>

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
          
          <p className="text-slate-400 text-sm mt-4">
            {t('cta.subtitle')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}