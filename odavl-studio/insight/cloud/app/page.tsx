import Link from "next/link";

export default function HomePage() {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">Welcome to ODAVL Insight Cloud</h1>
            <p className="text-lg mb-8 text-gray-700 dark:text-gray-300">
                The global intelligence dashboard for all your ODAVL projects.
                Monitor errors, track trends, and learn from your entire ecosystem.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                    href="/dashboard"
                    className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition"
                >
                    <h2 className="text-2xl font-semibold mb-2">📊 Dashboard</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        View all projects, reports, and metrics in one place.
                    </p>
                </Link>
                <Link
                    href="/global-insight"
                    className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition"
                >
                    <h2 className="text-2xl font-semibold mb-2">🧠 Global Insight</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Explore collective intelligence across all ODAVL projects.
                    </p>
                </Link>
            </div>
        </div>
    );
}
