import Link from 'next/link';

export default function UseCasesPage() {
  const cases = [
    {
      title: 'Startups',
      description: 'Ship faster with limited resources',
      slug: 'startups',
      icon: '🚀'
    },
    {
      title: 'Enterprise',
      description: 'Scale quality across 100+ developers',
      slug: 'enterprise',
      icon: '🏢'
    },
    {
      title: 'Open Source',
      description: 'Maintain quality with volunteer contributors',
      slug: 'open-source',
      icon: '💚'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold mb-12 text-center">Use Cases</h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          {cases.map((c) => (
            <Link key={c.slug} href={`/use-cases/${c.slug}`}>
              <div className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition cursor-pointer">
                <div className="text-5xl mb-4">{c.icon}</div>
                <h2 className="text-2xl font-bold mb-2">{c.title}</h2>
                <p className="text-gray-600">{c.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
