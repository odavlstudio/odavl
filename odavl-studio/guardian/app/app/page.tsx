export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4">
            🛡️ ODAVL Guardian v3.0
          </h1>
          <p className="text-2xl text-slate-400 mb-8">
            Validate → Fix → Launch with confidence
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/launch"
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-xl font-medium transition-colors"
            >
              🚀 Launch Center
            </a>
            <a
              href="/docs"
              className="bg-slate-800 hover:bg-slate-700 px-8 py-4 rounded-lg text-xl font-medium transition-colors"
            >
              📚 Documentation
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-slate-900 rounded-lg p-8 border border-slate-800">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-3">Smart Detection</h3>
            <p className="text-slate-400">
              Auto-detects VS Code extensions, Next.js apps, CLI tools, npm packages, and more
            </p>
          </div>
          <div className="bg-slate-900 rounded-lg p-8 border border-slate-800">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-2xl font-bold mb-3">Auto-Fix</h3>
            <p className="text-slate-400">
              Automatically fixes common issues like missing icons, configs, and build errors
            </p>
          </div>
          <div className="bg-slate-900 rounded-lg p-8 border border-slate-800">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-2xl font-bold mb-3">Launch Ready</h3>
            <p className="text-slate-400">
              Know exactly when your product is ready for deployment with readiness scores
            </p>
          </div>
        </div>

        {/* Supported Products */}
        <div className="bg-slate-900 rounded-lg p-8 border border-slate-800">
          <h2 className="text-3xl font-bold mb-6">Supported Product Types</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              '🧩 VS Code Extension',
              '⚡ Next.js Website',
              '🔧 CLI Application',
              '📦 npm Package',
              '☁️ Cloud Function',
              '🖥️ Node.js Server',
              '🎨 IDE Extension',
              '🔌 Serverless API',
            ].map((item) => (
              <div
                key={item}
                className="bg-slate-800 rounded-lg p-4 text-center hover:bg-slate-700 transition-colors"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
