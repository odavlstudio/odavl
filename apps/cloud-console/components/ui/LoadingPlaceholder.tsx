interface LoadingPlaceholderProps {
  lines?: number;
  showBlock?: boolean;
  className?: string;
}

export default function LoadingPlaceholder({
  lines = 3,
  showBlock = false,
  className = '',
}: LoadingPlaceholderProps) {
  return (
    <div className={`animate-pulse space-y-4 ${className}`} role="status" aria-label="Loading">
      {showBlock && (
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        </div>
      ))}
      <span className="sr-only">Loading content...</span>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function LoadingTable() {
  return (
    <div className="space-y-2" role="status" aria-label="Loading table">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
        />
      ))}
      <span className="sr-only">Loading table data...</span>
    </div>
  );
}
