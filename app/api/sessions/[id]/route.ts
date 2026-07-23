import { NextResponse } from "next/server";
import { getSession, isConfigured } from "@/lib/db";

export const runtime = "nodejs";

// GET /api/sessions/:id — load one stored session (config + transcript + report)
// for the report screen. Returns the StoredSession shape the client expects.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> } // Next 15: params is async
) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Persistence is not configured." },
      { status: 503 }
    );
  }

  const { id } = await params;

  try {
    const session = await getSession(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }
    return NextResponse.json({
      id: session.id,
      config: session.config,
      transcript: session.transcript,
      report: session.report ?? undefined,
      endedAt: session.endedAt,
      durationMs: session.durationMs,
    });
  } catch (err) {
    console.error("session get failed", err);
    return NextResponse.json(
      { error: "Could not load session." },
      { status: 500 }
    );
  }
}
