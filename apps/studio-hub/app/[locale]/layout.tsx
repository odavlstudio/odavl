import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/request';
import { TRPCProvider } from "@/lib/trpc/provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Inter, Roboto_Mono } from "next/font/google";
import type { ReactNode } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "ODAVL Studio - Autonomous Code Quality Platform",
  description: "ML-powered error detection, self-healing infrastructure, and pre-deploy testing",
};

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>; // Next.js 15: async params
};

// Type guard to validate locale at runtime
function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Disable ALL static generation - runtime contexts required
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0; // Disable ISR

// Help Next.js infer the correct type for params
export function generateStaticParams(): Array<{ locale: string }> {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: Props) {
  // Next.js 15: params is async - must await
  const resolvedParams = await params;
  const locale = resolvedParams.locale;

  // Runtime validation (should never fail with proper routing)
  if (!isValidLocale(locale)) {
    notFound();
  }

  // Fetch messages for current locale
  const messages = await getMessages();

  // Get session for SessionProvider
  const session = await getServerSession(authOptions);

  return (
    <html lang={locale} className={`${inter.variable} ${robotoMono.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <SessionProvider session={session}>
          <NextIntlClientProvider messages={messages}>
            <TRPCProvider>
              <Navbar />
              <main className="min-h-screen">{children}</main>
              <Footer />
            </TRPCProvider>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
