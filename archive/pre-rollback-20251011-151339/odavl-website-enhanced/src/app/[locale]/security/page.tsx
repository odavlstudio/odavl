import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security & Governance - ODAVL Studio',
  description: 'Learn about ODAVL autonomous safety model, risk budgets, and enterprise security policies.',
  keywords: ['security', 'governance', 'autonomous development', 'safety controls'],
  openGraph: {
    title: 'Security & Governance - ODAVL Studio',
    description: 'Enterprise-grade autonomous safety controls and security policies.',
  },
};

const securitySchema = {
  '@context': 'https://schema.org',
  '@type': 'SecurityPolicy',  
  name: 'ODAVL Security Policy',
  description: 'Autonomous code quality with enterprise-grade safety controls',
  enforcementDate: '2025-01-01',
  policyUrl: 'https://odavl.studio/security',
};

export default function SecurityPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(securitySchema) }}
      />
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Security & Governance at ODAVL</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-muted-foreground mb-8">
            ODAVL operates under strict autonomous safety controls, ensuring reliable code improvements while maintaining enterprise security standards.
          </p>

          <h2>Autonomous Safety Model</h2>
          <p>Our safety-first approach uses risk budgets, shadow verification, and comprehensive audit trails to ensure predictable, secure automation.</p>

          <h2>Security Policies</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 my-6">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-gray-300 px-4 py-2 text-left">Policy</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-gray-300 px-4 py-2 font-medium">Risk Budget</td><td className="border border-gray-300 px-4 py-2">Max 5 ESLint warnings, 0 TypeScript errors per change</td></tr>
                <tr><td className="border border-gray-300 px-4 py-2 font-medium">Protected Paths</td><td className="border border-gray-300 px-4 py-2">Critical files excluded from autonomous modification</td></tr>
                <tr><td className="border border-gray-300 px-4 py-2 font-medium">Shadow Verify</td><td className="border border-gray-300 px-4 py-2">All changes validated before application</td></tr>
                <tr><td className="border border-gray-300 px-4 py-2 font-medium">Attestation Logs</td><td className="border border-gray-300 px-4 py-2">Complete audit trail of decisions and changes</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}