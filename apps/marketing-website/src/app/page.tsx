import Link from 'next/link';
import { Metadata } from 'next';
import { homepageMetadata } from '@/components/seo/Metadata';

export const metadata: Metadata = homepageMetadata;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-blue/10 to-brand-purple/10">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-purple rounded-lg" />
              <span className="text-xl font-bold text-brand-dark">ODAVL Studio</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/products" className="text-gray-700 hover:text-brand-blue transition">Products</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-brand-blue transition">Pricing</Link>
              <Link href="/marketplace" className="text-gray-700 hover:text-brand-blue transition">Marketplace</Link>
              <Link href="/docs" className="text-gray-700 hover:text-brand-blue transition">Docs</Link>
              <Link href="/console" className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8" aria-labelledby="hero-heading">
        <div className="max-w-7xl mx-auto text-center">
          <h1 id="hero-heading" className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
            Autonomous Code Quality
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-purple">
              Powered by AI
            </span>
          </h1>
          <p id="hero-description" className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto animate-slide-up" aria-describedby="hero-heading">
            Transform your codebase with ML-powered detection, self-healing automation, and intelligent testing.
            Enterprise-grade quality assurance for modern development teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link href="/console" className="px-8 py-3 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition text-lg font-semibold" aria-label="Start your free trial of ODAVL Studio">
              Start Free Trial
            </Link>
            <Link href="/products" className="px-8 py-3 bg-white text-brand-dark rounded-lg hover:bg-gray-100 transition text-lg font-semibold" aria-label="Explore ODAVL products: Insight, Autopilot, and Guardian">
              Explore Products
            </Link>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Three Powerful Products</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <ProductCard
              title="ODAVL Insight"
              description="ML-powered error detection across 16+ detectors. Catch issues before they reach production."
              icon="🧠"
              link="/products/insight"
            />
            <ProductCard
              title="ODAVL Autopilot"
              description="Self-healing code infrastructure. Automated fixes with complete audit trails and rollback."
              icon="🤖"
              link="/products/autopilot"
            />
            <ProductCard
              title="ODAVL Guardian"
              description="Pre-deploy website testing. Accessibility, performance, security checks for production readiness."
              icon="🛡️"
              link="/products/guardian"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-brand-dark border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>&copy; 2025 ODAVL Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ title, description, icon, link }: { title: string; description: string; icon: string; link: string }) {
  return (
    <Link href={link} className="block p-6 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition border border-white/20">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </Link>
  );
}
