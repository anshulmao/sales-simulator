import { NextResponse } from "next/server";
import { buyerSessionConfig, buildInstructions } from "@/lib/buyerPersona";

// Server-only. Holds the real API key and mints a short-lived ephemeral client
// secret for the browser. The key must NEVER reach the client.
//
// Session config (voice, instructions, turn detection) is set HERE, at creation
// time. Instructions come from lib/buyerPersona.ts.
export const runtime = "nodejs";

const MODEL = "gpt-realtime-2.1";

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY is not set on the server. Add it to .env.local (no NEXT_PUBLIC_ prefix) and restart the dev server.",
      },
      { status: 500 }
    );
  }

  // Nested session shape per the current Realtime API:
  //  - audio.output.voice          -> fixed voice for the session
  //  - audio.input.turn_detection  -> semantic VAD, which also gives us
  //                                   interruption (talking over the AI cuts it off)
  //  - audio.input.transcription   -> transcribes the USER's speech so the data
  //                                   channel emits user transcript events
  const sessionConfig = {
    session: {
      type: "realtime",
      model: MODEL,
      instructions: buildInstructions(buyerSessionConfig),
      output_modalities: ["audio"],
      audio: {
        input: {
          turn_detection: { type: "semantic_vad" },
          transcription: { model: "gpt-4o-mini-transcribe" },
        },
        output: { voice: buyerSessionConfig.voice },
      },
    },
  };

  try {
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

    // Surface the ACTUAL upstream error message and status. A bare 500 here is
    // the single biggest time sink in this build.
    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.error?.message ?? "OpenAI session creation failed.",
          upstream: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Unknown error minting token.",
      },
      { status: 500 }
    );
  }
}
