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
    engagementHistory?: string;        // NEW: summary of prior calls → warm vs cold open
  };
  scenario: {
    salesStage: string;
    repGoal: string;
    environment?: string;              // NEW: "cold call" | "booked demo" | "trade show" …
  };
  seller?: {                           // NEW: who the rep is
    salesExperience?: string;          // "junior" | "experienced" | free text → difficulty
  };
  company?: {                          // NEW: what the rep sells (buyer needs this to object realistically)
    product?: string;
    brand?: string;
    marketPositioning?: string;
    salesPlaybook?: string;
  };
  sessionType?: "one-off" | "pipeline"; // NEW: currently a dead chip in setup
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
export type Report = {
  overall: number;
  headline: string;
  summary: string;
  voice: { clarity: number; pace: number; tone: number };
  scenario: { opening: number; discovery: number; o: number };
  keyMoments: { atMs: number; label: string; note: string }[];
  strengths: { title: string; detail: string }[];
  improvements: { title: string; detail: string }[];
  nextStep: string;
};
