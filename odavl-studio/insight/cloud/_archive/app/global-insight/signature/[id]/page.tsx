// ODAVL Insight Phase 12 – Dashboard
import { prisma } from "@/lib/prisma";
import { rankRecommendations, ensureSeedRecommendations } from "@/lib/recommender";
import { notFound } from "next/navigation";
import FeedbackButton from "./FeedbackButton";

export default async function SignatureDetailPage({ params }: { readonly params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sig = await prisma.errorSignature.findUnique({
        where: { id },
        include: {
            instances: {
                include: { project: true },
                orderBy: { timestamp: "desc" },
                take: 20,
            },
        },
    });

    if (!sig) notFound();

    await ensureSeedRecommendations(sig.id);
    const ranked = await rankRecommendations(sig.id);
    const top3 = ranked.slice(0, 3);

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Error Signature Detail</h1>

            <div className="bg-gray-50 p-4 rounded mb-6">
                <div className="text-sm text-gray-600">Signature</div>
                <div className="font-mono text-sm break-all mb-3">{sig.signature}</div>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <div className="text-xs text-gray-600">Type</div>
                        <div className="font-semibold">{sig.type}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-600">Total Hits</div>
                        <div className="font-semibold">{sig.totalHits}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-600">Last Seen</div>
                        <div className="font-semibold">{new Date(sig.lastSeen).toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-semibold mb-3">Top Recommendations</h2>
            <div className="space-y-3 mb-6">
                {top3.map((rec: any) => (
                    <div key={rec.id} className="border p-4 rounded">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">{rec.hint}</div>
                            <div className="ml-4 text-sm text-gray-500">
                                {(rec.confidence * 100).toFixed(0)}%
                            </div>
                        </div>
                        <div className="flex gap-2 text-xs text-gray-500 mb-2">
                            <span>✓ {rec.successCount}</span>
                            <span>✗ {rec.failCount}</span>
                            <span>Source: {rec.source || "collective"}</span>
                        </div>
                        <FeedbackButton hintId={rec.id} signature={sig.signature} />
                    </div>
                ))}
            </div>

            <h2 className="text-xl font-semibold mb-3">Recent Instances ({sig.instances.length})</h2>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2 text-left">Project</th>
                            <th className="p-2 text-left">Message</th>
                            <th className="p-2 text-left">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sig.instances.map((inst: any) => (
                            <tr key={inst.id} className="border-t">
                                <td className="p-2">{inst.project.name || inst.projectId}</td>
                                <td className="p-2">{inst.shortMessage}</td>
                                <td className="p-2">{new Date(inst.timestamp).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
