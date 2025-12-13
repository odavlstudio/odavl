'use client';

import { useState } from 'react';
import { Shield, Zap, Eye, CheckCircle } from 'lucide-react';

export default function BetaSignupPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, company }),
      });

      if (response.ok) {
        setSubmitted(true);
        // Track conversion
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'beta_signup', {
            email,
            name,
            company,
          });
        }
      } else {
        alert('Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">You&apos;re In! 🎉</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Check your email for next steps. We&apos;ll send your beta access within 24 hours.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              🎁 You&apos;ve locked in: <strong>Lifetime 50% Discount</strong>
            </p>
          </div>
          <a 
            href="https://discord.gg/odavl" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-center transition-colors"
          >
            Join Our Discord Community
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Join ODAVL Studio Beta
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            Autonomous code quality that fixes itself while you sleep
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Free for 3 months</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Lifetime 50% discount</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Priority support</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Signup Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Get Early Access</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@company.com"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company (Optional)</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Signing Up...' : 'Join Beta (Free)'}
              </button>
            </form>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <Eye className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">ODAVL Insight</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                ML-powered error detection with 12 specialized detectors. Find 95% of issues before production.
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
              <Zap className="w-12 h-12 text-purple-600 dark:text-purple-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">ODAVL Autopilot</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Self-healing code infrastructure. Automatically fix 80% of routine issues with O-D-A-V-L cycle.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
              <Shield className="w-12 h-12 text-green-600 dark:text-green-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">ODAVL Guardian</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Pre-deploy testing for accessibility, performance, and security. Block bad code before release.
              </p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm mb-4">
            Join <strong>50+ developers</strong> already using ODAVL in production
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <a href="https://github.com/odavl/odavl-studio" className="hover:underline">
              ⭐ Star on GitHub
            </a>
            <a href="https://twitter.com/odavl_studio" className="hover:underline">
              🐦 Follow on Twitter
            </a>
            <a href="https://discord.gg/odavl" className="hover:underline">
              💬 Join Discord
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
