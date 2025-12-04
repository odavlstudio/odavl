import { getTranslations } from 'next-intl/server';
import { HeroSection } from '@/components/landing/hero-section';
import { ProductsGrid } from '@/components/landing/products-grid';
import { HowItWorks } from '@/components/landing/how-it-works';
import { SocialProof } from '@/components/landing/social-proof';
import { PricingTeaser } from '@/components/landing/pricing-teaser';
import { FinalCTA } from '@/components/landing/final-cta';
import { EnhancedFooter } from '@/components/landing/enhanced-footer';

// Force dynamic rendering for i18n
export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('home');
  return {
    title: 'ODAVL Studio - Autonomous Code Quality Platform',
    description: 'AI-Powered Error Detection, Self-Healing Infrastructure, and Pre-Deploy Testing for Modern Development Teams',
  };
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <ProductsGrid />
      <HowItWorks />
      <SocialProof />
      <PricingTeaser />
      <FinalCTA />
      <EnhancedFooter />
    </div>
  );
}
