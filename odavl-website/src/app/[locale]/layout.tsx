/*
 * ODAVL WAVE X-1 - Modern Locale Layout
 * Next.js 15 locale-specific layout with internationalization
 */

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import OptimizedMotionConfig from '@/components/motion/MotionConfig';

type LocaleLayoutProps = {
  readonly children: React.ReactNode;
  readonly params: Promise<{ readonly locale: string }>;
};

const locales = ['en', 'de', 'ar', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'zh'];

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  
  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <OptimizedMotionConfig>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
          <Navbar />
          <main id="main" role="main" className="pt-16">
            {children}
          </main>
        </div>
      </OptimizedMotionConfig>
    </NextIntlClientProvider>
  );
}