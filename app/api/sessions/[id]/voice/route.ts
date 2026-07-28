import { NextResponse } from "next/server";
import { getSession, isConfigured, updateSessionReport } from "@/lib/db";
import { scoreVoice } from "@/lib/voiceScoring";

export const runtime = "nodejs";

// ~180 s of 16 kHz mono WAV is ≈ 5.7 MB → ≈ 7.7 MB base64. Anything past that
// is not a legitimate recording from our client.
const MAX_AUDIO_CHARS = 9_000_000;

// POST /api/sessions/:id/voice — analyze the rep's recorded call audio and
// merge the resulting voice block into the stored report. Body: { audio }
// (base64 WAV produced by lib/audio.ts).
//
// Best-effort by design: the caller fires this after save and ignores errors —
// a voice failure must never cost the transcript-based report. For DB sessions
// the merge happens here; for local fallback sessions the client merges the
// returned voice into its localStorage copy. If the session has no report yet
// (save-time scoring failed), the voice result is returned but not persisted —
// the one-shot recording is gone after this request, which is acceptable for
// an optional add-on panel.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let audio: unknown;
  try {
    ({ audio } = (await req.json()) as { audio?: unknown });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (typeof audio !== "string" || audio.length === 0) {
    return NextResponse.json({ error: "Missing audio payload." }, { status: 400 });
  }
  if (audio.length > MAX_AUDIO_CHARS) {
    return NextResponse.json({ error: "Audio payload too large." }, { status: 413 });
  }

  let voice: Awaited<ReturnType<typeof scoreVoice>>;
  try {
    voice = await scoreVoice(audio);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const notConfigured = message.includes("OPENAI_API_KEY");
    console.error("voice analysis failed", error);
    return NextResponse.json(
      {
        error: notConfigured
          ? "Voice analysis is not configured on the server."
          : "Voice analysis is temporarily unavailable.",
      },
      { status: notConfigured ? 503 : 502 }
    );
  }

  // Merge into the stored report where one exists. Failures here still return
  // the voice block — the client's local copy is the fallback.
  if (!id.startsWith("local-") && isConfigured()) {
    try {
      const session = await getSession(id);
      if (session?.report) {
        await updateSessionReport(id, { ...session.report, voice });
      }
    } catch (error) {
      console.error("voice merge into stored report failed", error);
    }
  }

  return NextResponse.json({ voice });
}
