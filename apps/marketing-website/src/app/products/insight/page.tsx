import Link from 'next/link';
import { Metadata } from 'next';
import { generateSEOMetadata } from '@/components/seo/Metadata';

export const metadata: Metadata = generateSEOMetadata({
  title: 'ODAVL Insight',
  description: 'ML-powered error detection with 16+ specialized detectors. Catch TypeScript errors, security vulnerabilities, performance issues, and complexity problems before production. Multi-language support for TypeScript, Python, Java, Go, Rust, and more.',
  keywords: ['error detection', 'code analysis', 'TypeScript detector', 'security scanning', 'ML-powered analysis'],
  canonical: '/products/insight',
});

export default function InsightPage() {
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
            <div className="text-6xl mb-4">🧠</div>
            <h1 className="text-5xl font-bold text-white mb-4">ODAVL Insight</h1>
            <p className="text-2xl text-brand-blue mb-6">ML-Powered Error Detection</p>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Catch code issues before they reach production with machine learning and 16+ specialized detectors.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">16 Detectors (11 Stable, 3 Experimental, 2 Broken)</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <DetectorList
                title="Stable Detectors"
                detectors={[
                  'TypeScript - Strict mode, never types, async patterns',
                  'Security - Hardcoded secrets, SQL injection, XSS',
                  'Performance - Inefficient loops, memory leaks',
                  'Complexity - Cyclomatic, cognitive complexity',
                  'Circular - Import cycle detection',
                  'Import - Missing dependencies, unused imports',
                  'Package - Outdated packages, security vulnerabilities',
                  'Runtime - Exception handling patterns',
                  'Build - Compilation errors, configuration issues',
                  'Network - API timeouts, retry logic',
                  'Isolation - Shared state, side effects',
                ]}
              />
              <DetectorList
                title="Experimental & In Development"
                detectors={[
                  'Python Types - mypy integration (experimental)',
                  'Python Security - bandit integration (experimental)',
                  'Python Complexity - radon integration (experimental)',
                  'CVE Scanner - Not implemented',
                  'Next.js - Not implemented',
                ]}
              />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Key Features</h2>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start">
                <span className="text-brand-green mr-3 text-xl">✓</span>
                <span><strong className="text-white">Multi-Language Support:</strong> TypeScript, JavaScript, Python, Java, Go, Rust, PHP, Ruby, Swift, Kotlin</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-green mr-3 text-xl">✓</span>
                <span><strong className="text-white">VS Code Integration:</strong> Real-time analysis in Problems Panel, auto-runs on file save</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-green mr-3 text-xl">✓</span>
                <span><strong className="text-white">ML Training:</strong> TensorFlow.js models for trust prediction and pattern recognition</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-green mr-3 text-xl">✓</span>
                <span><strong className="text-white">CLI Access:</strong> <code className="bg-black/30 px-2 py-1 rounded">odavl insight analyze</code></span>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <Link href="/console" className="inline-block px-8 py-3 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition text-lg font-semibold">
              Try Insight Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function DetectorList({ title, detectors }: { title: string; detectors: string[] }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      <ul className="space-y-2">
        {detectors.map((detector, idx) => (
          <li key={idx} className="text-gray-300 text-sm">• {detector}</li>
        ))}
      </ul>
    </div>
  );
}
