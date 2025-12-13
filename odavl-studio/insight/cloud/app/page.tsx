export const dynamic = "force-dynamic";

export default function HomePage() {
    return (
        <main className="max-w-2xl mx-auto py-10">
            <h1 className="text-3xl font-semibold mb-4">Insight Cloud API</h1>
            <p className="text-base text-gray-700 dark:text-gray-200">
                Backend-only ingest service is running. Use the /api/insight/snapshot endpoint
                with an API key to store ZCC-compliant analysis metadata.
            </p>
        </main>
    );
}
