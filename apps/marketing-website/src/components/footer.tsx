'use client';

import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-brand-dark border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-purple rounded-lg" />
              <span className="text-xl font-bold text-white">ODAVL Studio</span>
            </div>
            <p className="text-gray-400 text-sm">
              Autonomous code quality platform powered by AI
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Products</h3>
            <ul className="space-y-2">
              <li><Link href="/products/insight" className="text-gray-400 hover:text-white transition">ODAVL Insight</Link></li>
              <li><Link href="/products/autopilot" className="text-gray-400 hover:text-white transition">ODAVL Autopilot</Link></li>
              <li><Link href="/products/guardian" className="text-gray-400 hover:text-white transition">ODAVL Guardian</Link></li>
              <li><Link href="/marketplace" className="text-gray-400 hover:text-white transition">Marketplace</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link href="/docs" className="text-gray-400 hover:text-white transition">Documentation</Link></li>
              <li><Link href="/pricing" className="text-gray-400 hover:text-white transition">Pricing</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition">Contact Sales</Link></li>
              <li><Link href="/console" className="text-gray-400 hover:text-white transition">Cloud Console</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="https://github.com/odavlstudio" className="text-gray-400 hover:text-white transition">
                <Github className="w-6 h-6" />
              </a>
              <a href="https://twitter.com/odavlstudio" className="text-gray-400 hover:text-white transition">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="https://linkedin.com/company/odavl" className="text-gray-400 hover:text-white transition">
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              &copy; 2025 ODAVL Studio. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition">Privacy Policy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition">Terms of Service</Link>
              <Link href="/security" className="text-gray-400 hover:text-white transition">Security</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
