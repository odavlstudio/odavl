export default function MarketplacePage() {
  const packages = [
    { name: 'Python Security Scanner', type: 'detector', downloads: 1240 },
    { name: 'Auto-fix Unused Imports', type: 'recipe', downloads: 890 },
    { name: 'Accessibility Rules', type: 'rule', downloads: 670 },
  ];

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Marketplace</h1>
        <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold">
          Publish Package
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.name} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-primary uppercase">{pkg.type}</span>
              <span className="text-sm text-gray-500">{pkg.downloads} downloads</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">{pkg.name}</h3>
            <p className="text-gray-600 text-sm mb-4">
              Description placeholder for {pkg.name.toLowerCase()}
            </p>
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg font-medium">
              Install
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
