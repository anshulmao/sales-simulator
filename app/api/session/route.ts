import { NextRequest, NextResponse } from "next/server";
import { BUYER_PERSONA } from "@/lib/buyerPersona";
import { buildPrompt } from "@/lib/prompt";
import { checkRateLimit } from "@/lib/rateLimit";

// This route runs on the Node.js runtime (Next.js default) so it can hold the
// server-only OPENAI_API_KEY. It never touches audio — its only job is to mint a
// short-lived ephemeral client secret the browser uses to open its own WebRTC
// connection to OpenAI. Audio never passes through us.

// ---------------------------------------------------------------------------
// Tunable knobs — change these FIRST when the call feels wrong. One at a time.
// ---------------------------------------------------------------------------
const MODEL = "gpt-realtime-2.1";

// Ephemeral token lifetime. The token only has to survive the WebRTC handshake;
// the session itself lives on after the token expires. 60s matches OpenAI's
// default and keeps the credential short-lived. Range allowed: 10–7200.
const SESSION_TTL_SECONDS = 60;

// Server VAD: how the model decides the rep has stopped talking. Higher
// silence_duration = the buyer waits longer before replying (fewer interruptions);
// lower = snappier but more likely to talk over the rep.
const VAD_THRESHOLD = 0.5;
const VAD_PREFIX_PADDING_MS = 300;
const VAD_SILENCE_DURATION_MS = 700;

// Transcribes the REP's own microphone audio. Without this the transcript is
// half-empty (buyer only) and useless to the later scoring phase. Easy to forget.
const INPUT_TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";

// Verified against current OpenAI docs (supersedes the old /v1/realtime/sessions).
const OPENAI_ENDPOINT = "https://api.openai.com/v1/realtime/client_secrets";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Our own misconfiguration — safe to surface, leaks nothing.
    return NextResponse.json(
      { error: "Server is not configured." },
      { status: 500 },
    );
  }

  // Rate limit per client IP. Not security — a money-guard against runaway retries.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many sessions started. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds ?? 3600) },
      },
    );
  }

  const sessionId = crypto.randomUUID();

  try {
    const openaiRes = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_after: { anchor: "created_at", seconds: SESSION_TTL_SECONDS },
        session: {
          type: "realtime",
          model: MODEL,
          instructions: buildPrompt(BUYER_PERSONA),
          audio: {
            input: {
              // Transcribe the rep's speech, not just the buyer's.
              transcription: { model: INPUT_TRANSCRIPTION_MODEL },
              turn_detection: {
                type: "server_vad",
                threshold: VAD_THRESHOLD,
                prefix_padding_ms: VAD_PREFIX_PADDING_MS,
                silence_duration_ms: VAD_SILENCE_DURATION_MS,
              },
            },
            output: {
              voice: BUYER_PERSONA.voice,
            },
          },
        },
      }),
    });

    if (!openaiRes.ok) {
      // Log the real reason server-side; never forward OpenAI's body to the client.
      const detail = await openaiRes.text();
      console.error("OpenAI client_secrets error", openaiRes.status, detail);
      return NextResponse.json(
        { error: "Could not start session." },
        { status: 502 },
      );
    }

    const data = await openaiRes.json();
    const clientSecret: unknown = data?.value;
    const expiresAt: unknown = data?.expires_at;

    if (typeof clientSecret !== "string" || typeof expiresAt !== "number") {
      console.error("Unexpected OpenAI response shape", data);
      return NextResponse.json(
        { error: "Could not start session." },
        { status: 502 },
      );
    }

    // Exactly the locked response contract — nothing more.
    return NextResponse.json({
      client_secret: clientSecret,
      expires_at: expiresAt,
      session_id: sessionId,
      config: BUYER_PERSONA,
    });
  } catch (err) {
    console.error("Session route threw", err);
    return NextResponse.json(
      { error: "Could not start session." },
      { status: 502 },
    );
  }
}
