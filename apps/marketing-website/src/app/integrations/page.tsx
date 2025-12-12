export default function IntegrationsPage() {
  const integrations = [
    { name: 'GitHub', category: 'Version Control', logo: '🐙' },
    { name: 'GitLab', category: 'Version Control', logo: '🦊' },
    { name: 'Bitbucket', category: 'Version Control', logo: '🪣' },
    { name: 'GitHub Actions', category: 'CI/CD', logo: '⚡' },
    { name: 'CircleCI', category: 'CI/CD', logo: '🔄' },
    { name: 'Jenkins', category: 'CI/CD', logo: '🤖' },
    { name: 'Slack', category: 'Communication', logo: '💬' },
    { name: 'Discord', category: 'Communication', logo: '🎮' },
    { name: 'Jira', category: 'Project Management', logo: '📋' },
    { name: 'Linear', category: 'Project Management', logo: '📐' },
    { name: 'Sentry', category: 'Monitoring', logo: '🔍' },
    { name: 'Datadog', category: 'Monitoring', logo: '📊' }
  ];

  const categories = Array.from(new Set(integrations.map(i => i.category)));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Integrations</h1>
          <p className="text-xl text-gray-600">Connect ODAVL with your favorite tools</p>
        </div>

        {categories.map((category) => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-bold mb-6">{category}</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {integrations
                .filter(i => i.category === category)
                .map((integration) => (
                  <div key={integration.name} className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition">
                    <div className="text-5xl mb-3">{integration.logo}</div>
                    <h3 className="font-semibold">{integration.name}</h3>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
