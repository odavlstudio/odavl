'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import LocaleSwitcher from './LocaleSwitcher';

export default function Navbar() {
  const t = useTranslations('nav');
  const cta = useTranslations('cta');
  const locale = useLocale();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href={`/${locale}`} className="flex items-center gap-3 group">
              <div className="relative">
                <Image src="/logo.svg" alt="ODAVL" width={32} height={32} className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full opacity-0 group-hover:opacity-20 blur transition-opacity" />
              </div>
              <span className="text-xl font-bold text-white">ODAVL</span>
              <span className="text-xs bg-cyan-400/20 text-cyan-200 px-2 py-1 rounded-full font-medium">Enterprise</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link 
                href={`/${locale}`}
                className="text-sm font-medium text-white/80 hover:text-white transition-colors relative group"
              >
                {t('home')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link 
                href={`/${locale}/docs/quickstart`}
                className="text-sm font-medium text-white/80 hover:text-white transition-colors relative group"
              >
                {t('docs')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link 
                href={`/${locale}/security`}
                className="text-sm font-medium text-white/80 hover:text-white transition-colors relative group"
              >
                {t('security')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link 
                href={`/${locale}/pricing`}
                className="text-sm font-medium text-white/80 hover:text-white transition-colors relative group"
              >
                {t('pricing')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link 
                href={`/${locale}/contact`}
                className="text-sm font-medium text-white/80 hover:text-white transition-colors relative group"
              >
                {t('contact')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LocaleSwitcher />
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white/80 hover:text-white hover:bg-white/10"
              asChild
            >
              <Link href={`/${locale}/login`}>
                Sign In
              </Link>
            </Button>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-semibold border-0"
              asChild
            >
              <Link href={`/${locale}/pilot`}>
                {cta('startPilot')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}