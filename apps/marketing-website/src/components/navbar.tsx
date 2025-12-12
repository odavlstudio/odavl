'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-purple rounded-lg" />
            <span className="text-xl font-bold text-brand-dark">ODAVL Studio</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-gray-700 hover:text-brand-blue transition">
              Products
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-brand-blue transition">
              Pricing
            </Link>
            <Link href="/marketplace" className="text-gray-700 hover:text-brand-blue transition">
              Marketplace
            </Link>
            <Link href="/docs" className="text-gray-700 hover:text-brand-blue transition">
              Docs
            </Link>
            <Link
              href="/console"
              className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-brand-dark" />
            ) : (
              <Menu className="w-6 h-6 text-brand-dark" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <Link
              href="/products"
              className="block text-gray-700 hover:text-brand-blue transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Products
            </Link>
            <Link
              href="/pricing"
              className="block text-gray-700 hover:text-brand-blue transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/marketplace"
              className="block text-gray-700 hover:text-brand-blue transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Marketplace
            </Link>
            <Link
              href="/docs"
              className="block text-gray-700 hover:text-brand-blue transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Docs
            </Link>
            <Link
              href="/console"
              className="block px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
