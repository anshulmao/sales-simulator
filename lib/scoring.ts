import type {
  SessionConfig,
  TranscriptEntry,
  Report,
  ReportDimension,
} from "./types";

// Server-only. Reads OPENAI_API_KEY and must never run in the browser.
// Turns a finished transcript into a scored Report (Phase 4).
//
// Division of labour, deliberately: the MODEL does one narrow thing — classify
// each rubric behavior as passed/not against the transcript and cite the line
// that proves it. CODE does everything a number's defensibility rests on:
// counts, aggregation, strengths/improvements. The model never emits a score.
// See lib/types.ts (Report) for why the evidence trail matters.

const MODEL = "gpt-4o-mini";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

// The rubric is the source of truth. Denominators come from HERE, never from
// whatever the model returns — so a dropped judgment can't silently inflate a
// score. Editing this is a reviewed code diff, not a prompt tweak. The behaviors
// are the observable, transcript-checkable yes/no coaching signals.
const RUBRIC: {
  dimension: ReportDimension;
  behaviors: { id: string; text: string }[];
}[] = [
  {
    dimension: "opening",
    behaviors: [
      { id: "opening_identified_self", text: "Identified themselves and their company in their first turn" },
      { id: "opening_stated_purpose", text: "Stated a reason for the call before pitching anything" },
      { id: "opening_checked_time", text: "Checked it was a good time / asked permission to continue" },
    ],
  },
  {
    dimension: "discovery",
    behaviors: [
      { id: "discovery_open_questions", text: "Asked at least two open-ended questions before presenting a solution" },
      { id: "discovery_followed_up", text: "Referenced something the buyer said earlier (built on the buyer's words)" },
      { id: "discovery_quantified_pain", text: "Surfaced a quantified pain point (a number, cost, or concrete impact)" },
    ],
  },
  {
    dimension: "objection",
    behaviors: [
      { id: "objection_acknowledged", text: "Acknowledged the objection before responding" },
      { id: "objection_clarified", text: "Asked a clarifying question about the objection instead of immediately rebutting" },
      { id: "objection_addressed", text: "Response addressed the specific objection raised, not a canned pivot" },
    ],
  },
  {
    dimension: "closing",
    behaviors: [
      { id: "closing_proposed_next_step", text: "Proposed a specific, concrete next step (named meeting, demo, or date)" },
      { id: "closing_got_commitment", text: "Got an explicit commitment or agreement from the buyer" },
      { id: "closing_restated_value", text: "Restated value before asking for the next step" },
    ],
  },
];

// Flat view of every behavior with its owning dimension — the order the report
// evidence and derived lists are built in.
const ALL_BEHAVIORS: { dimension: ReportDimension; id: string; text: string }[] =
  RUBRIC.flatMap((d) => d.behaviors.map((b) => ({ dimension: d.dimension, ...b })));

// The model returns one of these per behavior id, and nothing else.
type Judgment = { passed: boolean; transcriptEntryId: string | null };

// Build the Structured Outputs JSON schema FROM the rubric so ids can never
// drift from it. One required property per behavior id, no extras allowed —
// the model is forced to judge every behavior; it cannot omit one to shrink a
// denominator, and it cannot invent an id.
function buildResponseSchema() {
  const properties: Record<string, unknown> = {};
  for (const b of ALL_BEHAVIORS) {
    properties[b.id] = {
      type: "object",
      additionalProperties: false,
      required: ["passed", "transcriptEntryId"],
      properties: {
        passed: { type: "boolean" },
        transcriptEntryId: { type: ["string", "null"] },
      },
    };
  }
  return {
    type: "object",
    additionalProperties: false,
    required: ALL_BEHAVIORS.map((b) => b.id),
    properties,
  };
}

function buildPrompt(config: SessionConfig, transcript: TranscriptEntry[]) {
  const { persona, scenario } = config;
  const behaviorLines = ALL_BEHAVIORS.map(
    (b) => `- ${b.id} (${b.dimension}): ${b.text}`
  ).join("\n");

  // Only the fields the judge needs — id anchors the citation, role/text are the
  // content. timestamp is irrelevant to the judgment.
  const transcriptForModel = transcript.map((e) => ({
    id: e.id,
    role: e.role,
    text: e.text,
  }));

  const system =
    "You are a precise sales-call evaluator. You judge only the specific, " +
    "observable behaviors you are given, strictly against the transcript. You " +
    "do not score, rank, or give opinions. For each behavior, decide passed " +
    "true or false. When passed is true, set transcriptEntryId to the id of the " +
    "single transcript entry (a rep/user turn) that best proves it. When passed " +
    "is false, set transcriptEntryId to null. Only ever cite an id that appears " +
    "in the transcript. Judge conservatively: if the evidence is not clearly in " +
    "the transcript, the behavior did not pass.";

  const user =
    `The rep is practising against this buyer.\n` +
    `Buyer: ${persona.role} in ${persona.industry}. Resistance: ${persona.resistance}.\n` +
    `Buyer behaviour: ${persona.behaviour}\n` +
    `Scenario: sales stage "${scenario.salesStage}"; the rep's goal was to ${scenario.repGoal}.\n\n` +
    `Behaviors to judge (the "user" role is the rep):\n${behaviorLines}\n\n` +
    `Transcript (JSON array, in order):\n${JSON.stringify(transcriptForModel)}`;

  return { system, user };
}

// Call the model once. Surfaces the real upstream error message rather than a
// bare 500 — same rule as app/api/session/route.ts.
async function requestJudgments(
  apiKey: string,
  config: SessionConfig,
  transcript: TranscriptEntry[]
): Promise<unknown> {
  const { system, user } = buildPrompt(config, transcript);

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
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "behavior_judgments",
          strict: true,
          schema: buildResponseSchema(),
        },
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data?.error?.message ?? `Scoring model request failed (${response.status}).`
    );
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Scoring model returned no message content.");
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("Scoring model returned content that was not valid JSON.");
  }
}

// Validate the parsed response into a typed, exhaustive map. Fails loudly on
// anything malformed — a missing id, a wrong-typed field, or a passed judgment
// citing an id that isn't in the transcript. Never returns partial data.
function validateJudgments(
  raw: unknown,
  transcript: TranscriptEntry[]
): Record<string, Judgment> {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Scoring response was not an object.");
  }
  const obj = raw as Record<string, unknown>;
  const transcriptIds = new Set(transcript.map((e) => e.id));
  const result: Record<string, Judgment> = {};

  for (const b of ALL_BEHAVIORS) {
    const entry = obj[b.id];
    if (typeof entry !== "object" || entry === null) {
      throw new Error(`Scoring response missing judgment for "${b.id}".`);
    }
    const { passed, transcriptEntryId } = entry as Record<string, unknown>;
    if (typeof passed !== "boolean") {
      throw new Error(`Judgment for "${b.id}" has a non-boolean "passed".`);
    }
    if (transcriptEntryId !== null && typeof transcriptEntryId !== "string") {
      throw new Error(
        `Judgment for "${b.id}" has a "transcriptEntryId" that is neither a string nor null.`
      );
    }
    // Hard-fail on an unresolvable citation: a passed behavior whose cited id
    // points nowhere is exactly the "number with no trail" we set out to avoid.
    if (passed && (transcriptEntryId === null || !transcriptIds.has(transcriptEntryId))) {
      throw new Error(
        `Judgment for "${b.id}" passed but cited a transcriptEntryId that is not in the transcript.`
      );
    }
    result[b.id] = {
      passed,
      transcriptEntryId: passed ? (transcriptEntryId as string) : null,
    };
  }

  return result;
}

// Aggregate validated judgments into the Report. All arithmetic lives here.
function buildReport(judgments: Record<string, Judgment>): Report {
  const evidence: NonNullable<Report["evidence"]> = ALL_BEHAVIORS.map((b) => ({
    dimension: b.dimension,
    behavior: b.text,
    passed: judgments[b.id].passed,
    transcriptEntryId: judgments[b.id].transcriptEntryId ?? "",
  }));

  // dimension score = round((passed / total) * 10)
  const breakdown = {} as Report["breakdown"];
  for (const d of RUBRIC) {
    const passed = d.behaviors.filter((b) => judgments[b.id].passed).length;
    const score = Math.round((passed / d.behaviors.length) * 10);
    breakdown[d.dimension] = score;
  }

  // overallScore = equal-weighted average of the four dimension scores.
  const dims: ReportDimension[] = ["opening", "discovery", "objection", "closing"];
  const overallScore = Math.round(
    dims.reduce((sum, d) => sum + breakdown[d], 0) / dims.length
  );

  // strengths/improvements are DERIVED from which behaviors passed — never asked
  // of the model. Every string is a rubric behavior, traceable to an evidence row.
  const strengths = ALL_BEHAVIORS.filter((b) => judgments[b.id].passed).map((b) => b.text);
  const improvements = ALL_BEHAVIORS.filter((b) => !judgments[b.id].passed).map((b) => b.text);

  return { overallScore, strengths, improvements, breakdown, evidence };
}

export async function scoreSession(
  config: SessionConfig,
  transcript: TranscriptEntry[]
): Promise<Report> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set on the server.");
  }

  const raw = await requestJudgments(apiKey, config, transcript);
  const judgments = validateJudgments(raw, transcript);
  return buildReport(judgments);
}
