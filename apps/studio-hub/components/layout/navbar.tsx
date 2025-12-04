'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { NavLink } from './NavLink';
import { MobileMenuButton } from './MobileMenuButton';
import { AuthButtons } from './AuthButtons';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Docs', href: '/docs' },
    { name: 'Blog', href: '/blog' },
    { name: 'About', href: '/about' },
  ];

  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ODAVL Studio
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                href={item.href}
                name={item.name}
                isActive={isActive(item.href)}
              />
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex">
            <AuthButtons />
          </div>

          {/* Mobile Menu Button */}
          <MobileMenuButton
            isOpen={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col gap-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  href={item.href}
                  name={item.name}
                  isActive={isActive(item.href)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3"
                />
              ))}
              <hr className="my-2 border-gray-200 dark:border-gray-800" />
              <AuthButtons
                mobile
                onSignInClick={() => setMobileMenuOpen(false)}
                onSignUpClick={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
