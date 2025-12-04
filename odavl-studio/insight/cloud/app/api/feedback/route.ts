// ODAVL Insight Phase 12 – Feedback
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { hintId, outcome } = body;

        if (!hintId || !["success", "fail"].includes(outcome)) {
            return NextResponse.json({ ok: false, error: "invalid input" }, { status: 400 });
        }

        const rec = await prisma.fixRecommendation.findUnique({ where: { id: hintId } });
        if (!rec) {
            return NextResponse.json({ ok: false, error: "hint not found" }, { status: 400 });
        }

        const update = outcome === "success"
            ? { successCount: { increment: 1 } }
            : { failCount: { increment: 1 } };

        const updated = await prisma.fixRecommendation.update({
            where: { id: hintId },
            data: update,
        });

        const total = updated.successCount + updated.failCount + 1;
        const confidence = Math.max(0, Math.min(0.99, 0.3 + updated.successCount / total));

        await prisma.fixRecommendation.update({
            where: { id: hintId },
            data: { confidence },
        });

        return NextResponse.json({ ok: true, confidence });
    } catch (err: unknown) {
        return NextResponse.json(
            { ok: false, error: err instanceof Error ? err.message : "unknown" },
            { status: 500 }
        );
    }
}
