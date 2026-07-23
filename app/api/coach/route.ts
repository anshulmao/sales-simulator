import { NextResponse } from "next/server";
import {
  buildCoachInput,
  COACH_INSTRUCTIONS,
  extractResponseText,
  normalizeSuggestion,
  parseCoachRequest,
} from "@/lib/coach";
import { checkCoachRateLimit } from "@/lib/coachRateLimit";

export const runtime = "nodejs";

const COACH_MODEL = process.env.OPENAI_COACH_MODEL ?? "gpt-5.6-luna";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const REQUEST_TIMEOUT_MS = 10_000;

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = checkCoachRateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Live guidance is refreshing too frequently." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds ?? 60),
        },
      }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return errorResponse("Live guidance is not configured.", 500);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid coaching request.", 400);
  }

  const request = parseCoachRequest(body);
  if (!request) return errorResponse("Invalid coaching request.", 400);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: COACH_MODEL,
        instructions: COACH_INSTRUCTIONS,
        input: buildCoachInput(request),
        max_output_tokens: 80,
        reasoning: { effort: "none" },
        text: { verbosity: "low" },
        store: false,
      }),
      signal: controller.signal,
    });

    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("OpenAI coaching request failed", response.status, data);
      return errorResponse("Live guidance could not refresh.", 502);
    }

    const suggestion = normalizeSuggestion(extractResponseText(data));
    if (!suggestion) {
      console.error("OpenAI coaching response was empty or invalid", data);
      return errorResponse("Live guidance returned an invalid response.", 502);
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return errorResponse("Live guidance timed out.", 504);
    }
    console.error("Live guidance request failed", error);
    return errorResponse("Live guidance could not refresh.", 502);
  } finally {
    clearTimeout(timeout);
  }
}
