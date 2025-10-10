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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Preload critical assets */}
        <link rel="preload" href="/logo.svg" as="image" type="image/svg+xml" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
        {/* Optimize resource hints */}
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#0f3460" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-slate-950 text-white`}>
        <NextIntlClientProvider messages={messages} locale={currentLocale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
