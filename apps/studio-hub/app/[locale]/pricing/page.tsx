'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const tiers = [
    {
      name: 'FREE',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for individual developers and small projects',
      features: [
        '1 user',
        '5 projects',
        'Basic error detection (TypeScript, ESLint)',
        'VS Code extension',
        'CLI access',
        'Community support',
        '100 analyses per month',
        'Public repositories only',
      ],
      cta: 'Start Free',
      ctaLink: '/auth/signup',
      highlighted: false,
    },
    {
      name: 'PRO',
      price: { monthly: 49, yearly: 470 }, // 20% discount yearly
      description: 'For professional developers and growing teams',
      features: [
        '5 users',
        'Unlimited projects',
        'All 12 detectors (Insight)',
        'Autopilot self-healing (10 fixes/month)',
        'Guardian pre-deploy testing',
        'ML-powered analysis',
        'Priority support',
        'Private repositories',
        'Unlimited analyses',
        'Trust score analytics',
        'Custom recipes',
        'API access',
      ],
      cta: 'Start 14-Day Trial',
      ctaLink: '/auth/signup?plan=pro',
      highlighted: true,
      badge: 'Most Popular',
    },
    {
      name: 'ENTERPRISE',
      price: { monthly: null, yearly: null },
      priceLabel: 'Custom',
      description: 'For large teams with advanced requirements',
      features: [
        'Unlimited users',
        'Unlimited projects',
        'All PRO features',
        'Unlimited autopilot fixes',
        'Self-hosted deployment',
        'Custom ML training',
        'SLA guarantee (99.9%)',
        'Dedicated support',
        'Custom integrations',
        'Advanced security',
        'Audit logs',
        'SSO / SAML',
        'Compliance (SOC2, GDPR)',
        'Custom contract',
      ],
      cta: 'Contact Sales',
      ctaLink: '/contact',
      highlighted: false,
    },
  ];

  const faqs = [
    {
      question: 'Can I change plans later?',
      answer: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately, and billing is prorated.',
    },
    {
      question: 'What happens after my free trial ends?',
      answer: 'Your account automatically downgrades to the FREE tier. No credit card required for trial.',
    },
    {
      question: 'Do you offer student or open-source discounts?',
      answer: 'Yes! Students get 50% off PRO plan with valid student ID. Open-source projects with 100+ stars get free PRO.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and wire transfer for Enterprise.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, cancel anytime with no penalties. You keep access until the end of your billing period.',
    },
    {
      question: 'Is there a setup fee?',
      answer: 'No setup fees for any plan. Enterprise self-hosted deployments include free onboarding assistance.',
    },
    {
      question: 'What is the refund policy?',
      answer: '30-day money-back guarantee. If you\'re not satisfied, we\'ll refund your payment in full.',
    },
  ];

  const getPrice = (tier: typeof tiers[0]) => {
    if (!tier.price.monthly) return tier.priceLabel || 'Custom';
    const price = billingPeriod === 'monthly' ? tier.price.monthly : tier.price.yearly / 12;
    return `$${Math.round(price)}`;
  };

  const getSavings = () => {
    if (billingPeriod === 'yearly') {
      return (
        <span className="text-green-600 dark:text-green-400 text-sm font-semibold">
          Save 20% 🎉
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12">
          Choose the plan that fits your needs. All plans include 14-day free trial. No credit card required.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span
            className={`text-lg font-semibold ${
              billingPeriod === 'monthly'
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative w-16 h-8 rounded-full transition-colors ${
              billingPeriod === 'yearly' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            aria-label="Toggle billing period"
          >
            <span
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                billingPeriod === 'yearly' ? 'translate-x-8' : 'translate-x-0'
              }`}
            />
          </button>
          <span
            className={`text-lg font-semibold ${
              billingPeriod === 'yearly'
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Yearly
          </span>
          {getSavings()}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-8 transition-all ${
                tier.highlighted
                  ? 'bg-blue-600 text-white shadow-2xl scale-105 border-4 border-blue-400'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-xl'
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                  {tier.badge}
                </div>
              )}

              {/* Tier Name */}
              <h3
                className={`text-2xl font-bold mb-2 ${
                  tier.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}
              >
                {tier.name}
              </h3>

              {/* Description */}
              <p
                className={`text-sm mb-6 ${
                  tier.highlighted ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {tier.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-5xl font-bold ${
                      tier.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {getPrice(tier)}
                  </span>
                  {tier.price.monthly !== null && (
                    <span
                      className={`text-lg ${
                        tier.highlighted ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      /month
                    </span>
                  )}
                </div>
                {billingPeriod === 'yearly' && tier.price.yearly && (
                  <p
                    className={`text-sm mt-2 ${
                      tier.highlighted ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    ${tier.price.yearly}/year (billed annually)
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <Link
                href={tier.ctaLink}
                className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-colors mb-8 ${
                  tier.highlighted
                    ? 'bg-white text-blue-600 hover:bg-gray-100'
                    : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                }`}
              >
                {tier.cta}
              </Link>

              {/* Features */}
              <ul className="space-y-3">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className={`text-xl mt-0.5 ${
                        tier.highlighted ? 'text-white' : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      ✓
                    </span>
                    <span
                      className={`text-sm ${
                        tier.highlighted ? 'text-blue-50' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Matrix */}
      <section className="container mx-auto px-4 py-16 bg-gray-100 dark:bg-gray-800 rounded-xl my-12">
        <h2 className="text-4xl font-bold text-center mb-12">Detailed Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Feature</th>
                <th className="px-6 py-4 text-center font-semibold">FREE</th>
                <th className="px-6 py-4 text-center font-semibold bg-blue-50 dark:bg-blue-900">PRO</th>
                <th className="px-6 py-4 text-center font-semibold">ENTERPRISE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[
                { feature: 'Users', free: '1', pro: '5', enterprise: 'Unlimited' },
                { feature: 'Projects', free: '5', pro: 'Unlimited', enterprise: 'Unlimited' },
                { feature: 'Analyses/Month', free: '100', pro: 'Unlimited', enterprise: 'Unlimited' },
                { feature: 'Basic Detectors', free: '✓', pro: '✓', enterprise: '✓' },
                { feature: 'All 12 Detectors', free: '—', pro: '✓', enterprise: '✓' },
                { feature: 'Autopilot Fixes', free: '—', pro: '10/month', enterprise: 'Unlimited' },
                { feature: 'Guardian Testing', free: '—', pro: '✓', enterprise: '✓' },
                { feature: 'ML Analysis', free: '—', pro: '✓', enterprise: '✓' },
                { feature: 'Private Repos', free: '—', pro: '✓', enterprise: '✓' },
                { feature: 'API Access', free: '—', pro: '✓', enterprise: '✓' },
                { feature: 'Custom Recipes', free: '—', pro: '✓', enterprise: '✓' },
                { feature: 'Self-Hosted', free: '—', pro: '—', enterprise: '✓' },
                { feature: 'SLA', free: '—', pro: '—', enterprise: '99.9%' },
                { feature: 'SSO/SAML', free: '—', pro: '—', enterprise: '✓' },
                { feature: 'Support', free: 'Community', pro: 'Priority', enterprise: 'Dedicated' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 font-medium">{row.feature}</td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">{row.free}</td>
                  <td className="px-6 py-4 text-center bg-blue-50 dark:bg-blue-900 font-semibold">
                    {row.pro}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">
                    {row.enterprise}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 group"
            >
              <summary className="font-semibold text-lg cursor-pointer list-none flex items-center justify-between">
                <span>{faq.question}</span>
                <span className="text-blue-600 dark:text-blue-400 transition-transform group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Start your 14-day free trial today. No credit card required.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
          >
            Start Free Trial
          </Link>
          <Link
            href="/contact"
            className="border border-gray-300 dark:border-gray-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Contact Sales
          </Link>
        </div>
      </section>
    </div>
  );
}
