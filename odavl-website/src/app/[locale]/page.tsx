import EnhancedHeroSection from '@/components/landing/EnhancedHeroSection';
import TrustSection from '@/components/landing/TrustSection'; 
import { Footer, LazyContent, WebVitalsReporter, LocaleSwitcher } from '@/components';
import Link from 'next/link';
import { getMessages } from 'next-intl/server';

type HomeProps = {
  readonly params: Promise<{ readonly locale: string }>;
};

type HomeContentProps = {
  readonly heroMessages: Record<string, string>;
};

function HomeContent({ heroMessages }: HomeContentProps) {
  return (
    <div className="min-h-screen">
      <WebVitalsReporter />
      
      {/* Enhanced Hero Section with pre-loaded messages */}
      <EnhancedHeroSection heroMessages={heroMessages} />
      
      {/* Trust Section with Social Proof */}
      <TrustSection />
      
      {/* Lazy-loaded content for better performance */}
      <LazyContent />

      {/* Temporary Developer Section - Will be removed in later waves */}
      <section className="py-8 bg-slate-900/30 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <LocaleSwitcher />
          <p className="text-xs text-white/50 mt-4">
            Development: <Link href="/test" className="underline hover:text-white/70">/test</Link> • 
            <Link href="/pricing" className="underline hover:text-white/70 ml-2">/pricing</Link> • 
            <Link href="/docs" className="underline hover:text-white/70 ml-2">/docs</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  const messages = await getMessages();
  
  if (!messages) {
    console.warn('⚠️ Missing messages for locale', locale);
    // Return fallback content for SSR safety
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">ODAVL</h1>
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Pre-extract hero messages for SSR hydration
  const heroMessages = messages.hero as Record<string, string> || {};
  
  return <HomeContent heroMessages={heroMessages} />;
}
