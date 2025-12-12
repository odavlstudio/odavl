import Link from 'next/link';
import { Metadata } from 'next';
import { generateSEOMetadata } from '@/components/seo/Metadata';

export const metadata: Metadata = generateSEOMetadata({
  title: 'ODAVL Autopilot',
  description: 'Self-healing code infrastructure with O-D-A-V-L cycle: Observe, Decide, Act, Verify, Learn. Parallel execution, ML trust prediction, smart rollback with 85% space savings. Complete audit trails and governance.',
  keywords: ['autonomous fixes', 'self-healing code', 'automated refactoring', 'code automation', 'ML trust scoring'],
  canonical: '/products/autopilot',
});

export default function AutopilotPage() {
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
            <div className="text-6xl mb-4">🤖</div>
            <h1 className="text-5xl font-bold text-white mb-4">ODAVL Autopilot</h1>
            <p className="text-2xl text-brand-blue mb-6">Self-Healing Code Infrastructure</p>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Automatically fix code issues with complete audit trails, rollback capabilities, and ML-guided trust scoring.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">O-D-A-V-L Cycle</h2>
            <div className="space-y-4">
              <PhaseCard phase="Observe" description="Execute eslint and tsc, parse warnings/errors into metrics" />
              <PhaseCard phase="Decide" description="Load recipes, use ML predictor for trust scores, select highest-trust action" />
              <PhaseCard phase="Act" description="Parallel execution with dependency graph, save diff-based undo snapshot" />
              <PhaseCard phase="Verify" description="Re-run quality checks, enforce gates, write attestation if improved" />
              <PhaseCard phase="Learn" description="Update trust scores with ML-enhanced success/failure feedback" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Enhanced Features (2025)</h2>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start">
                <span className="text-brand-green mr-3 text-xl">✓</span>
                <span><strong className="text-white">Parallel Execution:</strong> Run independent recipes concurrently (2-4x faster)</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-green mr-3 text-xl">✓</span>
                <span><strong className="text-white">ML Trust Prediction:</strong> Neural network with 10 features for recipe success prediction</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-green mr-3 text-xl">✓</span>
                <span><strong className="text-white">Smart Rollback:</strong> Diff-based snapshots (85% space savings vs full copies)</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-green mr-3 text-xl">✓</span>
                <span><strong className="text-white">Safety Mechanisms:</strong> Risk budget, undo snapshots, attestation chain</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Governance & Safety</h2>
            <div className="grid md:grid-cols-2 gap-6 text-gray-300">
              <div>
                <h3 className="text-white font-bold mb-2">Risk Budget Guard</h3>
                <ul className="space-y-1 text-sm">
                  <li>• Max 10 files per cycle</li>
                  <li>• Max 40 LOC per file</li>
                  <li>• Protected paths enforcement</li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-bold mb-2">Audit Trail</h3>
                <ul className="space-y-1 text-sm">
                  <li>• SHA-256 attestations</li>
                  <li>• Complete ledger records</li>
                  <li>• Cryptographic proofs</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/console" className="inline-block px-8 py-3 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition text-lg font-semibold">
              Try Autopilot Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function PhaseCard({ phase, description }: { phase: string; description: string }) {
  return (
    <div className="bg-black/20 p-4 rounded-lg">
      <h3 className="text-white font-bold mb-1">{phase}</h3>
      <p className="text-gray-300 text-sm">{description}</p>
    </div>
  );
}
