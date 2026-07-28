// Shared data contracts — LOCKED across frontend / backend / AI layer.
// Do not change these shapes without coordinating; other people build against them.

// Produced by Phase 2 (setup), consumed by the session token route.
// This session hardcodes an instance in lib/buyerPersona.ts.
//
// The `?`-marked fields are ADDITIVE and OPTIONAL: setup captures them and they
// flow to the model, but buildInstructions (AI lane) only shapes behaviour with
// them once it references them. Optional = existing configs stay valid, so this
// change cannot break the backend or AI code that predates it.
export type SessionConfig = {
  persona: {
    role: string;
    industry: string;
    behaviour: string;
    resistance: "low" | "medium" | "high";
    engagementHistory?: string; // summary of prior calls → warm vs cold open
  };
  scenario: {
    salesStage: string;
    repGoal: string;
    environment?: string; // "cold call" | "booked demo" | "inbound enquiry" …
  };
  seller?: {
    salesExperience?: string; // tunes buyer difficulty / coaching level
  };
  company?: {
    // What the rep sells — gives the buyer realistic material to object to.
    product?: string;
    brand?: string;
    marketPositioning?: string;
    salesPlaybook?: string;
  };
  sessionType?: "one-off" | "pipeline";
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

// The four coached dimensions. Used by the scoring rubric (lib/scoring.ts) to
// tag each behavior; no longer referenced by Report.
export type ReportDimension = "opening" | "discovery" | "objection" | "closing";

// Produced by Phase 4, consumed by the Post-Call report screen (replaces its
// hardcoded placeholder). Scores are 0–10.
//
// voice is OPTIONAL: no audio flows through the scoring pipeline today, so a
// report without voice means "not measured" — the screen hides the panel. When
// audio analysis exists, populating it lights the panel back up. (This replaces
// the earlier -1 sentinel convention.)
// scenario.closing closes the A1 gap: overall is the mean of all four coached
// dimensions, and now all four are displayable.
export type Report = {
  overall: number;
  headline: string;
  summary: string;
  voice?: { clarity: number; pace: number; tone: number };
  scenario: { opening: number; discovery: number; o: number; closing: number };
  keyMoments: { atMs: number; label: string; note: string }[];
  strengths: { title: string; detail: string }[];
  improvements: { title: string; detail: string }[];
  nextStep: string;
};
