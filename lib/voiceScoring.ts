import type { Report } from "./types";

// Server-only. Turns the rep's recorded call audio into the Report.voice block
// (clarity / pace / tone), filling the optional field the report screen already
// knows how to render.
//
// Same division of labour as lib/scoring.ts: the MODEL does one narrow thing —
// classify each rubric behavior as passed/not against the audio. CODE does all
// the arithmetic. The model never emits a score. Unlike the transcript rubric,
// audio judgments cannot cite a transcript entry id, so the evidence trail here
// is the recording itself (which we do not store — analysis is one-shot at call
// end).
//
// The audio contains ONLY the rep's microphone — the buyer's synthetic voice
// never reaches this pipeline — so every behavior is phrased about the speaker.

const MODEL = "gpt-4o-mini-audio-preview";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

// Denominators come from HERE, never from the model — identical rule to the
// transcript rubric. Behaviors are observable, audio-checkable yes/no signals.
const VOICE_RUBRIC: {
  dimension: keyof NonNullable<Report["voice"]>;
  behaviors: { id: string; text: string }[];
}[] = [
  {
    dimension: "clarity",
    behaviors: [
      { id: "clarity_articulation", text: "Words are articulated clearly, without mumbling or trailing off" },
      { id: "clarity_fillers", text: "Filler sounds (um, uh, like, you know) are rare rather than habitual" },
      { id: "clarity_complete_sentences", text: "Sentences are finished rather than abandoned midway" },
    ],
  },
  {
    dimension: "pace",
    behaviors: [
      { id: "pace_rate", text: "Speaking rate is comfortable to follow — neither rushed nor dragging" },
      { id: "pace_pauses", text: "The speaker pauses after questions and key points instead of talking over the silence" },
      { id: "pace_steady", text: "Pace stays steady across the call rather than audibly speeding up under pressure" },
    ],
  },
  {
    dimension: "tone",
    behaviors: [
      { id: "tone_confidence", text: "The speaker sounds confident rather than hesitant or apologetic" },
      { id: "tone_energy", text: "Energy is engaged and warm rather than flat or monotone" },
      { id: "tone_variation", text: "Intonation varies naturally with the content rather than sounding read or robotic" },
    ],
  },
];

const ALL_BEHAVIORS = VOICE_RUBRIC.flatMap((d) =>
  d.behaviors.map((b) => ({ dimension: d.dimension, ...b }))
);

// Structured Outputs schema built FROM the rubric so ids can never drift: one
// required boolean judgment per behavior, no extras allowed.
function buildResponseSchema() {
  const properties: Record<string, unknown> = {};
  for (const b of ALL_BEHAVIORS) {
    properties[b.id] = {
      type: "object",
      additionalProperties: false,
      required: ["passed"],
      properties: { passed: { type: "boolean" } },
    };
  }
  return {
    type: "object",
    additionalProperties: false,
    required: ALL_BEHAVIORS.map((b) => b.id),
    properties,
  };
}

async function requestVoiceJudgments(
  apiKey: string,
  wavBase64: string
): Promise<unknown> {
  const behaviorLines = ALL_BEHAVIORS.map(
    (b) => `- ${b.id} (${b.dimension}): ${b.text}`
  ).join("\n");

  const system =
    "You are a precise voice-delivery evaluator for sales calls. The audio " +
    "contains one speaker: a sales rep practising a call (the other side is " +
    "not in the recording, so silences are normal). You judge only the " +
    "specific, observable delivery behaviors you are given, strictly against " +
    "what you hear. You do not score, rank, or give opinions. For each " +
    "behavior, decide passed true or false. Judge conservatively: if you " +
    "cannot clearly hear evidence for a behavior, it did not pass.";

  const response = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: `Behaviors to judge:\n${behaviorLines}` },
            {
              type: "input_audio",
              input_audio: { data: wavBase64, format: "wav" },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "voice_judgments",
          strict: true,
          schema: buildResponseSchema(),
        },
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data?.error?.message ?? `Voice model request failed (${response.status}).`
    );
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Voice model returned no message content.");
  }
  try {
    return JSON.parse(content);
  } catch {
    throw new Error("Voice model returned content that was not valid JSON.");
  }
}

// Fails loudly on anything malformed — never returns partial data.
function validateJudgments(raw: unknown): Record<string, boolean> {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Voice response was not an object.");
  }
  const obj = raw as Record<string, unknown>;
  const result: Record<string, boolean> = {};
  for (const b of ALL_BEHAVIORS) {
    const entry = obj[b.id];
    if (typeof entry !== "object" || entry === null) {
      throw new Error(`Voice response missing judgment for "${b.id}".`);
    }
    const { passed } = entry as Record<string, unknown>;
    if (typeof passed !== "boolean") {
      throw new Error(`Judgment for "${b.id}" has a non-boolean "passed".`);
    }
    result[b.id] = passed;
  }
  return result;
}

// Per-dimension 0–10 score = round((passed / total) * 10) — the same formula
// as the transcript dimensions, so the two halves of the report are comparable.
function buildVoice(
  judgments: Record<string, boolean>
): NonNullable<Report["voice"]> {
  const dimScore = (dimension: string): number => {
    const behaviors = VOICE_RUBRIC.find((d) => d.dimension === dimension)!.behaviors;
    const passed = behaviors.filter((b) => judgments[b.id]).length;
    return Math.round((passed / behaviors.length) * 10);
  };
  return {
    clarity: dimScore("clarity"),
    pace: dimScore("pace"),
    tone: dimScore("tone"),
  };
}

export async function scoreVoice(
  wavBase64: string
): Promise<NonNullable<Report["voice"]>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set on the server.");
  }
  const raw = await requestVoiceJudgments(apiKey, wavBase64);
  return buildVoice(validateJudgments(raw));
}
