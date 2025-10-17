import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { defaultMetadata, organizationSchema, softwareSchema } from "@/lib/seo";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  ...defaultMetadata,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'), // ODAVL-RUNTIME-INJECT-METADATABASE
};

type RootLayoutProps = {
  readonly children: React.ReactNode;
  readonly params: Promise<{ readonly locale?: string }>;
};

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = await params;
  const currentLocale = locale ?? 'en';
  const messages = await getMessages();

  return (
    <html lang={currentLocale} dir={currentLocale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <title>ODAVL – Autonomous Code Quality & Governance for Enterprises</title>
        <meta name="description" content="Secure, compliant, and intelligent code governance directly inside VS Code. Transform your codebase with intelligent, autonomous quality improvements backed by enterprise-grade safety controls." />
        <link rel="canonical" href="https://odavl.studio/" />
        <meta property="og:title" content="ODAVL – Autonomous Code Quality & Governance for Enterprises" />
        <meta property="og:description" content="Secure, compliant, and intelligent code governance directly inside VS Code. Transform your codebase with intelligent, autonomous quality improvements backed by enterprise-grade safety controls." />
        <meta property="og:image" content="https://odavl.studio/og-image.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://odavl.studio/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ODAVL – Autonomous Code Quality & Governance for Enterprises" />
        <meta name="twitter:description" content="Secure, compliant, and intelligent code governance directly inside VS Code. Transform your codebase with intelligent, autonomous quality improvements backed by enterprise-grade safety controls." />
        <meta name="twitter:image" content="https://odavl.studio/og-image.png" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
        {/* ...existing code... */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="/logo.svg" as="image" type="image/svg+xml" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#0f3460" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-slate-950 text-white`}>
        <NextIntlClientProvider messages={messages} locale={currentLocale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
