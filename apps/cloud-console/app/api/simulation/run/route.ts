import { NextResponse } from "next/server";
import { runODAVLLoop } from "@odavl/odavl-brain/simulation/orchestrator";

export async function POST(req: Request) {
  try {
    const { projectPath } = await req.json();

    if (!projectPath) {
      return NextResponse.json({ error: "Missing projectPath" }, { status: 400 });
    }

    const result = await runODAVLLoop(projectPath);

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
