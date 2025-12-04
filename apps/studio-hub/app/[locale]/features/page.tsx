import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

// Force dynamic rendering for i18n
export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('features');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function FeaturesPage() {
  const t = useTranslations('features');

  const products = [
    {
      id: 'insight',
      name: 'ODAVL Insight',
      icon: '🔍',
      tagline: 'ML-Powered Error Detection',
      description: 'Detects code issues before they become production problems using 12 specialized detectors and machine learning.',
      features: [
        'TypeScript & ESLint analysis',
        'Import & circular dependency detection',
        'Runtime & build error prediction',
        'Security vulnerability scanning',
        'Network & performance profiling',
        'Complexity analysis',
        'ML-powered error classification',
        'VS Code Problems Panel integration',
      ],
      detectors: [
        { name: 'TypeScript', description: 'Type errors, never types, strict mode violations' },
        { name: 'ESLint', description: 'Linting errors with auto-fix suggestions' },
        { name: 'Import', description: 'Missing modules, circular dependencies' },
        { name: 'Package', description: 'Dependency issues, version conflicts' },
        { name: 'Runtime', description: 'Potential runtime errors before execution' },
        { name: 'Build', description: 'Build failures and configuration issues' },
        { name: 'Security', description: 'CVE scanning, hardcoded secrets, OWASP Top 10' },
        { name: 'Circular', description: 'Circular import detection with graph visualization' },
        { name: 'Network', description: 'API endpoint issues, timeout detection' },
        { name: 'Performance', description: 'Memory leaks, slow operations' },
        { name: 'Complexity', description: 'Cyclomatic complexity, maintainability index' },
        { name: 'Isolation', description: 'Side effects, global state mutations' },
      ],
      stats: {
        accuracy: '94%',
        detectors: '12',
        languages: 'TypeScript, JavaScript, Python, Java',
        speed: '<1s per file',
      },
    },
    {
      id: 'autopilot',
      name: 'ODAVL Autopilot',
      icon: '🤖',
      tagline: 'Self-Healing Code Infrastructure',
      description: 'Automatically fixes code issues following the O-D-A-V-L cycle with triple-layer safety and cryptographic attestation.',
      features: [
        'Observe: Metrics collection via ESLint + TypeScript',
        'Decide: Recipe selection with trust scoring',
        'Act: Safe edits with undo snapshots',
        'Verify: Quality gates enforcement',
        'Learn: ML feedback loop for recipe improvement',
        'Risk Budget Guard (max 10 files, 40 LOC)',
        'Protected path validation',
        'Cryptographic attestation chain',
      ],
      phases: [
        { name: 'Observe', description: 'Collect quality metrics from linters and type checkers' },
        { name: 'Decide', description: 'Select highest-trust recipe based on past success' },
        { name: 'Act', description: 'Execute improvements with undo snapshots' },
        { name: 'Verify', description: 'Enforce quality gates and verify improvements' },
        { name: 'Learn', description: 'Update trust scores based on outcomes' },
      ],
      stats: {
        safetyLayers: '3',
        maxFiles: '10 per cycle',
        maxLOC: '40 per file',
        trustScoring: '0.1-1.0 range',
      },
    },
    {
      id: 'guardian',
      name: 'ODAVL Guardian',
      icon: '🛡️',
      tagline: 'Pre-Deploy Testing & Monitoring',
      description: 'Comprehensive testing dashboard with accessibility, performance, and security validation before deployment.',
      features: [
        'Accessibility testing (axe-core + Lighthouse)',
        'Performance monitoring (Core Web Vitals)',
        'Security scanning (OWASP Top 10, CSP validation)',
        'Quality gate enforcement',
        'Multi-environment support (staging, production)',
        'Real-time monitoring with alerts',
        'Historical trend analysis',
        'CI/CD pipeline integration',
      ],
      tests: [
        { name: 'Accessibility', description: 'axe-core + Lighthouse for WCAG compliance' },
        { name: 'Performance', description: 'TTFB, LCP, FID, CLS monitoring' },
        { name: 'Security', description: 'SSL/TLS checks, CSP validation, OWASP scanning' },
        { name: 'SEO', description: 'Meta tags, structured data, sitemap validation' },
      ],
      stats: {
        testTypes: '4',
        environments: 'Staging + Production',
        alerting: 'Real-time',
        integration: 'CI/CD ready',
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Powerful Features for Modern Development
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12">
          Three integrated products for autonomous code quality: ML-powered error detection, self-healing infrastructure, and comprehensive pre-deploy testing.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/pricing"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Free Trial
          </Link>
          <Link
            href="/docs"
            className="border border-gray-300 dark:border-gray-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            View Documentation
          </Link>
        </div>
      </section>

      {/* Product Cards */}
      <section className="container mx-auto px-4 py-12">
        <div className="space-y-24">
          {products.map((product, index) => (
            <div
              key={product.id}
              className={`flex flex-col ${
                index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
              } gap-12 items-center`}
            >
              {/* Product Info */}
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-6xl">{product.icon}</span>
                  <div>
                    <h2 className="text-4xl font-bold">{product.name}</h2>
                    <p className="text-xl text-blue-600 dark:text-blue-400">{product.tagline}</p>
                  </div>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-300">{product.description}</p>

                {/* Key Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {product.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  {Object.entries(product.stats).map(([key, value]) => (
                    <div key={key} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {value}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Details */}
              <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold mb-6">
                  {product.id === 'insight' && 'Available Detectors'}
                  {product.id === 'autopilot' && 'O-D-A-V-L Phases'}
                  {product.id === 'guardian' && 'Test Categories'}
                </h3>
                <div className="space-y-4">
                  {(product.detectors || product.phases || product.tests || []).map((item, i) => (
                    <div key={i} className="border-l-4 border-blue-600 pl-4 py-2">
                      <h4 className="font-semibold text-lg">{item.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Feature</th>
                <th className="px-6 py-4 text-center font-semibold">Insight</th>
                <th className="px-6 py-4 text-center font-semibold">Autopilot</th>
                <th className="px-6 py-4 text-center font-semibold">Guardian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[
                { feature: 'Error Detection', insight: true, autopilot: true, guardian: true },
                { feature: 'Automated Fixes', insight: false, autopilot: true, guardian: false },
                { feature: 'ML-Powered Analysis', insight: true, autopilot: true, guardian: false },
                { feature: 'VS Code Integration', insight: true, autopilot: true, guardian: true },
                { feature: 'CLI Access', insight: true, autopilot: true, guardian: true },
                { feature: 'Trust Scoring', insight: false, autopilot: true, guardian: false },
                { feature: 'Undo Snapshots', insight: false, autopilot: true, guardian: false },
                { feature: 'Accessibility Testing', insight: false, autopilot: false, guardian: true },
                { feature: 'Performance Monitoring', insight: true, autopilot: false, guardian: true },
                { feature: 'Security Scanning', insight: true, autopilot: false, guardian: true },
                { feature: 'Multi-Language Support', insight: true, autopilot: true, guardian: true },
                { feature: 'Cryptographic Attestation', insight: false, autopilot: true, guardian: false },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 font-medium">{row.feature}</td>
                  <td className="px-6 py-4 text-center">
                    {row.insight ? (
                      <span className="text-green-600 dark:text-green-400 text-2xl">✓</span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {row.autopilot ? (
                      <span className="text-green-600 dark:text-green-400 text-2xl">✓</span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {row.guardian ? (
                      <span className="text-green-600 dark:text-green-400 text-2xl">✓</span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="container mx-auto px-4 py-16 bg-gray-100 dark:bg-gray-800 rounded-xl my-12">
        <h2 className="text-4xl font-bold text-center mb-12">Technical Specifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Supported Languages',
              items: ['TypeScript', 'JavaScript', 'Python', 'Java', 'React', 'Node.js'],
            },
            {
              title: 'Integration',
              items: ['VS Code Extension', 'CLI Tools', 'GitHub Actions', 'CI/CD Pipelines', 'REST API', 'SDK'],
            },
            {
              title: 'Deployment',
              items: ['Cloud (SaaS)', 'Self-Hosted', 'Docker', 'Kubernetes', 'Monorepo Support', 'pnpm Workspaces'],
            },
          ].map((spec, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4">{spec.title}</h3>
              <ul className="space-y-2">
                {spec.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400">▸</span>
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Development Workflow?</h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Start with our free tier and experience autonomous code quality today.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/pricing"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
          >
            View Pricing Plans
          </Link>
          <Link
            href="/docs"
            className="border border-gray-300 dark:border-gray-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Read Documentation
          </Link>
        </div>
      </section>
    </div>
  );
}
