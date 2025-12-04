'use client';

import { Github, Twitter, Linkedin, Youtube, MessageCircle, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { FooterLinkSection } from './FooterLinkSection';

const footerLinks = {
  products: [
    { name: 'ODAVL Insight', href: '/products/insight' },
    { name: 'ODAVL Autopilot', href: '/products/autopilot' },
    { name: 'ODAVL Guardian', href: '/products/guardian' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Roadmap', href: '/roadmap' },
  ],
  resources: [
    { name: 'Documentation', href: '/docs' },
    { name: 'API Reference', href: '/docs/api' },
    { name: 'Tutorials', href: '/tutorials' },
    { name: 'Blog', href: '/blog' },
    { name: 'Case Studies', href: '/case-studies' },
    { name: 'Changelog', href: '/changelog' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Contact', href: '/contact' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Security', href: '/security' },
  ],
  community: [
    { name: 'GitHub', href: 'https://github.com/odavl', icon: Github },
    { name: 'Discord', href: 'https://discord.gg/odavl', icon: MessageCircle },
    { name: 'Twitter', href: 'https://twitter.com/odavl', icon: Twitter },
    { name: 'LinkedIn', href: 'https://linkedin.com/company/odavl', icon: Linkedin },
    { name: 'YouTube', href: 'https://youtube.com/@odavl', icon: Youtube },
  ],
};

export function EnhancedFooter() {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Newsletter signup:', email);
    setEmail('');
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg" />
              <span className="text-xl font-bold text-white">ODAVL</span>
            </div>
            <p className="text-sm mb-6">
              Autonomous code quality platform powered by machine learning
            </p>

            {/* Newsletter */}
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <label className="text-sm font-semibold text-white block">
                Subscribe to Newsletter
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors"
                >
                  <Mail className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          <FooterLinkSection title="Products" links={footerLinks.products} />
          <FooterLinkSection title="Resources" links={footerLinks.resources} />
          <FooterLinkSection title="Company" links={footerLinks.company} />
          <FooterLinkSection title="Community" links={footerLinks.community} />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-sm">
              © 2025 ODAVL Studio. All rights reserved.
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs font-semibold">SOC 2</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-xs font-semibold">GDPR</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span className="text-xs font-semibold">ISO 27001</span>
              </div>
            </div>

            {/* Language Selector */}
            <select className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
              <option value="en">🇺🇸 English</option>
              <option value="ar">🇸🇦 العربية</option>
              <option value="es">🇪🇸 Español</option>
              <option value="fr">🇫🇷 Français</option>
              <option value="de">🇩🇪 Deutsch</option>
              <option value="ja">🇯🇵 日本語</option>
              <option value="zh">🇨🇳 中文</option>
              <option value="pt">🇧🇷 Português</option>
              <option value="ru">🇷🇺 Русский</option>
              <option value="hi">🇮🇳 हिन्दी</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}
