export default function OpenSourceUseCasePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold mb-4">ODAVL for Open Source</h1>
        <p className="text-xl text-gray-600 mb-12">Maintain quality with volunteer contributors</p>

        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Open Source Challenges</h2>
          <p className="text-gray-700 mb-4">
            Maintainers spend hours reviewing PRs from contributors with varying skill levels. 
            Code quality suffers when volunteers have limited time.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">How ODAVL Helps</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-brand-green">✓</span>
              <span>Auto-review PRs with Insight detectors</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-green">✓</span>
              <span>Suggest fixes to contributors automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-green">✓</span>
              <span>Free tier supports 3 projects forever</span>
            </li>
          </ul>
        </div>

        <div className="bg-brand-green/10 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-brand-green">Always Free for OSS</h2>
          <p className="text-gray-700 mb-4">
            Public repositories get unlimited access to all features. 
            Apply for our Open Source Program.
          </p>
          <button className="px-6 py-3 bg-brand-green text-white rounded-lg font-semibold">
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
}
