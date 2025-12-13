'use client';

export const dynamic = "force-dynamic";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <main className="max-w-2xl mx-auto py-10">
          <h1 className="text-2xl font-semibold mb-2">Unexpected error</h1>
          <p className="text-base text-gray-700 dark:text-gray-200">{error.message}</p>
          <button
            onClick={reset}
            className="mt-4 px-4 py-2 rounded bg-gray-900 text-white"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
