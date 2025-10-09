import EnhancedHeroSection from '@/components/landing/EnhancedHeroSection';
import TrustSection from '@/components/landing/TrustSection'; 
import { Footer, LazyContent, WebVitalsReporter, LocaleSwitcher } from '@/components';
import Link from 'next/link';
import { getMessages } from 'next-intl/server';

type HomeProps = {
  readonly params: Promise<{ readonly locale: string }>;
};

function HomeContent() {
  return (
    <div className="min-h-screen">
      <WebVitalsReporter />
      
      {/* Enhanced Hero Section */}
      <EnhancedHeroSection />
      
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
  }
  
  return <HomeContent />;
}
