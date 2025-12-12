import Link from 'next/link';

export default function GuardianPage() {
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
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">🛡️</div>
            <h1 className="text-5xl font-bold text-white mb-4">ODAVL Guardian</h1>
            <p className="text-2xl text-brand-blue mb-6">Pre-Deploy Website Testing</p>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Ensure your websites are production-ready with comprehensive accessibility, performance, and security testing.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Testing Categories</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <TestCategory
                title="Accessibility Testing"
                items={[
                  'WCAG 2.1 compliance',
                  'axe-core integration',
                  'Keyboard navigation',
                  'Screen reader compatibility',
                  'Color contrast validation',
                ]}
              />
              <TestCategory
                title="Performance Testing"
                items={[
                  'Core Web Vitals (LCP, FID, CLS)',
                  'Lighthouse audits',
                  'TTFB measurement',
                  'Resource loading optimization',
                  'JavaScript bundle analysis',
                ]}
              />
              <TestCategory
                title="Security Testing"
                items={[
                  'OWASP Top 10 checks',
                  'CSP validation',
                  'SSL/TLS verification',
                  'XSS prevention',
                  'CSRF protection',
                ]}
              />
              <TestCategory
                title="Cross-Browser Testing"
                items={[
                  'Chrome, Firefox, Safari, Edge',
                  'Mobile/desktop viewports',
                  'Visual regression testing',
                  'Responsive design validation',
                  'Pixel-perfect comparison',
                ]}
              />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Key Features</h2>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start">
                <span className="text-brand-green mr-3 text-xl">✓</span>
                <span><strong className="text-white">Quality Gates:</strong> Block deployments based on test scores and thresholds</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-green mr-3 text-xl">✓</span>
                <span><strong className="text-white">Multi-Environment:</strong> Test staging, production, and preview deployments</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-green mr-3 text-xl">✓</span>
                <span><strong className="text-white">Real-Time Monitoring:</strong> Uptime checks, error tracking, RUM data</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-green mr-3 text-xl">✓</span>
                <span><strong className="text-white">CI/CD Integration:</strong> Webhook listeners for deployment events</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-green mr-3 text-xl">✓</span>
                <span><strong className="text-white">Historical Trends:</strong> Track performance improvements over time</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">CLI Usage</h2>
            <div className="bg-black/30 p-4 rounded-lg font-mono text-sm text-gray-300">
              <div className="mb-2"># Run all tests on a URL</div>
              <div className="text-brand-blue">odavl guardian test https://example.com</div>
              <div className="mt-4 mb-2"># Specific test suite</div>
              <div className="text-brand-blue">odavl guardian test --suite accessibility --url https://example.com</div>
              <div className="mt-4 mb-2"># Verify quality gates</div>
              <div className="text-brand-blue">odavl guardian verify --environment production</div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/console" className="inline-block px-8 py-3 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition text-lg font-semibold">
              Try Guardian Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function TestCategory({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="text-gray-300 text-sm">• {item}</li>
        ))}
      </ul>
    </div>
  );
}
