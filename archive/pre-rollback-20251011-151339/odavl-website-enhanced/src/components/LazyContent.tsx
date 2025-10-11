'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load heavy components for better performance
const FeaturesSection = dynamic(
  () => import('@/components/landing/FeaturesSection'),
  { 
    ssr: false,
    loading: () => <div className="h-96 animate-pulse bg-white/5 rounded-lg" />
  }
);

const HowItWorksSection = dynamic(
  () => import('@/components/landing/HowItWorksSection'),
  { 
    ssr: false,
    loading: () => <div className="h-96 animate-pulse bg-white/5 rounded-lg" />
  }
);

const InteractiveDemoSection = dynamic(
  () => import('@/components/landing/InteractiveDemoSection'),
  { 
    ssr: false,
    loading: () => <div className="h-96 animate-pulse bg-white/5 rounded-lg" />
  }
);

const IntegrationsSection = dynamic(
  () => import('@/components/landing/IntegrationsSection'),
  { 
    ssr: false,
    loading: () => <div className="h-96 animate-pulse bg-white/5 rounded-lg" />
  }
);

const TestimonialsSection = dynamic(
  () => import('@/components/landing/TestimonialsSection'),
  { 
    ssr: false,
    loading: () => <div className="h-96 animate-pulse bg-white/5 rounded-lg" />
  }
);

const EnhancedPricingSection = dynamic(
  () => import('@/components/landing/EnhancedPricingSection'),
  { 
    ssr: false,
    loading: () => <div className="h-96 animate-pulse bg-white/5 rounded-lg" />
  }
);

function LazyContent() {
  return (
    <>
      {/* Features Section with Technical Depth */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-white/5 rounded-lg" />}>
        <FeaturesSection />
      </Suspense>
      
      {/* How It Works Section with Customer Journey */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-white/5 rounded-lg" />}>
        <HowItWorksSection />
      </Suspense>
      
      {/* Interactive Demo Section */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-white/5 rounded-lg" />}>
        <InteractiveDemoSection />
      </Suspense>
      
      {/* Integrations Section for Enterprise Compatibility */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-white/5 rounded-lg" />}>
        <IntegrationsSection />
      </Suspense>
      
      {/* Testimonials Section with Social Proof */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-white/5 rounded-lg" />}>
        <TestimonialsSection />
      </Suspense>
      
      {/* Pricing Section with ROI Calculator */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-white/5 rounded-lg" />}>
        <EnhancedPricingSection />
      </Suspense>
    </>
  );
}

export default LazyContent;
export { LazyContent };