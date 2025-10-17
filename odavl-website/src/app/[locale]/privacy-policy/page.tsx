// Enable static export for all supported locales
export function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'fr' },
    { locale: 'de' },
    { locale: 'es' },
    { locale: 'it' },
    { locale: 'pt' },
    { locale: 'ja' },
    { locale: 'zh' },
    { locale: 'ru' },
  ];
}
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - ODAVL',
  description: 'Learn how ODAVL protects your privacy with zero telemetry collection and GDPR compliance.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-8">
            Privacy Policy
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-8">
              Last updated: October 11, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
              <p className="text-gray-700 leading-relaxed">
                At ODAVL, we believe privacy is a fundamental right. This policy explains how we collect, use, and protect your information when you use our autonomous code quality platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Collection</h2>
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <p className="text-green-800 font-semibold">
                  🛡️ ODAVL software collects ZERO telemetry from your code or development environment.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Website Analytics</h3>
                  <p className="text-gray-700">We use Plausible Analytics (privacy-focused, no cookies) to understand website usage:</p>
                  <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                    <li>Page views and session duration</li>
                    <li>Referral sources and popular pages</li>
                    <li>General geographic regions (country-level only)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Contact Information</h3>
                  <p className="text-gray-700">When you contact us or sign up for our services, we collect only the information you voluntarily provide (name, email, company).</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Data</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>To communicate with you about our services</li>
                <li>To improve our website and services</li>
                <li>To provide customer support</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Sharing & Sales</h2>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <p className="text-blue-800 font-semibold">
                  We NEVER sell, rent, or trade your personal information.
                </p>
              </div>
              <p className="text-gray-700">We may share information only in limited circumstances: legal compliance, service providers (with strict privacy agreements), or business transfers (with notice).</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies & Tracking</h2>
              <p className="text-gray-700 mb-4">We use minimal cookies for essential website functionality:</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Plausible Analytics</h3>
                <p className="text-gray-700 text-sm">Uses a single cookie for visitor counting. No personal data collected. GDPR, CCPA, and PECR compliant.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights (GDPR/CCPA)</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request data deletion</li>
                <li>Data portability</li>
                <li>Object to processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-700">We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your information.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">International Transfers</h2>
              <p className="text-gray-700">Your data may be processed in countries with different privacy laws. We ensure adequate protection through standard contractual clauses and other safeguards.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Policy Changes</h2>
              <p className="text-gray-700">We may update this policy periodically. Significant changes will be communicated via email or website notice 30 days in advance.</p>
            </section>

            <section className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 mb-4">For privacy questions or to exercise your rights, contact us:</p>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <span className="font-medium">Email:</span> privacy@odavl.com
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Address:</span><br />
                  ODAVL Privacy Officer<br />
                  123 Enterprise Way<br />
                  Tech Valley, CA 94000<br />
                  United States
                </p>
              </div>
            </section>


          </div>
        </div>
      </div>
    </div>
  );
}
