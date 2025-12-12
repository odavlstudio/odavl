import Link from 'next/link';
import { Check } from 'lucide-react';
import { Metadata } from 'next';
import { pricingMetadata } from '@/components/seo/Metadata';

export const metadata: Metadata = pricingMetadata;

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-blue/10 to-brand-purple/10">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-purple rounded-lg" />
              <span className="text-xl font-bold text-brand-dark">ODAVL Studio</span>
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold text-white text-center mb-6">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-300 text-center mb-12 max-w-3xl mx-auto">
            Start free, scale as you grow. All plans include core features with no hidden fees.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard
              name="Free"
              price="$0"
              description="Perfect for individuals and small projects"
              features={[
                'Up to 3 projects',
                '100 API calls/month',
                'Community support',
                'Basic detectors',
                '7-day data retention',
              ]}
              cta="Start Free"
              ctaLink="/console"
            />
            <PricingCard
              name="Pro"
              price="$29"
              description="For professional developers and teams"
              features={[
                'Unlimited projects',
                '1,000 API calls/month',
                'Priority support',
                'All detectors + ML features',
                '90-day data retention',
                'Advanced analytics',
                'Custom recipes',
              ]}
              cta="Start Trial"
              ctaLink="/console"
              highlighted
            />
            <PricingCard
              name="Enterprise"
              price="$199"
              description="For large teams and organizations"
              features={[
                'Unlimited everything',
                'Unlimited API calls',
                'Dedicated support',
                'All features + custom training',
                'Unlimited data retention',
                'SSO & SAML',
                'SLA guarantee',
                'On-premise deployment',
              ]}
              cta="Contact Sales"
              ctaLink="/contact"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function PricingCard({ name, price, description, features, cta, ctaLink, highlighted }: {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  highlighted?: boolean;
}) {
  return (
    <div className={`p-8 rounded-xl ${highlighted ? 'bg-white border-2 border-brand-blue shadow-2xl scale-105' : 'bg-white/10 backdrop-blur-md border border-white/20'}`}>
      <h3 className={`text-2xl font-bold mb-2 ${highlighted ? 'text-brand-dark' : 'text-white'}`}>{name}</h3>
      <div className="mb-4">
        <span className={`text-4xl font-bold ${highlighted ? 'text-brand-blue' : 'text-white'}`}>{price}</span>
        <span className={highlighted ? 'text-gray-600' : 'text-gray-300'}>/month</span>
      </div>
      <p className={`mb-6 ${highlighted ? 'text-gray-600' : 'text-gray-300'}`}>{description}</p>
      <ul className="space-y-3 mb-8">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start">
            <Check className={`w-5 h-5 mr-2 mt-0.5 ${highlighted ? 'text-brand-blue' : 'text-brand-green'}`} />
            <span className={highlighted ? 'text-gray-700' : 'text-gray-300'}>{feature}</span>
          </li>
        ))}
      </ul>
      <Link href={ctaLink} className={`block w-full py-3 rounded-lg text-center font-semibold transition ${highlighted ? 'bg-brand-blue text-white hover:bg-brand-blue/90' : 'bg-white/20 text-white hover:bg-white/30'}`}>
        {cta}
      </Link>
    </div>
  );
}
