'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-red-600">Error</h1>
        <p className="mt-4 text-xl text-gray-900">Something went wrong!</p>
        <p className="mt-2 text-sm text-gray-600">{error.message}</p>
        <button
          onClick={() => reset()}
          className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
