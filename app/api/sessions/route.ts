import { NextResponse } from "next/server";
import type { SessionConfig, TranscriptEntry } from "@/lib/types";
import { insertSession, listSessions, isConfigured } from "@/lib/db";
import { scoreSession } from "@/lib/scoring";

// Server-only. Holds persistence for finished call sessions. Runs on Node so it
// can reach both Neon and the scoring model (which needs OPENAI_API_KEY).
export const runtime = "nodejs";

// POST /api/sessions — persist a finished call.
//
// SAVE-TIME SCORING (the "where does scoring run" decision): we score once, HERE,
// at save time, and store the Report on the row. That way /report and the history
// screen read a stable, already-scored record — no re-scoring on every view, and
// the history list can show scores without loading each transcript.
export async function POST(req: Request) {
  if (!isConfigured()) {
    // No DB yet — tell the client so it can fall back to its local store.
    return NextResponse.json(
      { error: "Persistence is not configured." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const b = body as {
    config?: SessionConfig;
    transcript?: TranscriptEntry[];
    endedAt?: number;
    durationMs?: number;
  };

  if (!b?.config?.persona) {
    return NextResponse.json(
      { error: "Missing session config." },
      { status: 400 }
    );
  }

  const config = b.config;
  const transcript = Array.isArray(b.transcript) ? b.transcript : [];
  const endedAt = Number(b.endedAt) || Date.now();
  const durationMs = Number(b.durationMs) || 0;
  const id = crypto.randomUUID();

  // Score at save time. If scoring fails (model error, empty call), we still
  // persist the transcript — report stays null and the report screen shows
  // "not scored yet" rather than the whole call being lost.
  let report = null;
  if (transcript.length > 0) {
    try {
      report = await scoreSession(config, transcript);
    } catch (err) {
      console.error("save-time scoring failed", err);
    }
  }

  try {
    await insertSession({ id, config, transcript, report, endedAt, durationMs });
  } catch (err) {
    console.error("session insert failed", err);
    return NextResponse.json(
      { error: "Could not save session." },
      { status: 500 }
    );
  }

  // Return the id (for the report navigation) and the fresh report (so the client
  // can render immediately without a second round-trip).
  return NextResponse.json({ id, report });
}

// GET /api/sessions — list past sessions for the history/progress screen.
export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Persistence is not configured." },
      { status: 503 }
    );
  }
  try {
    return NextResponse.json(await listSessions());
  } catch (err) {
    console.error("session list failed", err);
    return NextResponse.json(
      { error: "Could not list sessions." },
      { status: 500 }
    );
  }
}
