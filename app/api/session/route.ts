import { NextResponse } from "next/server";
import { buyerSessionConfig, buildInstructions } from "@/lib/buyerPersona";
import { checkRateLimit } from "@/lib/rateLimit";
import type { SessionConfig } from "@/lib/types";

// Server-only. Holds the real API key and mints a short-lived ephemeral client
// secret for the browser. The key must NEVER reach the client.
//
// The session config (voice, instructions, turn detection) is set HERE, at
// creation time. Instructions are compiled from the SessionConfig the client
// sends (produced by the Phase 2 setup screen); if none is sent we fall back to
// the hardcoded buyer.
export const runtime = "nodejs";

const MODEL = "gpt-realtime-2.1";

async function mintSession(apiKey: string, config: SessionConfig) {
  // Nested session shape per the current Realtime API:
  //  - audio.output.voice          -> fixed voice for the session
  //  - audio.input.turn_detection  -> semantic VAD (also gives interruption)
  //  - audio.input.transcription   -> transcribes the USER's speech
  const sessionConfig = {
    session: {
      type: "realtime",
      model: MODEL,
      instructions: buildInstructions(config),
      output_modalities: ["audio"],
      audio: {
        input: {
          turn_detection: { type: "semantic_vad" },
          transcription: { model: "gpt-4o-mini-transcribe" },
        },
        output: { voice: config.voice },
      },
    },
  };

  const response = await fetch(
    "https://api.openai.com/v1/realtime/client_secrets",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionConfig),
    }
  );
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

function missingKey() {
  return NextResponse.json(
    {
      error:
        "OPENAI_API_KEY is not set on the server. Add it to .env.local (no NEXT_PUBLIC_ prefix) and restart the dev server.",
    },
    { status: 500 }
  );
}

// Money-guard: cap sessions per IP so a stuck retry loop in another lane's code
// can't silently burn OpenAI credits. Not security — just a runaway backstop.
function rateLimited(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many sessions started. Try again in a bit." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds ?? 3600) },
      }
    );
  }
  return null;
}

async function handle(req: Request, config: SessionConfig) {
  const limited = rateLimited(req);
  if (limited) return limited;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return missingKey();

  try {
    const { ok, status, data } = await mintSession(apiKey, config);
    // Surface the ACTUAL upstream error message and status — a bare 500 here is
    // the single biggest time sink in this build.
    if (!ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "OpenAI session creation failed.", upstream: data },
        { status }
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error minting token." },
      { status: 500 }
    );
  }
}

// POST with { config: SessionConfig } — used by the call screen.
export async function POST(req: Request) {
  let config = buyerSessionConfig;
  try {
    const body = await req.json();
    if (body?.config) config = body.config as SessionConfig;
  } catch {
    // no/invalid body -> fall back to the hardcoded buyer
  }
  return handle(req, config);
}

// GET falls back to the hardcoded buyer (handy for a quick server-side check).
export async function GET(req: Request) {
  return handle(req, buyerSessionConfig);
}
