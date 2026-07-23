# Twimbit Sales Simulator

Sales reps practise live cold calls against an AI buyer persona using the OpenAI
Realtime API over WebRTC. Three lanes are built in parallel: **frontend**, the
**WebRTC/voice client**, and the **backend** (this document).

## Backend lane scope

The browser talks to OpenAI's Realtime API **directly over WebRTC** — audio never
passes through our server. The backend exists for one reason: to hold
`OPENAI_API_KEY` and mint a short-lived ephemeral client secret the browser uses
to authenticate its WebRTC connection.

That is: one API route, a persona config, a prompt builder, and a rate limiter.

| File | Purpose |
| --- | --- |
| `app/api/session/route.ts` | `POST /api/session` — mints the ephemeral client secret |
| `lib/types.ts` | Locked shared contracts (`SessionConfig`, `TranscriptEntry`) |
| `lib/buyerPersona.ts` | `BUYER_PERSONA` — the one demo buyer (high resistance) |
| `lib/prompt.ts` | `buildPrompt(config)` — pure prompt builder |
| `lib/rateLimit.ts` | In-memory money-guard, 5 sessions/hour/IP |

## Setup

```bash
cp .env.local.example .env.local   # then paste your OPENAI_API_KEY into it
pnpm install
pnpm dev
```

`.env.local` is gitignored — never commit the key.

## Verify the route

```bash
curl -X POST http://localhost:3000/api/session
```

Expected `200`:

```json
{
  "client_secret": "ek_...",
  "expires_at": 1753300000,
  "session_id": "…uuid…",
  "config": { "persona": { … }, "scenario": { … }, "voice": "ash" }
}
```

Without a key set you get `500 {"error":"Server is not configured."}` — that still
confirms the route is wired; add the key to `.env.local` for the real `200`.

## Response contract (law — do not change the shape)

```ts
// POST /api/session — 200
{ client_secret: string; expires_at: number; session_id: string; config: SessionConfig }
// error
{ error: string }
```

## Tuning knobs

All at the top of `app/api/session/route.ts`. Change one at a time.

| Constant | Default | Effect |
| --- | --- | --- |
| `MODEL` | `gpt-realtime-2.1` | Realtime model |
| `SESSION_TTL_SECONDS` | `60` | Ephemeral token lifetime (10–7200) |
| `VAD_SILENCE_DURATION_MS` | `700` | Higher = buyer waits longer, interrupts less |
| `VAD_THRESHOLD` | `0.5` | Mic sensitivity for detecting speech |
| `INPUT_TRANSCRIPTION_MODEL` | `gpt-4o-mini-transcribe` | Transcribes the rep's own speech |

## Out of scope (descoped for the one-day build)

Database / persistence, auth, any React component or page, WebRTC / `RTCPeerConnection`
code, transcript storage, scoring / rubrics / reports, persona config UI, tests.

> The session already **enables** input + output transcription, so the frontend can
> collect the full transcript live. **Storing** it is the later scoring phase — not
> built yet. Ask before re-scoping it in; confirm the core call works first.
