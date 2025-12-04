// Usage Progress Bar Component
// Displays usage metric with progress visualization

interface UsageProgressBarProps {
  label: string;
  used: number;
  limit: number;
}

export function UsageProgressBar({ label, used, limit }: UsageProgressBarProps) {
  const percentage = (used / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span
          className={`text-sm font-semibold ${
            isAtLimit
              ? 'text-red-600'
              : isNearLimit
              ? 'text-orange-600'
              : 'text-gray-900'
          }`}
        >
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isAtLimit
              ? 'bg-red-600'
              : isNearLimit
              ? 'bg-orange-500'
              : 'bg-blue-600'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
