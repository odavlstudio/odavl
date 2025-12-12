import Link from 'next/link';

export default function ProductsPage() {
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
          <h1 className="text-5xl font-bold text-white text-center mb-12">Our Products</h1>

          <div className="space-y-20">
            <ProductSection
              title="ODAVL Insight"
              icon="🧠"
              tagline="The Brain - ML-Powered Error Detection"
              description="Insight detects code issues before they reach production using machine learning and 16+ specialized detectors across multiple languages."
              features={[
                'TypeScript, JavaScript, Python, Java, Go, Rust detection',
                'Security vulnerability scanning',
                'Performance bottleneck identification',
                'Complexity analysis with ML predictions',
                'Import cycle detection',
                'Real-time VS Code integration',
              ]}
              link="/products/insight"
            />

            <ProductSection
              title="ODAVL Autopilot"
              icon="🤖"
              tagline="The Executor - Self-Healing Code Infrastructure"
              description="Autopilot automatically fixes code issues with complete audit trails, rollback capabilities, and ML-guided trust scoring."
              features={[
                'Automated code fixes (unused imports, formatting)',
                'Parallel recipe execution (2-4x faster)',
                'ML trust prediction for safe automation',
                'Diff-based snapshots (85% space savings)',
                'Complete audit trail with attestations',
                'O-D-A-V-L cycle (Observe-Decide-Act-Verify-Learn)',
              ]}
              link="/products/autopilot"
            />

            <ProductSection
              title="ODAVL Guardian"
              icon="🛡️"
              tagline="The Shield - Pre-Deploy Website Testing"
              description="Guardian ensures your websites are production-ready with comprehensive accessibility, performance, and security testing."
              features={[
                'Accessibility testing (WCAG 2.1, axe-core)',
                'Performance metrics (Core Web Vitals, Lighthouse)',
                'Security checks (OWASP, CSP, SSL/TLS)',
                'Visual regression testing',
                'Multi-browser/device testing',
                'Quality gates for deployment blocking',
              ]}
              link="/products/guardian"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductSection({ title, icon, tagline, description, features, link }: {
  title: string;
  icon: string;
  tagline: string;
  description: string;
  features: string[];
  link: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
      <div className="flex items-start gap-6 mb-6">
        <div className="text-6xl">{icon}</div>
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
          <p className="text-xl text-brand-blue">{tagline}</p>
        </div>
      </div>
      <p className="text-gray-300 text-lg mb-6">{description}</p>
      <ul className="grid md:grid-cols-2 gap-4 mb-6">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start">
            <span className="text-brand-green mr-2">✓</span>
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
      <Link href={link} className="inline-block px-6 py-3 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition font-semibold">
        Learn More
      </Link>
    </div>
  );
}
