// Upgrade Prompt Component
// Displays upgrade call-to-action for free plan users

export function UpgradePrompt() {
  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <p className="text-sm text-blue-800 mb-2">
        <strong>Upgrade to PRO</strong> for 100x more capacity
      </p>
      <button className="text-sm font-medium text-blue-600 hover:text-blue-700 underline">
        View Plans →
      </button>
    </div>
  );
}
