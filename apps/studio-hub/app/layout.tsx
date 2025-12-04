/**
 * Root Layout for Non-Localized Pages
 * Required by Next.js for pages outside [locale]/
 *
 * Pages using this layout:
 * - /api-docs (if not moved)
 * - /auth/* (signin, signup, etc.)
 * - /playground
 * - /test-guardian
 * - /status
 * - /health
 */

import type { Metadata } from 'next';
import { SessionProvider } from "@/components/providers/session-provider";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

// Force dynamic rendering (disable SSG for error pages)
export const dynamic = 'force-dynamic';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "ODAVL Studio - Autonomous Code Quality Platform",
  description: "ML-powered error detection, self-healing infrastructure, and pre-deploy testing",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get session for SessionProvider
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${robotoMono.variable} antialiased`}>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
