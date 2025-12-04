// ODAVL Insight Phase 12 – Recommender
import { prisma } from "@/lib/prisma";

export async function rankRecommendations(signatureId: string) {
    const recommendations = await prisma.fixRecommendation.findMany({
        where: { signatureId },
        include: { signature: true },
    });

    const now = Date.now();
    return recommendations
        .map((rec: any) => {
            const recencyBoost =
                now - new Date(rec.signature.lastSeen).getTime() < 86400000 ? 0.3 : 0;
            const score =
                Math.log(rec.signature.totalHits + 1) +
                recencyBoost +
                (rec.successCount - rec.failCount) * 0.2;
            return { ...rec, score };
        })
        .sort((a: any, b: any) => b.score - a.score);
}

export async function ensureSeedRecommendations(signatureId: string) {
    const count = await prisma.fixRecommendation.count({ where: { signatureId } });
    if (count > 0) return;

    const sig = await prisma.errorSignature.findUnique({ where: { id: signatureId } });
    if (!sig) return;

    const hints: string[] = [];
    if (sig.type.includes("TypeError")) hints.push("Check type definitions and ensure variable is defined");
    if (sig.type.includes("ReferenceError")) hints.push("Verify variable is imported or declared in scope");
    if (sig.type.includes("SyntaxError")) hints.push("Review syntax near error location");
    if (hints.length === 0) hints.push("Review error context and stack trace");

    await prisma.fixRecommendation.createMany({
        data: hints.slice(0, 2).map((hint) => ({
            signatureId,
            hint,
            confidence: 0.5,
            source: "seed",
        })),
    });
}
