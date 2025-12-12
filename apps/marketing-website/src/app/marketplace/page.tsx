import Link from 'next/link';

export default function MarketplacePage() {
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
          <h1 className="text-5xl font-bold text-white text-center mb-6">ODAVL Marketplace</h1>
          <p className="text-xl text-gray-300 text-center mb-12 max-w-3xl mx-auto">
            Extend ODAVL with community packages, custom detectors, and third-party integrations.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <PackageCard
              name="Jira Integration"
              description="Automatically create Jira tickets from detected issues"
              author="ODAVL Team"
              downloads="1.2K"
              category="Integration"
            />
            <PackageCard
              name="Slack Reporter"
              description="Send detection reports to Slack channels"
              author="Community"
              downloads="850"
              category="Reporter"
            />
            <PackageCard
              name="Custom Security Detector"
              description="Enhanced security scanning for financial applications"
              author="SecureCode Inc"
              downloads="620"
              category="Analyzer"
            />
            <PackageCard
              name="React Detector"
              description="React-specific hooks and patterns analysis"
              author="ODAVL Team"
              downloads="2.1K"
              category="Analyzer"
            />
            <PackageCard
              name="GitHub Actions"
              description="CI/CD integration for GitHub workflows"
              author="ODAVL Team"
              downloads="1.8K"
              category="Integration"
            />
            <PackageCard
              name="Custom Formatter"
              description="Beautiful HTML reports with charts"
              author="Community"
              downloads="540"
              category="Reporter"
            />
          </div>

          <div className="mt-12 text-center">
            <Link href="/console" className="inline-block px-8 py-3 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition text-lg font-semibold">
              Browse All Packages
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function PackageCard({ name, description, author, downloads, category }: {
  name: string;
  description: string;
  author: string;
  downloads: string;
  category: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/20 transition">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-bold text-white">{name}</h3>
        <span className="text-xs bg-brand-blue/30 text-brand-blue px-2 py-1 rounded">{category}</span>
      </div>
      <p className="text-gray-300 mb-4">{description}</p>
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>by {author}</span>
        <span>{downloads} downloads</span>
      </div>
    </div>
  );
}
