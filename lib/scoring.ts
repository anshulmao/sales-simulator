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
// `title` is a short label used for strengths/improvements/keyMoments; `text`
// is the observable criterion, reused verbatim as the detail line.
const RUBRIC: {
  dimension: ReportDimension;
  behaviors: { id: string; title: string; text: string }[];
}[] = [
  {
    dimension: "opening",
    behaviors: [
      { id: "opening_identified_self", title: "Introduced self and company", text: "Identified themselves and their company in their first turn" },
      { id: "opening_stated_purpose", title: "Stated the call's purpose", text: "Stated a reason for the call before pitching anything" },
      { id: "opening_checked_time", title: "Checked timing", text: "Checked it was a good time / asked permission to continue" },
    ],
  },
  {
    dimension: "discovery",
    behaviors: [
      { id: "discovery_open_questions", title: "Open-ended questions", text: "Asked at least two open-ended questions before presenting a solution" },
      { id: "discovery_followed_up", title: "Built on the buyer's words", text: "Referenced something the buyer said earlier (built on the buyer's words)" },
      { id: "discovery_quantified_pain", title: "Quantified the pain", text: "Surfaced a quantified pain point (a number, cost, or concrete impact)" },
    ],
  },
  {
    dimension: "objection",
    behaviors: [
      { id: "objection_acknowledged", title: "Acknowledged the objection", text: "Acknowledged the objection before responding" },
      { id: "objection_clarified", title: "Clarified before rebutting", text: "Asked a clarifying question about the objection instead of immediately rebutting" },
      { id: "objection_addressed", title: "Addressed the specific objection", text: "Response addressed the specific objection raised, not a canned pivot" },
    ],
  },
  {
    dimension: "closing",
    behaviors: [
      { id: "closing_proposed_next_step", title: "Proposed a next step", text: "Proposed a specific, concrete next step (named meeting, demo, or date)" },
      { id: "closing_got_commitment", title: "Secured a commitment", text: "Got an explicit commitment or agreement from the buyer" },
      { id: "closing_restated_value", title: "Restated value", text: "Restated value before asking for the next step" },
    ],
  },
];

// Flat view of every behavior with its owning dimension — the order the report
// evidence and derived lists are built in.
const ALL_BEHAVIORS: { dimension: ReportDimension; id: string; title: string; text: string }[] =
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

// -1 marks a value we did not measure. There is NO audio anywhere in this
// pipeline, so any 0–10 number for voice would be fabricated, not estimated.
// -1 is deliberately outside the 0–10 range so it cannot read as a real score;
// range-aware UI should render it as "not measured". The clean fix is to make
// Report.voice optional in the contract — a coordinated change to types.ts.
const VOICE_UNAVAILABLE = -1;

// Aggregate validated judgments into the Report. All arithmetic lives here;
// every field is derived from the rubric judgments, never asked of the model.
function buildReport(
  judgments: Record<string, Judgment>,
  transcript: TranscriptEntry[]
): Report {
  // Per-dimension 0–10 score = round((passed / total) * 10).
  const dimScore = (dimension: ReportDimension): number => {
    const behaviors = RUBRIC.find((d) => d.dimension === dimension)!.behaviors;
    const passed = behaviors.filter((b) => judgments[b.id].passed).length;
    return Math.round((passed / behaviors.length) * 10);
  };
  const opening = dimScore("opening");
  const discovery = dimScore("discovery");
  const objection = dimScore("objection");
  const closing = dimScore("closing");

  // A1 (team decision): closing is scored and counts toward overall even though
  // Report.scenario has no slot to display it — so overall is the mean of all
  // four coached dimensions, and won't equal the mean of the three visible bars.
  const overall = Math.round((opening + discovery + objection + closing) / 4);

  // `o` is objection — confirmed a truncation of "objection" in the Report
  // contract, not a distinct field. Closing is intentionally absent here (A1).
  const scenario = { opening, discovery, o: objection };

  // strengths/improvements: title from the rubric, detail = the observable
  // criterion verbatim. Placement (passed → strength, failed → improvement)
  // carries the valence; nothing is reframed or invented.
  const strengths = ALL_BEHAVIORS.filter((b) => judgments[b.id].passed).map((b) => ({
    title: b.title,
    detail: b.text,
  }));
  const improvements = ALL_BEHAVIORS.filter((b) => !judgments[b.id].passed).map((b) => ({
    title: b.title,
    detail: b.text,
  }));

  // keyMoments: only PASSED behaviors carry a cited transcript entry (failures
  // cite null by construction — see validateJudgments), so only they can be
  // timestamped. atMs is an offset from the first utterance, not epoch ms.
  const t0 = transcript.length > 0 ? transcript[0].timestamp : 0;
  const byId = new Map(transcript.map((e) => [e.id, e]));
  const keyMoments = ALL_BEHAVIORS.flatMap((b) => {
    const j = judgments[b.id];
    if (!j.passed || j.transcriptEntryId === null) return [];
    const entry = byId.get(j.transcriptEntryId);
    if (!entry) return [];
    return [{ atMs: entry.timestamp - t0, label: b.title, note: b.text }];
  });

  // headline/summary/nextStep: deterministic templates over the dimension scores
  // and counts. No free-floating model opinion.
  const dims: { name: ReportDimension; score: number }[] = [
    { name: "opening", score: opening },
    { name: "discovery", score: discovery },
    { name: "objection", score: objection },
    { name: "closing", score: closing },
  ];
  const best = dims.reduce((a, b) => (b.score > a.score ? b : a));
  const worst = dims.reduce((a, b) => (b.score < a.score ? b : a));
  const allTie = dims.every((d) => d.score === dims[0].score);

  const band =
    overall >= 8 ? "Strong call" : overall >= 5 ? "Solid call with clear gaps" : "Needs work";
  const headline = allTie
    ? band
    : `${band} — strongest on ${best.name}, weakest on ${worst.name}`;

  const passedCount = ALL_BEHAVIORS.filter((b) => judgments[b.id].passed).length;
  const summary =
    `Passed ${passedCount} of ${ALL_BEHAVIORS.length} coached behaviors. ` +
    `Strongest in ${best.name} (${best.score}/10); weakest in ${worst.name} (${worst.score}/10).`;

  // nextStep: the weakest dimension's first missed behavior, or — if nothing was
  // missed — push for harder practice.
  const worstBehaviors = RUBRIC.find((d) => d.dimension === worst.name)!.behaviors;
  const firstMiss = worstBehaviors.find((b) => !judgments[b.id].passed);
  const nextStep = firstMiss
    ? `Work on ${worst.name}: ${firstMiss.text}.`
    : "No coached behaviors missed — raise the difficulty with a higher-resistance buyer or tougher objections.";

  return {
    overall,
    headline,
    summary,
    voice: {
      clarity: VOICE_UNAVAILABLE,
      pace: VOICE_UNAVAILABLE,
      tone: VOICE_UNAVAILABLE,
    },
    scenario,
    keyMoments,
    strengths,
    improvements,
    nextStep,
  };
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
  return buildReport(judgments, transcript);
}
