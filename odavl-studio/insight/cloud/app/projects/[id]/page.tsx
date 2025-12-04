import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

interface ProjectPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { id } = await params;
    const projectId = decodeURIComponent(id);

    const reports = await prisma.report.findMany({
        where: { project: projectId },
        orderBy: { date: "desc" },
    });

    if (reports.length === 0) {
        notFound();
    }

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">📁 Project: {projectId}</h1>
            <p className="text-lg mb-8 text-gray-700 dark:text-gray-300">
                All reports for this project, ordered by date.
            </p>

            <div className="space-y-4">
                {reports.map((report: any) => {
                    const summary = JSON.parse(report.summary);
                    const metrics = JSON.parse(report.metrics);

                    return (
                        <div
                            key={report.id}
                            className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-2xl font-semibold">
                                    Report {new Date(report.date).toLocaleDateString()}
                                </h2>
                                <Link
                                    href={`/reports/${report.id}`}
                                    className="text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    View Details →
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400">Summary</p>
                                    <p className="font-medium">
                                        {summary.description || "No description"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400">Metrics</p>
                                    <p className="font-medium">
                                        {Object.keys(metrics).length} entries
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400">Created</p>
                                    <p className="font-medium">
                                        {new Date(report.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400">Updated</p>
                                    <p className="font-medium">
                                        {new Date(report.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
