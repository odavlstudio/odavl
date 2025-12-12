export default function ChangelogPage() {
  const releases = [
    {
      version: '2.0.0',
      date: '2025-03-15',
      title: 'Public Launch',
      items: ['Marketing website', 'Onboarding flow', 'Free tier', 'VS Code extension']
    },
    {
      version: '1.9.0',
      date: '2025-02-01',
      title: 'Guardian v2.0',
      items: ['Visual regression', 'Multi-browser testing', 'Production monitoring']
    },
    {
      version: '1.8.0',
      date: '2025-01-15',
      title: 'Autopilot ML Enhancement',
      items: ['Neural network trust predictor', 'Parallel execution', 'Smart rollback']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold mb-8">Changelog</h1>
        
        <div className="space-y-8">
          {releases.map((release) => (
            <div key={release.version} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-2xl font-bold text-brand-blue">{release.version}</span>
                <span className="text-gray-500">{release.date}</span>
              </div>
              <h2 className="text-xl font-semibold mb-3">{release.title}</h2>
              <ul className="space-y-2">
                {release.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-brand-green">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
