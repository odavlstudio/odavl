// ODAVL Insight Phase 12 – Dashboard
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function GlobalInsightPage() {
    const signatures = await prisma.errorSignature.findMany({
        orderBy: { totalHits: "desc" },
        take: 20,
    });

    const allRecs = await prisma.fixRecommendation.findMany();
    const totalSuccess = allRecs.reduce((sum: number, r: any) => sum + r.successCount, 0);
    const totalFail = allRecs.reduce((sum: number, r: any) => sum + r.failCount, 0);
    const globalAccuracy = totalSuccess + totalFail > 0
        ? (totalSuccess / (totalSuccess + totalFail)).toFixed(2)
        : "N/A";

    const top5 = signatures.slice(0, 5);

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Global Insight Dashboard</h1>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Total Signatures</div>
                    <div className="text-2xl font-bold">{signatures.length}</div>
                </div>
                <div className="bg-green-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Global Accuracy</div>
                    <div className="text-2xl font-bold">{globalAccuracy}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Total Hits</div>
                    <div className="text-2xl font-bold">{signatures.reduce((s: number, sig: any) => s + sig.totalHits, 0)}</div>
                </div>
            </div>

            <h2 className="text-xl font-semibold mb-4">Top 5 Error Signatures</h2>
            <div className="grid gap-4 mb-8">
                {top5.map((sig: any) => (
                    <Link key={sig.id} href={`/global-insight/signature/${sig.id}`} className="block p-4 border rounded hover:bg-gray-50">
                        <div className="font-mono text-sm text-gray-600 truncate">{sig.signature}</div>
                        <div className="flex justify-between mt-2">
                            <span className="text-sm">{sig.type}</span>
                            <span className="text-sm text-gray-500">{sig.totalHits} hits</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Last: {new Date(sig.lastSeen).toLocaleString()}</div>
                    </Link>
                ))}
            </div>

            <h2 className="text-xl font-semibold mb-4">All Signatures</h2>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2 text-left">Signature</th>
                            <th className="p-2 text-left">Type</th>
                            <th className="p-2 text-right">Hits</th>
                            <th className="p-2 text-left">Last Seen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {signatures.map((sig: any) => (
                            <tr key={sig.id} className="border-t hover:bg-gray-50">
                                <td className="p-2 font-mono text-xs truncate max-w-xs">
                                    <Link href={`/global-insight/signature/${sig.id}`} className="text-blue-600 hover:underline">
                                        {sig.signature}
                                    </Link>
                                </td>
                                <td className="p-2 text-sm">{sig.type}</td>
                                <td className="p-2 text-right">{sig.totalHits}</td>
                                <td className="p-2 text-sm">{new Date(sig.lastSeen).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
