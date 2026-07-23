import { NextResponse } from "next/server";
import {
  getSession,
  isConfigured,
  updateSessionReport,
} from "@/lib/db";
import { scoreSession } from "@/lib/scoring";
import type { SessionConfig, TranscriptEntry } from "@/lib/types";

export const runtime = "nodejs";

type RetryBody = {
  config?: SessionConfig;
  transcript?: TranscriptEntry[];
};

function scoringErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const notConfigured = message.includes("OPENAI_API_KEY");
  console.error("session scoring retry failed", error);
  return NextResponse.json(
    {
      error: notConfigured
        ? "Scoring is not configured on the server."
        : "Scoring is temporarily unavailable. Please try again.",
    },
    { status: notConfigured ? 503 : 502 }
  );
}

// POST /api/sessions/:id/score — idempotently score an unscored session.
// Database sessions are read and updated server-side. Local fallback sessions
// send their config/transcript in the request because the server never stored
// them.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (id.startsWith("local-")) {
    let body: RetryBody;
    try {
      body = (await req.json()) as RetryBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    if (
      !body.config?.persona ||
      !body.config.scenario ||
      !Array.isArray(body.transcript)
    ) {
      return NextResponse.json(
        { error: "Missing session config or transcript." },
        { status: 400 }
      );
    }
    if (body.transcript.length === 0) {
      return NextResponse.json(
        { error: "This session has no transcript to score." },
        { status: 422 }
      );
    }
    try {
      const report = await scoreSession(body.config, body.transcript);
      return NextResponse.json({ report });
    } catch (error) {
      return scoringErrorResponse(error);
    }
  }

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Persistence is not configured on the server." },
      { status: 503 }
    );
  }

  let session: Awaited<ReturnType<typeof getSession>>;
  try {
    session = await getSession(id);
  } catch (error) {
    console.error("session scoring retry load failed", error);
    return NextResponse.json(
      { error: "Could not load this session." },
      { status: 500 }
    );
  }
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
  if (session.report) {
    return NextResponse.json({ report: session.report });
  }
  if (session.transcript.length === 0) {
    return NextResponse.json(
      { error: "This session has no transcript to score." },
      { status: 422 }
    );
  }

  try {
    const report = await scoreSession(session.config, session.transcript);
    await updateSessionReport(id, report);
    return NextResponse.json({ report });
  } catch (error) {
    return scoringErrorResponse(error);
  }
}
