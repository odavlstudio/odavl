// ODAVL Insight Phase 12 – Recommend
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rankRecommendations, ensureSeedRecommendations } from "@/lib/recommender";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const signature = searchParams.get("signature");
        if (!signature) {
            return NextResponse.json({ ok: false, error: "missing signature" }, { status: 400 });
        }

        const sig = await prisma.errorSignature.findUnique({ where: { signature } });
        if (!sig) {
            return NextResponse.json({ ok: false, error: "not found" }, { status: 400 });
        }

        await ensureSeedRecommendations(sig.id);
        const ranked = await rankRecommendations(sig.id);
        const top3 = ranked.slice(0, 3).map((r: any) => ({
            id: r.id,
            hint: r.hint,
            confidence: r.confidence,
            source: r.source || "collective",
        }));

        return NextResponse.json({
            ok: true,
            hints: top3,
            rationale: `Top ${top3.length} recommendations based on ${sig.totalHits} occurrences`,
        });
    } catch (err: unknown) {
        return NextResponse.json(
            { ok: false, error: err instanceof Error ? err.message : "unknown" },
            { status: 500 }
        );
    }
}
