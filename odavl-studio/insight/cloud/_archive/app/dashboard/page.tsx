import { prisma } from "@/lib/prisma";
import Link from "next/link";

interface ProjectStats {
    project: string;
    totalReports: number;
    lastReport: Date;
    errorCount: number;
}

async function getProjectStats(): Promise<ProjectStats[]> {
    const reports = await prisma.report.findMany({
        orderBy: { date: "desc" },
    });

    const projectMap = new Map<string, ProjectStats>();

    for (const report of reports) {
        const existing = projectMap.get(report.project);
        const errors = await prisma.errorLog.count({
            where: { reportId: report.id },
        });

        if (!existing) {
            projectMap.set(report.project, {
                project: report.project,
                totalReports: 1,
                lastReport: report.date,
                errorCount: errors,
            });
        } else {
            existing.totalReports += 1;
            existing.errorCount += errors;
            if (report.date > existing.lastReport) {
                existing.lastReport = report.date;
            }
        }
    }

    return Array.from(projectMap.values());
}

export default async function DashboardPage() {
    const projects = await getProjectStats();

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">📊 Dashboard</h1>
            <p className="text-lg mb-8 text-gray-700 dark:text-gray-300">
                Overview of all ODAVL Insight projects and their latest reports.
            </p>

            {projects.length === 0 ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-2">No reports yet</h2>
                    <p className="text-gray-700 dark:text-gray-300">
                        Upload your first report using the ODAVL CLI or run the sync script.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Link
                            key={project.project}
                            href={`/projects/${encodeURIComponent(project.project)}`}
                            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition"
                        >
                            <h2 className="text-2xl font-semibold mb-2">{project.project}</h2>
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <p>
                                    <strong>Total Reports:</strong> {project.totalReports}
                                </p>
                                <p>
                                    <strong>Last Report:</strong>{" "}
                                    {new Date(project.lastReport).toLocaleDateString()}
                                </p>
                                <p>
                                    <strong>Errors:</strong> {project.errorCount}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
