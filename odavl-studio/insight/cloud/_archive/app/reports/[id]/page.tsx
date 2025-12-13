import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface ReportPageProps {
    params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
    const { id } = await params;

    const report = await prisma.report.findUnique({
        where: { id },
    });

    if (!report) {
        notFound();
    }

    const errors = await prisma.errorLog.findMany({
        where: { reportId: id },
        orderBy: { count: "desc" },
    });

    const summary = JSON.parse(report.summary);
    const metrics = JSON.parse(report.metrics);

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">📄 Report Details</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Project</p>
                        <p className="text-2xl font-semibold">{report.project}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Date</p>
                        <p className="text-2xl font-semibold">
                            {new Date(report.date).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-2xl font-semibold mb-3">Summary</h2>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto text-sm">
                        {JSON.stringify(summary, null, 2)}
                    </pre>
                </div>

                <div className="mb-6">
                    <h2 className="text-2xl font-semibold mb-3">Metrics</h2>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto text-sm">
                        {JSON.stringify(metrics, null, 2)}
                    </pre>
                </div>

                {errors.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-3">Errors</h2>
                        <div className="space-y-3">
                            {errors.map((error: any) => (
                                <div
                                    key={error.id}
                                    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-semibold text-red-700 dark:text-red-400">
                                            {error.type}
                                        </span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Count: {error.count}
                                        </span>
                                    </div>
                                    <p className="text-sm mb-2">{error.message}</p>
                                    {error.file && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            {error.file}
                                            {error.line && `:${error.line}`}
                                        </p>
                                    )}
                                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                        First seen: {new Date(error.firstSeen).toLocaleString()} |
                                        Last seen: {new Date(error.lastSeen).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
