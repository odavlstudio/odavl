export default function EnterpriseUseCasePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold mb-4">ODAVL for Enterprise</h1>
        <p className="text-xl text-gray-600 mb-12">Scale quality across 100+ developers</p>

        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Enterprise Challenges</h2>
          <ul className="space-y-3 text-gray-700">
            <li>• Inconsistent code standards across teams</li>
            <li>• Compliance and audit requirements (SOC 2, GDPR)</li>
            <li>• Distributed teams in multiple time zones</li>
            <li>• Legacy codebases requiring modernization</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Enterprise Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">SSO/SAML Integration</h3>
              <p className="text-gray-600">Okta, Auth0, Azure AD support</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Audit Trail</h3>
              <p className="text-gray-600">Cryptographic attestation chain</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">On-Premise Deployment</h3>
              <p className="text-gray-600">Air-gapped installation available</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Custom SLA</h3>
              <p className="text-gray-600">99.9% uptime guarantee</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-brand-blue to-brand-purple text-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Contact Sales</h2>
          <p className="mb-4">Schedule a demo with our enterprise team</p>
          <button className="px-6 py-3 bg-white text-brand-blue rounded-lg font-semibold">
            Book Demo
          </button>
        </div>
      </div>
    </div>
  );
}
