export default function IntelligencePage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-4xl font-bold mb-8">AI Intelligence</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Error Predictions</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">High Risk Files</span>
              <span className="font-bold text-red-600">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Medium Risk Files</span>
              <span className="font-bold text-yellow-600">7</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Low Risk Files</span>
              <span className="font-bold text-green-600">42</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Quality Trends</h2>
          <p className="text-gray-600 mb-4">
            Your code quality has improved by <span className="font-bold text-green-600">12%</span> this week.
          </p>
          <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-gray-500">Chart placeholder</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">AI Recommendations</h2>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span className="text-gray-700">Consider refactoring UserService.ts - complexity score: 45</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span className="text-gray-700">Add tests for PaymentController.ts - coverage: 32%</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
