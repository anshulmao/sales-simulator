// Shared data contracts — LOCKED across frontend / backend / AI layer.
// Do not change these shapes without coordinating; other people build against them.

// Produced by Phase 2 (setup), consumed by the session token route.
// This session hardcodes an instance in lib/buyerPersona.ts.
export type SessionConfig = {
  persona: {
    role: string;
    industry: string;
    behaviour: string;
    resistance: "low" | "medium" | "high";
  };
  scenario: { salesStage: string; repGoal: string };
  voice: string;
};

// Produced by the call screen, consumed by Phase 4 scoring.
// The single most important contract in the product — clean structured data,
// NOT strings formatted for display. Rendering is the component's job.
export type TranscriptEntry = {
  role: "user" | "buyer";
  text: string;
  id: string;
  timestamp: number;
};

// The four coached dimensions. Also the keys of Report.breakdown, so evidence
// entries and breakdown scores can't drift apart.
export type ReportDimension = "opening" | "discovery" | "objection" | "closing";

// Produced by Phase 4 (evaluation model), consumed by the report screen.
// Scores are 0–10. The model classifies observable yes/no behaviors (evidence);
// code aggregates those into the breakdown and overall scores. Storing the
// evidence is what lets the report screen show its work instead of asserting
// a number with no trail — the whole point of aggregating in code.
export type Report = {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  breakdown: {
    opening: number;
    discovery: number;
    objection: number;
    closing: number;
  };
  // Optional for now: early reports may ship a score before the per-behavior
  // trail is wired up. Downstream must treat an empty/absent array as "no
  // evidence to show yet", not as an error.
  evidence?: {
    dimension: ReportDimension;
    behavior: string; // the checked behavior, e.g. "Asked ≥2 open questions before pitching"
    passed: boolean;
    transcriptEntryId: string; // references TranscriptEntry.id
  }[];
};
