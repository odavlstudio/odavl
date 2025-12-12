export default function StartupsUseCasePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold mb-4">ODAVL for Startups</h1>
        <p className="text-xl text-gray-600 mb-12">Ship faster with limited resources</p>

        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">The Challenge</h2>
          <p className="text-gray-700 mb-4">
            Startups need to move fast, but technical debt compounds quickly. With 5-20 engineers, 
            you can't afford dedicated QA or slow code reviews.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">The Solution</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-brand-green">✓</span>
              <span>Catch bugs before code review (40% time savings)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-green">✓</span>
              <span>Auto-fix common issues while you sleep</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-green">✓</span>
              <span>Pre-deploy testing prevents production fires</span>
            </li>
          </ul>
        </div>

        <div className="bg-brand-blue/10 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">ROI Calculator</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <div className="text-3xl font-bold text-brand-blue">40%</div>
              <div className="text-sm text-gray-600">Faster code reviews</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-purple">$1,600</div>
              <div className="text-sm text-gray-600">Monthly savings (10 devs)</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-green">5.3x</div>
              <div className="text-sm text-gray-600">ROI in first month</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
