// ODAVL Insight Phase 12 – Ingest
import { NextResponse } from "next/server";
import { InsightEventSchema } from "@/lib/insightSchema";
import { normalizeEvent } from "@/lib/normalize";
import { prisma } from "@/lib/prisma";

const rateLimits = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000;

export async function POST(req: Request) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        const now = Date.now();
        const key = `${ip}-${Math.floor(now / RATE_LIMIT_WINDOW)}`;
        if ((rateLimits.get(key) || 0) >= 100) {
            return NextResponse.json({ ok: false, error: "rate limit" }, { status: 429 });
        }
        rateLimits.set(key, (rateLimits.get(key) || 0) + 1);

        const body = await req.json();
        const parsed = InsightEventSchema.parse(body);
        const normalized = await normalizeEvent(parsed);

        const signature = await prisma.errorSignature.upsert({
            where: { signature: normalized.signature },
            update: { totalHits: { increment: 1 } },
            create: { signature: normalized.signature, type: normalized.type, totalHits: 1 },
        });

        const project = await prisma.project.upsert({
            where: { id: normalized.projectId },
            update: {},
            create: { id: normalized.projectId },
        });

        await prisma.errorInstance.create({
            data: {
                signatureId: signature.id,
                projectId: project.id,
                shortMessage: normalized.shortMessage,
                timestamp: new Date(normalized.timestamp),
            },
        });

        return NextResponse.json({ ok: true, signature: normalized.signature });
    } catch (err: unknown) {
        return NextResponse.json(
            { ok: false, error: err instanceof Error ? err.message : "unknown" },
            { status: 400 }
        );
    }
}
